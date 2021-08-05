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
const logEvent     = require('./Log.js').logEvent;

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
            ExF.logConsole(`[CRIT] Ending program. Error code: ${code}`, null);
            break;
        }
        default: {
            ExF.logConsole(`[?] Ending program. Unknown error code: ${code}`, null);
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
            ExF.logConsole(`[ALERT] Directory already exists. (${CONFIG_GUILD_DIR_PATH})`, null);
            // process.exit(ExF.GUILD_CONFIG_DIR_CREATE_FAIL);
        }
    });

    fs.mkdir(CONFIG_LOG_DIR_PATH, (errorData) => {
        if(errorData) {
            // console.error(errorData);
            ExF.logConsole(`[ALERT] Directory already exists. (${CONFIG_LOG_DIR_PATH})`, null);
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
			//ExF.logConsole('Failed reading guild config directory. (GUILD_DIR_FAILED_TO_READ)', null);
            process.exit(ExF.GUILD_DIR_FAILED_TO_READ);
        }

        dirData.forEach((dirName) => {
            let configDirPath  = path.join(CONFIG_GUILD_DIR_PATH, dirName);
            let configFilePath = path.join(configDirPath, CONFIG_NORN.guild_data_file);

			fs.readFile(configFilePath, (errorData, fileData) => {
				if(errorData) {
					console.error(errorData);
					ExF.logConsole('[WARN] Unable to read a guild setting file.', null);
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
                        errorCount:      0,
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

ExF.logConsole('[ALERT] Finished Data Handling, waiting on Discord API...', null);

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
                    errorCount:      0,
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
    logEvent('BOT_READY');
});

//////////////////////////////////////////////////
// Event Handler: Channel
//////////////////////////////////////////////////

Norn.on('channelCreate', eventChannel =>
    logEvent('CHANNEL_CREATE', eventChannel, guildDataMap.get(eventChannel.guild.id)));

Norn.on('channelDelete', eventChannel =>
    logEvent('CHANNEL_DELETE', eventChannel, guildDataMap.get(eventChannel.guild.id)));

Norn.on('channelPinsUpdate', (eventChannel, eventDate) =>
    logEvent('CHANNEL_PINS_UPDATE', [eventChannel,eventDate], guildDataMap.get(eventChannel.guild.id)));

Norn.on('channelUpdate', (previousChannel, newChannel) =>
    logEvent('CHANNEL_UPDATE', [previousChannel, newChannel], guildDataMap.get(newChannel.guild.id)));

//////////////////////////////////////////////////
// Event Handler: Message
//////////////////////////////////////////////////

Norn.on('message', eventMessage =>
    logEvent('MESSAGE', eventMessage, guildDataMap.get(eventMessage.guild.id)));

Norn.on('messageDelete', eventMessage =>
    logEvent('MESSAGE_DELETE', eventMessage, guildDataMap.get(eventMessage.guild.id)));

// reference the first message to use as guild id
Norn.on('messageDeleteBulk', eventMessageCollection =>
    logEvent('MESSAGE_DELETE_BULK', eventMessageCollection, guildDataMap.get(eventMessageCollection.first().guild.id)));

Norn.on('messageUpdate', (previousMessage, newMessage) =>
    logEvent('MESSAGE_UPDATE', [previousMessage, newMessage], guildDataMap.get(newMessage.guild.id)));

Norn.on('messageReactionAdd', (eventMessageReaction, eventUser) =>
    logEvent('MESSAGE_REACTION_ADD', [eventMessageReaction, eventUser], guildDataMap.get(eventMessageReaction.message.guild.id)));

Norn.on('messageReactionRemove', (eventMessageReaction, eventUser) =>
    logEvent('MESSAGE_REACTION_DELETE', [eventMessageReaction, eventUser], guildDataMap.get(eventMessageReaction.message.guild.id)));

Norn.on('messageReactionRemoveAll', eventMessage =>
    logEvent('MESSAGE_REACTION_REMOVE_ALL', eventMessage, guildDataMap.get(eventMessage.guild.id)));

/*
// this function is too buggy to use
Norn.on('typingStart', (eventChannel, eventUser) =>
    logEvent('TYPING_START', [eventChannel, eventUser], guildDataMap.get(eventChannel.lastMessage.guild.id)));
*/

//////////////////////////////////////////////////
// Event Handler: Guild/Role
//////////////////////////////////////////////////

Norn.on('roleCreate', eventRole =>
    logEvent('ROLE_CREATE', eventRole, guildDataMap.get(eventRole.guild.id)));

Norn.on('roleDelete', eventRole =>
    logEvent('ROLE_DELETE', eventRole, guildDataMap.get(eventRole.guild.id)));

Norn.on('roleUpdate', (previousRole, newRole) =>
    logEvent('ROLE_UPDATE', [previousRole, newRole], guildDataMap.get(newRole.guild.id)));

//////////////////////////////////////////////////
// Event Handler: Guild/Emoji
//////////////////////////////////////////////////

Norn.on('emojiCreate', eventGuildEmoji =>
    logEvent('EMOJI_CREATE', eventGuildEmoji, guildDataMap.get(eventGuildEmoji.guild.id)));

Norn.on('emojiDelete', eventGuildEmoji =>
    logEvent('EMOJI_DELETE', eventGuildEmoji, guildDataMap.get(eventGuildEmoji.guild.id)));

Norn.on('emojiUpdate', (previousGuildEmoji, newGuildEmoji) =>
    logEvent('EMOJI_UPDATE', [previousGuildEmoji, newGuildEmoji], guildDataMap.get(newGuildEmoji.guild.id)));

//////////////////////////////////////////////////
// Event Handler: Guild/Member
//////////////////////////////////////////////////

Norn.on('guildBanAdd', (eventGuild, eventUser) =>
    logEvent('GUILD_BAN_ADD', [eventGuild, eventUser], guildDataMap.get(eventGuild.id)));

Norn.on('guildBanRemove', (eventGuild, eventUser) =>
    logEvent('GUILD_BAN_REMOVE', [eventGuild, eventUser], guildDataMap.get(eventGuild.id)));

Norn.on('guildMemberAdd', eventGuildMember =>
    logEvent('GUILD_MEMBER_ADD', eventGuildMember, guildDataMap.get(eventGuildMember.guild.id)));

Norn.on('guildMemberRemove', eventGuildMember =>
    logEvent('GUILD_MEMBER_REMOVE', eventGuildMember, guildDataMap.get(eventGuildMember.guild.id)));

Norn.on('guildMemberUpdate', (previousGuildMemeber, newGuildMember) =>
    logEvent('GUILD_MEMBER_UPDATE', [previousGuildMemeber, newGuildMember], guildDataMap.get(newGuildMember.guild.id)));

Norn.on('guildMemberAvailable', eventGuildMember =>
    logEvent('GUILD_MEMBER_AVAILABLE', eventGuildMember, guildDataMap.get(eventGuildMember.guild.id)));

Norn.on('guildMembersChunk', (eventGuildMembers, eventGuild, eventData) =>
    logEvent('GUILD_MEMBERS_CHUNK', [eventGuildMembers, eventGuild, eventData], guildDataMap.get(eventGuild.id)));

/*
// too many logs
Norn.on('guildMemberSpeaking', (eventGuildMember, eventReadOnlySpeaking) =>
    logEvent('GUILD_MEMBER_SPEAKING', [eventGuildMember, eventReadOnlySpeaking], guildDataMap.get(eventGuildMember.guild.id)));
*/

//////////////////////////////////////////////////
// Event Handler: Guild/Management
//////////////////////////////////////////////////

Norn.on('guildCreate', eventGuild =>
    logEvent('GUILD_CREATE', eventGuild, guildDataMap.get(eventGuild.id)));

Norn.on('guildDelete', eventGuild =>
    logEvent('GUILD_DELETE', eventGuild, guildDataMap.get(eventGuild.id)));

Norn.on('guildUpdate', (previousGuild, newGuild) =>
    logEvent('GUILD_UPDATE', [previousGuild, newGuild], guildDataMap.get(newGuild.id)));

Norn.on('guildUnavailable', guildData =>
    logEvent('GUILD_UNAVAILABLE', guildData, guildDataMap.get(guildData.id)));

//////////////////////////////////////////////////
// Event Handler: User
//////////////////////////////////////////////////

Norn.on('userUpdate', (previousUser, newUser) =>
    logEvent('USER_UPDATE', [previousUser, newUser]));

Norn.on('presenceUpdate', (previousPresence, newPresence) =>
    logEvent('PRESENCE_UPDATE', [previousPresence, newPresence]));
    
/*
// TODO : use to check if Norn was moved around
Norn.on('voiceStateUpdate', (previousVoiceState, newVoiceState) =>
    logEvent('VOICE_STATE_UPDATE', [previousVoiceState, newVoiceState], guildDataMap.get(newVoiceState.guild.id)));
*/

//////////////////////////////////////////////////
// Event Handler: Other
//////////////////////////////////////////////////

Norn.on('disconnect', (anyData, numberData) =>
    logEvent('DISCONNECT', [anyData, numberData]));

Norn.on('warn', (warnData) =>
    logEvent('WARN', warnData));

/*
// ashz> too many logs
Norn.on('debug', (debugData) =>
    logEvent('DEBUG', debugData));
*/

Norn.on('error', (errorData) =>
    logEvent('ERROR', errorData));

//////////////////////////////////////////////////
// Event Handler: Command
//////////////////////////////////////////////////

Norn.on('message', (messageData) => {
    if(messageData.author.bot) return;
    if(!messageData.content.startsWith('.')) return;

    let guildData      = guildDataMap.get(messageData.guild.id);
    let commandArray   = messageData.content.split(' ');
    let permissionFlag = false;
    commandArray[0]    = commandArray[0].substring(1);
    
    if(messageData == null || guildData == null || commandArray == null) {
        logEvent('COMMAND_DATA_NULL', messageData, guildData);
        if(!messageData.deleted) messageData.delete();
        return;
    }

    // ashz> if only dots 
	if(commandArray[0] == '') {
		return;
	} else if(commandArray[0].startsWith('.')) {
		return;
	}

    messageData.member.roles.member._roles.forEach((roles) => {
        if(messageData.guild.roles.cache.get(roles).name.toLowerCase() === 'bot') permissionFlag = true;
    });

    if(!permissionFlag) {
        logEvent('COMMAND_NO_PERMISSION', messageData, guildData);
        if(!messageData.deleted) messageData.delete();
        return;
    }

    switch(commandArray[0].toLowerCase()) {
        // System Commands
        case 'help': Command.help(messageData, commandArray, guildData); break;
        case 'setting': Command.setting(messageData, commandArray, guildData); break;
        case 'syscall': Command.syscall(messageData, commandArray, guildData); break;
        // TrackBot Control Commands
        case '채ㅜㅜㄷㅊㅅ': 
        case 'connect':
        case '채ㅜ': 
        case 'con':
        case 'ㅓㅐㅑㅜ': 
        case 'join': Command.join(messageData, commandArray, guildData); break;
        case '얀채ㅜㅜㄷㅊㅅ': 
        case 'disconnect':
        case '얀채ㅜ': 
        case 'discon':
        case '얀': 
        case 'dis':
        case 'ㅣㄷㅁㅍㄷ': 
        case 'leave': Command.leave(messageData, commandArray, guildData); break;
        case 'ㅔㅣ묘':
        case 'p':
        case 'pl':
        case 'play': Command.play(messageData, commandArray, guildData); break;
        case 'start': Command.start(messageData, commandArray, guildData); break;
        case 'stop': Command.stop(messageData, commandArray, guildData); break;
        case 'resume': Command.resume(messageData, commandArray, guildData); break;
        case 'pause': Command.pause(messageData, commandArray, guildData); break;
        case 'status': Command.status(messageData, commandArray, guildData); break;
        // TrackBot Queue Commands
        case 'queue':
        case 'q':
        case 'list': Command.list(messageData, commandArray, guildData); break;
        case 'add': Command.add(messageData, commandArray, guildData); break;
        case 'remove': Command.remove(messageData, commandArray, guildData); break;
        case 'clear': Command.clear(messageData, commandArray, guildData); break;
        case 'skip':
        case 'next': Command.next(messageData, commandArray, guildData); break;
        case 'prev':
        case 'previous': Command.previous(messageData, commandArray, guildData); break;
        case 'loop': Command.loop(messageData, commandArray, guildData); break;
        // TrackBot Playlist Commands
        case 'playlist': Command.playlist(messageData, commandArray, guildData); break;
        default: logEvent('COMMAND_UNKNOWN', messageData, guildData);
    }
    
    if(!messageData.deleted) messageData.delete();
});
