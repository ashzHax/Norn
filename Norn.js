"use strict";

// setting
const CONFIGURATION_NORN_PATH = './setting.json';

// external module
const Discord     = require('discord.js');

// internal module
const FileSystem  = require('fs');
const Process     = require('process');
const Path        = require('path');

// custom module
const Function    = require('./Function.js');
const Command     = require('./Command.js');

// custom function
const log_console = require('./Log.js').log_console;
const log_event   = require('./Log.js').log_event;

// global constant
const Norn         = new Discord.Client();
const guildDataMap = new Map();

// setting variable
var CONFIGURATION_NORN_VAR;
var CONFIGURATION_GUILD_DIR_PATH;
var CONFIGURATION_LOG_DIR_PATH;

//////////////////////////////////////////////////
// Process Handling Function
//////////////////////////////////////////////////

// ashz : system process event check code
Process.on('exit', code =>
{
    switch(code)
    {
        case Function.CONFIG_FILE_NOT_FOUND:
        {
            log_console('Ending program with code 1900 (NO_CONFIG_FILE_FOUND)',null);
            break;
        }
        default:
        {
            log_console(`Ending program with unknown code ${code}`,null);
        }
    }
});

//////////////////////////////////////////////////
// Reading Configuration Files
//////////////////////////////////////////////////

// norn configuration
FileSystem.readFile(CONFIGURATION_NORN_PATH, (errorData,fileData) =>
{
    if(errorData) {
        console.log(errorData);
        Process.exit(Function.CONFIG_NORN_FILE_NOT_FOUND);
        return;
    }

    CONFIGURATION_NORN_VAR   = JSON.parse(fileData);
    CONFIGURATION_GUILD_DIR_PATH  = Path.join(__dirname,CONFIGURATION_NORN_VAR.guild_data_path);
    CONFIGURATION_LOG_DIR_PATH = Path.join(__dirname,CONFIGURATION_NORN_VAR.log_data_path);

    // login to Discord server
    Norn.login(CONFIGURATION_NORN_VAR.token_part1 + CONFIGURATION_NORN_VAR.token_part2 + CONFIGURATION_NORN_VAR.token_part3);
    
    // get saved per/guild data
    FileSystem.readdir(CONFIGURATION_GUILD_DIR_PATH,(errorData,lsData) =>
    {
        if(errorData) {
            console.log(errorData);
            Process.exit(Function.CONFIG_GUILD_DIR_NOT_FOUND);
            return;
        }

        lsData.forEach((fileName) =>
        {
            if(fileName.endsWith('.json')) {
                let configurationPath = Path.join(CONFIGURATION_GUILD_DIR_PATH,fileName);
                FileSystem.readFile(Path.join(CONFIGURATION_GUILD_DIR_PATH,fileName), (errorData,fileData) =>
                {
                    if(errorData) {
                        console.log(errorData);
                        // TODO ashz : change to log error, instead of ending entire program
                        Process.exit(Function.CONFIG_GUILD_FILE_NOT_FOUND);
                        return;
                    }

                    let jsonMap = JSON.parse(fileData);                 
                    let guildData =
                    {
                        STATIC:
                        {
                            guildName:           jsonMap.GUILD_NAME,
                            guildID:             jsonMap.GUILD_ID,
                            administratorList:   jsonMap.ADMINISTRATOR_LIST,
                        },
                        DYNAMIC:
                        {
                            Norn:                null,
                            systemChannel:       null,
                            configurationPath:   configurationPath,
                            logPath:             CONFIGURATION_LOG_DIR_PATH,
                        },
                        TB:
                        {
                            STATIC: 
                            {
                                volume:          jsonMap.TB.VOLUME,
                                loopSingle:      jsonMap.TB.LOOP_SINGLE,
                                loopQueue:       jsonMap.TB.LOOP_QUEUE,
                            },
                            DYNAMIC: 
                            {
                                textChannel:     null,
                                voiceChannel:    null,
                                voiceConnection: null,
                                queue:           [],
                                index:           0,
                                playing:         false,
                            },
                            PLAYLIST: jsonMap.TB.PLAYLIST,
                        },
                    };

                    guildDataMap.set(jsonMap.GUILD_ID,guildData);
                });	
            }
        });
    });
});

function saveGuildData(guildData)
{
    let finalizedData = {
        GUILD_ID             : guildData.STATIC.guildID,
        GUILD_NAME           : guildData.STATIC.guildName,
        ADMINISTRATOR_LIST   : guildData.STATIC.administratorList,
        TB: {
            VOLUME           : guildData.TB.STATIC.volume,
            LOOP_SINGLE      : guildData.TB.STATIC.loopSingle,
            LOOP_QUEUE       : guildData.TB.STATIC.loopQueue,
            PLAYLIST         : guildData.TB.PLAYLIST,
        }
    };

    const writeData = JSON.stringify(finalizedData,null,4);
    FileSystem.writeFile(guildData.DYNAMIC.configurationPath, writeData, (errorData) =>
    {
        if(errorData) {
            console.log(error);
            // TODO: change to log write error only, not finish
            Process.exit(Function.CONFIG_GUILD_WRITE_ERROR);
            return;
        }
    });
}

//////////////////////////////////////////////////
// Initial Variable Set
//////////////////////////////////////////////////

// command list help page
const helpEmbed = new Discord.MessageEmbed();
const commandList = [
    {command : "help",          data : {arg:"",                                                                                      info:"Show this list of commands."}},
    {command : "syscall(WIP)",  data : {arg:"[ ? ]",                                                                                 info:"Specialized commands, mostly for administrators."}},
    {command : "join",          data : {arg:"",                                                                                      info:"Bot joins your current voice channel."}},
    {command : "leave",         data : {arg:"",                                                                                      info:"Bot leaves whatever channel it's currently connected to."}},
    {command : "play",          data : {arg:"[ URL ] [ Volume ]",                                                                    info:"Immediately plays the track from the video of the URL."}},
    {command : "start",         data : {arg:"",                                                                                      info:"Starts the current track."}},
    {command : "stop",          data : {arg:"",                                                                                      info:"Stops the current track."}},
    {command : "pause",         data : {arg:"",                                                                                      info:"Pauses the current track."}},
    {command : "resume",        data : {arg:"",                                                                                      info:"Resumes the paused track."}},
    {command : "next",          data : {arg:"[ Count ]",                                                                             info:"Plays the next queued track. (Default: 1)"}},
    {command : "prev(WIP)",     data : {arg:"[ Count ]",                                                                             info:"Plays the previous queued track. (Default: 1)"}},
    {command : "add",           data : {arg:"[ URL ] [ Volume ]",                                                                    info:"Adds the URL data to the queue."}},
    {command : "remove",        data : {arg:"[ URL / Index ]",                                                                       info:"Removes the URL/Index data from the queue."}},
    {command : "clear",         data : {arg:"",                                                                                      info:"Clears the entire queue."}},
    {command : "loop(WIP)",     data : {arg:"[ single / queue ] [ on / off ]",                                                       info:"Edits the loop settings."}},
    {command : "setting(WIP)",  data : {arg:"[ def_vol / admin_list ] [ Volume / add / remove ]",                                    info:"Edits the bot general settings."}},
    {command : "playlist(WIP)", data : {arg:"[ create / delete / add / remove / queue ] [ Playlist Name ] [ URL / Index / Volume ]", info:"Playlist managment command."}},
];
helpEmbed
    .setColor(Function.html_sky)
    .setTitle('Command List')
    .setDescription('Semi-helpful list of commands used by Norn\nWIP = Work In Progress (It means DON\'T USE IT)')
    .setTimestamp();

commandList.forEach((element) => {
    helpEmbed.addField(`${element.command} ${element.data.arg}`,element.data.info,false);
});

//////////////////////////////////////////////////
// Bot Ready Event
//////////////////////////////////////////////////

Norn.on('ready', () =>
{
    Norn.guilds.cache.forEach(guildInstance =>
    {
        let guildData = guildDataMap.get(guildInstance.id);

        if(guildData == null) {
            let new_guildData =
            {
                STATIC:
                {
                    guildName:           guildInstance.name,
                    guildID:             guildInstance.id,
                    administratorList:   [],
                },
                DYNAMIC:
                {
                    Norn:                Norn,
                    systemChannel:       guildInstance.systemChannel,
                    configurationPath:   Path.join(CONFIGURATION_GUILD_DIR_PATH, (guildInstance.id+'.json')),
                    logPath:             CONFIGURATION_LOG_DIR_PATH,
                },
                TB:
                {
                    STATIC: 
                    {
                        volume:          CONFIGURATION_NORN_VAR.default_volume,
                        loopSingle:      CONFIGURATION_NORN_VAR.default_loop_single,
                        loopQueue:       CONFIGURATION_NORN_VAR.default_loop_queue,
                    },
                    DYNAMIC: 
                    {
                        textChannel:     null,
                        voiceChannel:    null,
                        voiceConnection: null,
                        queue:           [],
                        index:           0,
                        playing:         false,
                    },
                    PLAYLIST: null,
                },
            };
            guildDataMap.set(guildInstance.id,new_guildData);
            saveGuildData(new_guildData);
        }
        else {
            guildData.DYNAMIC.Norn          = Norn;
            guildData.DYNAMIC.systemChannel = guildInstance.systemChannel;
            saveGuildData(guildData);
        }
    });
    log_event('BOT_READY', null, null);
});

//////////////////////////////////////////////////
// Event Handler: Channel
//////////////////////////////////////////////////

Norn.on('channelCreate', eventChannel =>
    log_event('CHANNEL_CREATE', eventChannel, guildDataMap.get(eventChannel.guild.id)));

Norn.on('channelDelete', eventChannel =>
    log_event('CHANNEL_DELETE', eventChannel, guildDataMap.get(eventChannel.guild.id)));

Norn.on('channelPinsUpdate', (eventChannel,eventDate) =>
    log_event('CHANNEL_PINS_UPDATE', [eventChannel,eventDate], guildDataMap.get(eventChannel.guild.id)));

Norn.on('channelUpdate', (previousChannel,newChannel) =>
    log_event('CHANNEL_UPDATE', [previousChannel,newChannel], guildDataMap.get(newChannel.guild.id)));

//////////////////////////////////////////////////
// Event Handler: Message
//////////////////////////////////////////////////

Norn.on('message', eventMessage => 
    log_event('MESSAGE', eventMessage, guildDataMap.get(eventMessage.guild.id)));

Norn.on('messageDelete', eventMessage =>
    log_event('MESSAGE_DELETE', eventMessage, guildDataMap.get(eventMessage.guild.id)));

// reference the first message to use as guild id
Norn.on('messageDeleteBulk', eventMessageCollection =>
    log_event('MESSAGE_DELETE_BULK', eventMessageCollection, guildDataMap.get(eventMessageCollection.first().guild.id)));

Norn.on('messageUpdate', (previousMessage,newMessage) =>
    log_event('MESSAGE_UPDATE', [previousMessage,newMessage], guildDataMap.get(newMessage.guild.id)));

Norn.on('messageReactionAdd', (eventMessageReaction,eventUser) => 
    log_event('MESSAGE_REACTION_ADD', [eventMessageReaction,eventUser], guildDataMap.get(eventMessageReaction.message.guild.id)));

Norn.on('messageReactionRemove', (eventMessageReaction,eventUser) => 
    log_event('MESSAGE_REACTION_DELETE', [eventMessageReaction,eventUser], guildDataMap.get(eventMessageReaction.message.guild.id)));

Norn.on('messageReactionRemoveAll', eventMessage =>
    log_event('MESSAGE_REACTION_REMOVE_ALL', eventMessage, guildDataMap.get(eventMessage.guild.id)));

/*
// this function is too buggy to use
Norn.on('typingStart', (eventChannel,eventUser) =>
    log_event('TYPING_START', [eventChannel,eventUser], guildDataMap.get(eventChannel.lastMessage.guild.id)));
*/
// Log is handled up to this point

//////////////////////////////////////////////////
// Event Handler: Guild/Role
//////////////////////////////////////////////////

Norn.on('roleCreate', eventRole => log_event('ROLE_CREATE', eventRole, guildDataMap.get(eventRole.guild.id)));

Norn.on('roleDelete', eventRole => log_event('ROLE_DELETE', eventRole, guildDataMap.get(eventRole.guild.id)));

Norn.on('roleUpdate', (previousRole,newRole) => log_event('ROLE_UPDATE', [previousRole,newRole], guildDataMap.get(newRole.guild.id)));

//////////////////////////////////////////////////
// Event Handler: Guild/Emoji
//////////////////////////////////////////////////

Norn.on('emojiCreate', eventGuildEmoji =>
    log_event('EMOJI_CREATE', eventGuildEmoji, guildDataMap.get(eventGuildEmoji.guild.id)));

Norn.on('emojiDelete', eventGuildEmoji =>
    log_event('EMOJI_DELETE', eventGuildEmoji, guildDataMap.get(eventGuildEmoji.guild.id)));

Norn.on('emojiUpdate', (previousGuildEmoji,newGuildEmoji) =>
    log_event('EMOJI_UPDATE', [previousGuildEmoji,newGuildEmoji], guildDataMap.get(newGuildEmoji.guild.id)));

//////////////////////////////////////////////////
// Event Handler: Guild/Member
//////////////////////////////////////////////////

Norn.on('guildBanAdd', (eventGuild,eventUser) =>
    log_event('GUILD_BAN_ADD', [eventGuild,eventUser], guildDataMap.get(eventGuild.id)));

Norn.on('guildBanRemove', (eventGuild,eventUser) =>
    log_event('GUILD_BAN_REMOVE', [eventGuild,eventUser], guildDataMap.get(eventGuild.id)));

Norn.on('guildMemberAdd', eventGuildMember =>
    log_event('GUILD_MEMBER_ADD', eventGuildMember, guildDataMap.get(eventGuildMember.guild.id)));

Norn.on('guildMemberRemove', eventGuildMember =>
    log_event('GUILD_MEMBER_REMOVE', eventGuildMember, guildDataMap.get(eventGuildMember.guild.id)));

Norn.on('guildMemberUpdate', (previousGuildMemeber,newGuildMember) =>
    log_event('GUILD_MEMBEr_UPDATE', [previousGuildMemeber,newGuildMember], guildDataMap.get(newGuildMember.guild.id)));

Norn.on('guildMemberAvailable', eventGuildMember => 
    log_event('GUILD_MEMBER_AVAILABLE', eventGuildMember, guildDataMap.get(eventGuildMember.guild.id)));

Norn.on('guildMembersChunk', (eventGuildMembers,eventGuild,eventData) =>
    log_event('GUILD_MEMBERS_CHUNK', [eventGuildMembers,eventGuild,eventData], guildDataMap.get(eventGuild.id)));

/*
// too many logs
Norn.on('guildMemberSpeaking', (eventGuildMember,eventReadOnlySpeaking) =>
    log_event('GUILD_MEMBER_SPEAKING', [eventGuildMember,eventReadOnlySpeaking], guildDataMap.get(eventGuildMember.guild.id)));
*/

//////////////////////////////////////////////////
// Event Handler: Guild/Management
//////////////////////////////////////////////////

Norn.on('guildCreate', eventGuild =>
    log_event('GUILD_CREATE', eventGuild, guildDataMap.get(eventGuild.id)));

Norn.on('guildDelete', eventGuild =>
    log_event('GUILD_DELETE', eventGuild, guildDataMap.get(eventGuild.id)));

Norn.on('guildUpdate', (previousGuild,newGuild) =>
    log_event('GUILD_UPDATE', [previousGuild,newGuild], guildDataMap.get(newGuild.id)));

Norn.on('guildUnavailable', eventGuild =>
    log_event('GUILD_UNAVAILABLE', eventGuild, guildDataMap.get(eventGuild.id)));

//////////////////////////////////////////////////
// Event Handler: User
//////////////////////////////////////////////////

Norn.on('userUpdate', (previousUser,newUser) =>
        log_event('USER_UPDATE', [previousUser,newUser], null));

Norn.on('presenceUpdate', (previousPresence,newPresence) =>
    log_event('PRESENCE_UPDATE', [previousPresence,newPresence], null));
    
/*
// TODO : use to check if Norn was moved around 
Norn.on('voiceStateUpdate', (previousVoiceState,newVoiceState) =>
    log_event('VOICE_STATE_UPDATE', [previousVoiceState,newVoiceState], guildDataMap.get(newVoiceState.guild.id)));
*/

//////////////////////////////////////////////////
// Event Handler: Other
//////////////////////////////////////////////////

Norn.on('disconnect', (eventAny,eventNumber) =>
    log_event('DISCONNECT', [eventAny,eventNumber], null));

Norn.on('warn', eventString =>
    log_event('WARN', eventString, null));

/*
// too many logs
Norn.on('debug', eventString =>
    log_event('DEBUG', eventString, null));
*/

Norn.on('error', eventError =>
    log_event('ERROR', eventError, null));

//////////////////////////////////////////////////
// Event Handler: Command
//////////////////////////////////////////////////

Norn.on('message', async function(eventMessage)
{
    if(eventMessage.author.bot) return;
    if(!eventMessage.content.startsWith('/')) return;

    let guildData = guildDataMap.get(eventMessage.guild.id);

    if(!guildData.STATIC.administratorList.includes(eventMessage.author.tag)) {
        log_event('COMMAND_NO_PERMISSION', eventMessage, guildData);
        return;
    }

    var commandArray = eventMessage.content.split(' ');
    commandArray[0] = commandArray[0].substring(1);

    if(eventMessage == null || guildData == null || commandArray == null) {
        log_event('COMMAND_DATA_NULL', eventMessage, guildData);
        if(!eventMessage.deleted) eventMessage.delete();
        return;
    }

    switch(commandArray[0].toLowerCase()) 
    {
        case 'delete':
        {
        	// TODO : ashz : implement into syscall command
			// Command.command_delete(eventMessage, commandArray, guildData);
            break;
        }
        case 'syscall':
        {
            //TODO : ashz
            //Command.command_syscall(eventMessage, commandArray, guildData);
            break;   
        }
        case 'help':
        {
            Command.command_help(eventMessage, commandArray, guildData, helpEmbed);
            break; 
        }
        case 'join':
        {
            Command.command_join(eventMessage, commandArray, guildData);
            break;
        }
        case 'leave':
        {
            Command.command_leave(eventMessage, guildData);
            break;
        }
        case 'pl':
        case 'play':
        {
            Command.command_play(eventMessage, commandArray, guildData);
            break;
        }
        case 'stop':
        {
            Command.command_stop(eventMessage, commandArray, guildData);
            break;
        }   
        case 'pause':
        {
            Command.command_pause(commandArray, guildData);
            break;
        }   
        case 'resume':
        {
            Command.command_resume(commandArray, guildData);
            break;
        }
        case 'clear':
        {
            Command.command_clear(eventMessage, guildData);
            break;   
        }
        case 'skip':
        case 'next':
		case 'jump':
        {
            Command.command_skip(eventMessage, commandArray, guildData);
            break;
        }
        case 'playlist':
        {
            Command.command_playlist(eventMessage, commandArray, guildData);
            break;
        }
        // TODO : restart command : restarts current track
        default:
        {
            log_event('COMMAND_UNKNOWN', eventMessage, guildData);
        }
    }

    if(!eventMessage.deleted) eventMessage.delete();
});
