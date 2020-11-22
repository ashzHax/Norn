"use strict";

// code setting
const CONFIGURATION_GUILD_DATA_FILE_PATH = './config.json';
const TRACK_BOT_DEFAULT_VOLUME = 5;
const NORN_MAIN_GUILD_ID = '687188236971671560';

// external module
const Discord =    require('discord.js');

// internal module
const FileSystem = require('fs');
const Process =    require('process');

// custom module
const AXC =        require('./Function.js');
const AXC_CMD =    require('./Command.js');
const LOG =        require('./Log.js');

// custom function
const log_event =  require('./Log.js').log_event;

// global constant
const Norn = new Discord.Client();
const sessionQueue = new Map();
const guildDataMap = new Map();

// extracted file list
var CONFIGURATION_GUILD_DATA;

//////////////////////////////////////////////////
// Process Handling Function
//////////////////////////////////////////////////

// system process event check code
Process.on('exit', code =>
{
    switch(code)
    {
        case AXC.NO_CONFIG_FILE_FOUND:
        {
            LOG.log_console("Ending program with code 1900 (NO_CONFIG_FILE_FOUND)");
            break;
        }
        default:
        {
            LOG.log_console(`Ending program with unknown code ${code}`);
        }
    }
});

//////////////////////////////////////////////////
// Initialize Bot
//////////////////////////////////////////////////

Norn.login('Njk5Njc5Nzk2Mjk2Mjg2MjQ3.XpX5lg.jQnu0QPeTOMpMilBWgC6JO_SH3k');

//////////////////////////////////////////////////
// Configuration Read
//////////////////////////////////////////////////

// read system configuration file
FileSystem.readFile(CONFIGURATION_GUILD_DATA_FILE_PATH, (errorData,fileData) =>
{    
    if(errorData) {
        console.log(errorData);
        Process.exit(AXC.NO_CONFIG_FILE_FOUND);
        return;
    }
    
    CONFIGURATION_GUILD_DATA = JSON.parse(fileData);

    Object.keys(CONFIGURATION_GUILD_DATA).forEach(guildID =>
    {
        /*
        let guildData =
        {
            Norn:              Norn,
            systemChannel:     null,
            name:              null,
            guildID:           guildID,
            administratorList: CONFIGURATION_GUILD_DATA[guildID].ADMINISTRATOR_LIST,
            TB_textChannel:    null,
            TB_voiceChannel:   null,
            TB_connection:     null,
            TB_queue:     [],
            TB_volume:         CONFIGURATION_GUILD_DATA[guildID].TRACK_BOT_DEFAULT_VOLUME,
            TB_playing:        false,
            TB_index:     0,
            TB_loopQueue:      true,
            TB_loopSingle:     false
        };
        */
        let TB_data = {
            textChannel:     null,
            voiceChannel:    null,
            voiceConnection: null,
            queue:           [],
            volume:          CONFIGURATION_GUILD_DATA[guildID].TRACK_BOT_DEFAULT_VOLUME,
            index:           0,
            playing:         false,
            loopSingle:      false,
            loopQueue:       true,
            playlist:        CONFIGURATION_GUILD_DATA[guildID].TRACK_BOT_PLAYLIST,
        };

        let guildData =
        {
            Norn:              Norn,
            systemChannel:     null,
            name:              null,
            guildID:           null,
            administratorList: CONFIGURATION_GUILD_DATA[guildID].ADMINISTRATOR_LIST,
            TB:                TB_data,
        };
        guildDataMap.set(guildID,guildData);
    });
});

//////////////////////////////////////////////////
// Bot Ready Event
//////////////////////////////////////////////////

Norn.on('ready', () =>
{
    Norn.guilds.cache.forEach(guildInstance =>
    {
        let guildData = guildDataMap.get(guildInstance.id);
        if(guildData != null) {
            guildData.systemChannel = guildInstance.systemChannel;
            guildData.name          = guildInstance.name;
        }
        else {
            /*
            guildData =
            {
                Norn:              Norn,
                systemChannel:     guildInstance.systemChannel,
                guildID:           guildInstance.id,
                administratorList: null,
                TB_textChannel:    null,
                TB_voiceChannel:   null,
                TB_connection:     null,
                TB_queue:     [],
                TB_volume:         TRACK_BOT_DEFAULT_VOLUME,
                TB_playing:        false,
                TB_index:     0,
                TB_loopQueue:      true,
                TB_loopSingle:     false
            };
            */
           let TB_data = {
                textChannel:     null,
                voiceChannel:    null,
                voiceConnection: null,
                queue:           [],
                volume:          TRACK_BOT_DEFAULT_VOLUME,
                index:           0,
                playing:         false,
                loopQueue:       true,
                loopSingle:      false,
                playlist:        {}
           };
            guildData =
            {
                Norn:              Norn,
                systemChannel:     guildInstance.systemChannel,
                guildID:           guildInstance.id,
                administratorList: null,
                TB:                TB_data,
            };
            
            guildDataMap.set(guildInstance.id,guildData);

            CONFIGURATION_GUILD_DATA[guildInstance.id] =
            {
                "TRACK_BOT_DEFAULT_VOLUME": TRACK_BOT_DEFAULT_VOLUME,
                "ADMINISTRATOR_LIST": ["ashz#3656"],
                "TB_PLAYLIST": {}
            }
    
            const writeData = JSON.stringify(CONFIGURATION_GUILD_DATA,null,4);
    
            FileSystem.writeFile(CONFIGURATION_GUILD_DATA_FILE_PATH,writeData,errorData =>
            {
                if(errorData) {
                    console.log(error);
                    Process.exit(AXC.CONFIG_WRITE_FAIL);
                    return;
                }
            });
        }
    });
    log_event('BOT_READY', null, guildDataMap.get(NORN_MAIN_GUILD_ID));
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
// this function is too bugy to use
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

    if(!guildData.administratorList.includes(eventMessage.author.tag)) {
        log_event('COMMAND_NO_PERMISSION', eventMessage, guildData);
        return;
    }

    var commandArray = eventMessage.content.split(' ');
    commandArray[0] = commandArray[0].substring(1);

    switch(commandArray[0].toLowerCase()) 
    {
        case 'delete':
        {
            AXC_CMD.command_delete(eventMessage,commandArray,guildDataMap.get(eventMessage.guild.id));
            break;
        }
        case 'join':
        {
            AXC_CMD.command_join(eventMessage,commandArray,guildDataMap.get(eventMessage.guild.id));
            break;
        }
        case 'leave':
        {
            AXC_CMD.command_leave(eventMessage,guildDataMap.get(eventMessage.guild.id));
            break;
        }
        case 'pl':
        case 'play':
        {
            AXC_CMD.command_play(eventMessage,commandArray,guildDataMap.get(eventMessage.guild.id));
            break;
        }
        case 'stop':
        {
            AXC_CMD.command_stop(guildDataMap.get(eventMessage.guild.id));
            break;
        }   
        case 'pause':
        {
            AXC_CMD.command_pause(guildDataMap.get(eventMessage.guild.id));
            break;
        }   
        case 'resume':
        {
            AXC_CMD.command_resume(guildDataMap.get(eventMessage.guild.id));
            break;
        }   
        case 'skip':
        case 'next':
        {
            AXC_CMD.command_skip(eventMessage,commandArray,guildDataMap.get(eventMessage.guild.id));
            break;
        }
        case 'syscall':
        {
            //TODO
            //AXC_CMD.command_syscall(eventMessage,commandArray,guildDataMap.get(eventMessage.guild.id));
            break;   
        }
        case 'playlist':
        {
            AXC_CMD.command_playlist(eventMessage,commandArray,guildDataMap.get(eventMessage.guild.id));
            break;
        }
        default:
        {
            log_event('COMMAND_UNKNOWN', eventMessage, guildData);
        }
    }

    if(!eventMessage.deleted) eventMessage.delete();
});
