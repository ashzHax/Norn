"use strict";

// external module
const Discord      = require('discord.js');

// internal module
const fs           = require('fs');
const process      = require('process');
const path         = require('path');

// custom module
const ExF          = require('./ExF.js');
const Command      = require('./Command.js');
const log_console  = require('./Log.js').log_console;
const log_event    = require('./Log.js').log_event;

// global constant
const CONFIG_NORN_FILE_PATH = './setting.json';
const CONFIG_GUILD_DIR_NAME = './config/';
const Norn                  = new Discord.Client();
const guildDataMap          = new Map();

// global variable
let CONFIG_NORN;
let CONFIG_GUILD_DIR_PATH;
let CONFIG_LOG_DIR_PATH;

//////////////////////////////////////////////////
// process 'exit' Event Handle
//////////////////////////////////////////////////

// ashz> custom system exit code
process.on('exit', code => {
    switch(code) {
        case ExF.NORN_FILE_NOT_FOUND:
        case ExF.GUILD_SETTING_FILE_NOT_FOUND:
        case ExF.GUILD_CONFIG_DIR_FAILED_TO_READ: 
        case ExF.GUILD_CONFIG_DIR_CREATE_FAIL: 
        case ExF.GUILD_SETTING_FILE_FAILED_TO_WRITE : {
            log_console(`[CRIT] Ending program. Error code: ${code}`, null);
            break;
        }
        default: {
            log_console(`[?] Ending program. Unknown error code: ${code}`, null);
        }
    }
});

//////////////////////////////////////////////////
// Init/Reading Configuration Files
//////////////////////////////////////////////////

// ashz> norn configuration read / guild configuration read
fs.readFile(CONFIG_NORN_FILE_PATH, (errorData, fileData) => {
    if(errorData) {
        console.error(errorData);
        process.exit(ExF.NORN_SETTING_FILE_NOT_FOUND);
    }

    CONFIG_NORN           = JSON.parse(fileData);
    CONFIG_GUILD_DIR_PATH = path.join(__dirname, CONFIG_GUILD_DIR_NAME);
    CONFIG_LOG_DIR_PATH   = path.join(__dirname, CONFIG_NORN.log_data_path);

    fs.mkdir(CONFIG_GUILD_DIR_PATH, (errorData) => {
        if(errorData) {
            // console.error(errorData);
            log_console(`[ALERT] Directory already exists. (${CONFIG_GUILD_DIR_PATH})`, null);
            // process.exit(ExF.GUILD_CONFIG_DIR_CREATE_FAIL);
        }
    });

    // ashz> login to Discord server
    Norn.login(CONFIG_NORN.tpo + CONFIG_NORN.tpt + CONFIG_NORN.tpth);
    
	// ashz> get saved per/guild data
    fs.readdir(CONFIG_GUILD_DIR_NAME, (errorData, dirData) => {
        if(errorData) {
            console.error(errorData);
			// ashz> better to exit, since client needs access to directory later
			//log_console('Failed reading guild config directory. (GUILD_DIR_FAILED_TO_READ)', null);
            process.exit(ExF.GUILD_DIR_FAILED_TO_READ);
        }

        dirData.forEach((dirName) => {
            let configDirPath  = path.join(CONFIG_GUILD_DIR_PATH, dirName);
            let configFilePath = path.join(configDirPath, CONFIG_NORN.guild_data_file);

			fs.readFile(configFilePath, (errorData, fileData) => {
				if(errorData) {
					console.error(errorData);
					log_console('[WARN] Unable to read a guild setting file.', null);
					return;
				}

				let settingData = JSON.parse(fileData);
				let guildData = {
                    // ashz> Static Data
                    guildName:           settingData.GUILD_NAME,
                    guildID:             dirName,
                    // ashz> Dynamic Data
                    Norn:                null,
                    systemChannel:       null,
                    configurationDir:    configDirPath,
                    configurationFile:   CONFIG_NORN.guild_data_file,
                    logPath:             CONFIG_LOG_DIR_PATH,
                    // ashz> Track Bot Data
					TB: {
                        // ashz> Static Data
                        volume:          settingData.TB.VOLUME,
                        loopSingle:      settingData.TB.LOOP_SINGLE,
                        loopQueue:       settingData.TB.LOOP_QUEUE,
                        playlist:        settingData.TB.PLAYLIST,
                        // ashz> Dynamic Data
                        textChannel:     null,
                        voiceChannel:    null,
                        voiceConnection: null,
                        queue:           [],
                        index:           0,
                        playing:         false,
                        paused:          false,
					},
				};
				guildDataMap.set(dirName, guildData);
			});	
        });
    });
});

//////////////////////////////////////////////////
// Initial Variable Set
//////////////////////////////////////////////////

log_console('[ALERT] Finished Data Handling, waiting on Discord API...',null);

//////////////////////////////////////////////////
// Bot Ready Event
//////////////////////////////////////////////////

Norn.on('ready', () => {
    Norn.guilds.cache.forEach(guildInstance => {
        let guildData = guildDataMap.get(guildInstance.id);
        if(guildData == null) {
            let new_guildData = {
                // ashz> Static Data
                guildName:           guildInstance.name,
                guildID:             guildInstance.id,
                // ashz> Dynamic Data
                Norn:                Norn,
                systemChannel:       guildInstance.systemChannel,
                configurationDir:    path.join(CONFIG_GUILD_DIR_PATH, guildInstance.id),
                configurationFile:   CONFIG_NORN.guild_data_file,
                logPath:             CONFIG_LOG_DIR_PATH,
                // ashz> Track Bot Data
                TB: {
                    // ashz> Static Data
                    volume:          CONFIG_NORN.default_volume,
                    loopSingle:      CONFIG_NORN.default_loop_single,
                    loopQueue:       CONFIG_NORN.default_loop_queue,
                    playlist:        {},
                    // ashz> Dynamic Data
                    textChannel:     null,
                    voiceChannel:    null,
                    voiceConnection: null,
                    queue:           [],
                    index:           0,
                    playing:         false,
                    paused:          false,
                },
            };
            guildDataMap.set(guildInstance.id, new_guildData);
            ExF.saveGuildData(new_guildData, true);
        } else {
            guildData.guildName     = guildInstance.name;
            guildData.guildID       = guildInstance.id;
            guildData.Norn          = Norn;
            guildData.systemChannel = guildInstance.systemChannel;
            ExF.saveGuildData(guildData);
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

Norn.on('channelPinsUpdate', (eventChannel, eventDate) =>
    log_event('CHANNEL_PINS_UPDATE', [eventChannel,eventDate], guildDataMap.get(eventChannel.guild.id)));

Norn.on('channelUpdate', (previousChannel, newChannel) =>
    log_event('CHANNEL_UPDATE', [previousChannel, newChannel], guildDataMap.get(newChannel.guild.id)));

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

Norn.on('messageUpdate', (previousMessage, newMessage) =>
    log_event('MESSAGE_UPDATE', [previousMessage, newMessage], guildDataMap.get(newMessage.guild.id)));

Norn.on('messageReactionAdd', (eventMessageReaction, eventUser) =>
    log_event('MESSAGE_REACTION_ADD', [eventMessageReaction, eventUser], guildDataMap.get(eventMessageReaction.message.guild.id)));

Norn.on('messageReactionRemove', (eventMessageReaction, eventUser) =>
    log_event('MESSAGE_REACTION_DELETE', [eventMessageReaction, eventUser], guildDataMap.get(eventMessageReaction.message.guild.id)));

Norn.on('messageReactionRemoveAll', eventMessage =>
    log_event('MESSAGE_REACTION_REMOVE_ALL', eventMessage, guildDataMap.get(eventMessage.guild.id)));

/*
// this function is too buggy to use
Norn.on('typingStart', (eventChannel, eventUser) =>
    log_event('TYPING_START', [eventChannel, eventUser], guildDataMap.get(eventChannel.lastMessage.guild.id)));
*/

//////////////////////////////////////////////////
// Event Handler: Guild/Role
//////////////////////////////////////////////////

Norn.on('roleCreate', eventRole =>
    log_event('ROLE_CREATE', eventRole, guildDataMap.get(eventRole.guild.id)));

Norn.on('roleDelete', eventRole =>
    log_event('ROLE_DELETE', eventRole, guildDataMap.get(eventRole.guild.id)));

Norn.on('roleUpdate', (previousRole, newRole) =>
    log_event('ROLE_UPDATE', [previousRole, newRole], guildDataMap.get(newRole.guild.id)));

//////////////////////////////////////////////////
// Event Handler: Guild/Emoji
//////////////////////////////////////////////////

Norn.on('emojiCreate', eventGuildEmoji =>
    log_event('EMOJI_CREATE', eventGuildEmoji, guildDataMap.get(eventGuildEmoji.guild.id)));

Norn.on('emojiDelete', eventGuildEmoji =>
    log_event('EMOJI_DELETE', eventGuildEmoji, guildDataMap.get(eventGuildEmoji.guild.id)));

Norn.on('emojiUpdate', (previousGuildEmoji, newGuildEmoji) =>
    log_event('EMOJI_UPDATE', [previousGuildEmoji, newGuildEmoji], guildDataMap.get(newGuildEmoji.guild.id)));

//////////////////////////////////////////////////
// Event Handler: Guild/Member
//////////////////////////////////////////////////

Norn.on('guildBanAdd', (eventGuild, eventUser) =>
    log_event('GUILD_BAN_ADD', [eventGuild, eventUser], guildDataMap.get(eventGuild.id)));

Norn.on('guildBanRemove', (eventGuild, eventUser) =>
    log_event('GUILD_BAN_REMOVE', [eventGuild, eventUser], guildDataMap.get(eventGuild.id)));

Norn.on('guildMemberAdd', eventGuildMember =>
    log_event('GUILD_MEMBER_ADD', eventGuildMember, guildDataMap.get(eventGuildMember.guild.id)));

Norn.on('guildMemberRemove', eventGuildMember =>
    log_event('GUILD_MEMBER_REMOVE', eventGuildMember, guildDataMap.get(eventGuildMember.guild.id)));

Norn.on('guildMemberUpdate', (previousGuildMemeber, newGuildMember) =>
    log_event('GUILD_MEMBEr_UPDATE', [previousGuildMemeber, newGuildMember], guildDataMap.get(newGuildMember.guild.id)));

Norn.on('guildMemberAvailable', eventGuildMember =>
    log_event('GUILD_MEMBER_AVAILABLE', eventGuildMember, guildDataMap.get(eventGuildMember.guild.id)));

Norn.on('guildMembersChunk', (eventGuildMembers, eventGuild, eventData) =>
    log_event('GUILD_MEMBERS_CHUNK', [eventGuildMembers, eventGuild, eventData], guildDataMap.get(eventGuild.id)));

/*
// too many logs
Norn.on('guildMemberSpeaking', (eventGuildMember, eventReadOnlySpeaking) =>
    log_event('GUILD_MEMBER_SPEAKING', [eventGuildMember, eventReadOnlySpeaking], guildDataMap.get(eventGuildMember.guild.id)));
*/

//////////////////////////////////////////////////
// Event Handler: Guild/Management
//////////////////////////////////////////////////

Norn.on('guildCreate', eventGuild =>
    log_event('GUILD_CREATE', eventGuild, guildDataMap.get(eventGuild.id)));

Norn.on('guildDelete', eventGuild =>
    log_event('GUILD_DELETE', eventGuild, guildDataMap.get(eventGuild.id)));

Norn.on('guildUpdate', (previousGuild, newGuild) =>
    log_event('GUILD_UPDATE', [previousGuild, newGuild], guildDataMap.get(newGuild.id)));

Norn.on('guildUnavailable', guildData =>
    log_event('GUILD_UNAVAILABLE', guildData, guildDataMap.get(guildData.id)));

//////////////////////////////////////////////////
// Event Handler: User
//////////////////////////////////////////////////

Norn.on('userUpdate', (previousUser, newUser) =>
    log_event('USER_UPDATE', [previousUser, newUser], null));

Norn.on('presenceUpdate', (previousPresence, newPresence) =>
    log_event('PRESENCE_UPDATE', [previousPresence, newPresence], null));
    
/*
// TODO : use to check if Norn was moved around
Norn.on('voiceStateUpdate', (previousVoiceState, newVoiceState) =>
    log_event('VOICE_STATE_UPDATE', [previousVoiceState, newVoiceState], guildDataMap.get(newVoiceState.guild.id)));
*/

//////////////////////////////////////////////////
// Event Handler: Other
//////////////////////////////////////////////////

Norn.on('disconnect', (anyData, numberData) =>
    log_event('DISCONNECT', [anyData, numberData], null));

Norn.on('warn', (warnData) =>
    log_event('WARN', warnData, null));

/*
// ashz> too many logs
Norn.on('debug', (debugData) =>
    log_event('DEBUG', debugData, null));
*/

Norn.on('error', (errorData) =>
    log_event('ERROR', errorData, null));

//////////////////////////////////////////////////
// Event Handler: Command
//////////////////////////////////////////////////

Norn.on('message', (messageData) => {
    if(messageData.author.bot) return;
    if(!messageData.content.startsWith('/')) return;

    let guildData      = guildDataMap.get(messageData.guild.id);
    let commandArray   = messageData.content.split(' ');
    let permissionFlag = false;
    commandArray[0]    = commandArray[0].substring(1);
    
    if(messageData == null || guildData == null || commandArray == null) {
        log_event('COMMAND_DATA_NULL', messageData, guildData);
        if(!messageData.deleted) messageData.delete();
        return;
    }

    messageData.member.roles.member._roles.forEach((roles) => {
        if(messageData.guild.roles.cache.get(roles).name.toLowerCase() === 'bot') permissionFlag = true;
    });

    if(!permissionFlag) {
        log_event('COMMAND_NO_PERMISSION', messageData, guildData);
        if(!messageData.deleted) messageData.delete();
        return;
    }

    try {
        Command[commandArray[0].toLowerCase()](messageData,commandArray,guildData);
    } catch(errorData) {
        if(errorData) log_event('COMMAND_UNKNOWN', messageData, guildData);
    }
    
    if(!messageData.deleted) messageData.delete();
});
