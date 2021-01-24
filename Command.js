"use strict";

// external module
const Discord     = require('discord.js');

// internal module
const path        = require('path');

// custom module
const TrackBot    = require('./TrackBot.js');
const ExF         = require('./ExF.js');
const logCommand  = require('./Log.js').logCommand;

//////////////////////////////////////////////////
// global variables
//////////////////////////////////////////////////

// command list help page
const helpEmbed = new Discord.MessageEmbed();
const commandList = [
    // system commands
    {command : "help",          data : {arg:"",                                                                                                    info:"Show this list of commands."}},
    {command : "setting(WIP)",  data : {arg:"[ volume ] [ Volume(1~9) ]",                                                                          info:"Edits the bot general settings."}},
    {command : "syscall(WIP)",  data : {arg:"[ ? ]",                                                                                               info:"Specialized commands, mostly for administrators."}},
    // trackbot control commands
    {command : "join",          data : {arg:"",                                                                                                    info:"Bot joins your current voice channel."}},
    {command : "leave",         data : {arg:"",                                                                                                    info:"Bot leaves whatever channel it's currently connected to."}},
    {command : "play",          data : {arg:"[ URL ] [ Volume(1~9) ]",                                                                             info:"Immediately plays the track from the video of the URL."}},
    {command : "start",         data : {arg:"",                                                                                                    info:"Starts the current track."}},
    {command : "stop",          data : {arg:"",                                                                                                    info:"Stops the current track."}},
    {command : "resume",        data : {arg:"",                                                                                                    info:"Resumes paused track."}},
    {command : "pause",         data : {arg:"",                                                                                                    info:"Pauses the current track."}},
    {command : "status(WIP)",   data : {arg:"",                                                                                                    info:"Shows bot's current status."}},
    // trackbot queue commands
    {command : "list",          data : {arg:"",                                                                                                    info:"Shows the queue list."}},
    {command : "add",           data : {arg:"[ URL ] [ Volume(1~9) ]",                                                                             info:"Adds the URL data to the queue."}},
    {command : "remove",        data : {arg:"[ Index ]",                                                                                           info:"Removes the URL/Index data from the queue."}},
    {command : "clear",         data : {arg:"",                                                                                                    info:"Clears the entire queue."}},
    {command : "next",          data : {arg:"[ Count ]",                                                                                           info:"Plays the next queued track. (Default: 1)"}},
    {command : "previous",      data : {arg:"[ Count ]",                                                                                           info:"Plays the previous queued track. (Default: 1)"}},
    {command : "loop",          data : {arg:"[ single / queue ] [ on / off ]",                                                                     info:"Edits the loop settings."}},
    // trackbot playlist commands
    {command : "playlist",      data : {arg:"[ list / create / delete / queue / show / add / remove ] [ Playlist Name ] [ URL / Index ] [ Volume ]", info:"Playlist managment command."}},
];

//////////////////////////////////////////////////
// initialization
//////////////////////////////////////////////////

// initialize help embedded message
helpEmbed
    .setColor(ExF.html_sky)
    .setTitle('Command List')
    .setDescription('Semi-helpful list of commands used by Norn\nWIP = Work In Progress (It means DON\'T USE IT)')
    .setTimestamp();
commandList.forEach((element) => {
    helpEmbed.addField(`${element.command} ${element.data.arg}`, element.data.info, false);
});

//////////////////////////////////////////////////
// Common Functions
//////////////////////////////////////////////////

const trackbot_channel_check = (user_vc, bot_vc, bot_vcon) => {
    if(user_vc === null) {
        return '_USER_VC_NULL';
    }

    if(bot_vc === null) {
        return '_BOT_VC_NULL';
    }

    if(bot_vcon === null) {
        return '_BOT_VCON_NULL';
    }

    if(bot_vc !== user_vc) {
        return '_USER_INVALID_VC';
    }

    return null;
}

//////////////////////////////////////////////////
// System Commands
//////////////////////////////////////////////////

const command_help = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            helpEmbed.setAuthor(message.author.tag);
            message.channel.send(helpEmbed);
            logCommand('HELP_SUCCESS', message, guildData);
            break;
        }
        default: {
            logCommand('HELP_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

// TODO: ashz
const command_syscall = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            logCommand('SYSCALL_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        default: {
            switch(commandArray[1].toLowerCase()) {
                case 'delete': {
                    switch(commandArray.length) {
                        case 2: {
                            logCommand('SYSCALL_DELETE_UNDER_REQ_ARG_CNT', message, guildData);
                            break;
                        }
                        case 3: {
                            let count = parseInt(commandArray[2]);
                            if (isNaN(count)) {
                                logCommand('SYSCALL_DELETE_INVALID_ARGUMENT_TYPE', message, guildData);
                                break;
                            }

                            if(count < 2) {
                                logCommand('SYSCALL_DELETE_ARG_UNDER_LIMIT', message, guildData);
                                break;
                            } else if (count > 100) {
                                logCommand('SYSCALL_DELETE_ARG_OVER_LIMIT', message, guildData);
                                break;
                            }

                            try {
                                let bulkMessage = await message.channel.messages.fetch({limit: count});
                                message.channel.bulkDelete(bulkMessage);
                            } catch(errorData) {
                                console.error(errorData);
                                logCommand('SYSCALL_DELETE_PROCESS_ERROR', message, guildData);
                                break;
                            }
                            
                            logCommand('SYSCALL_DELETE_PROCESS_SUCCESS', message, guildData);
                            break;
                        }
                        default: {
                            logCommand('SYSCALL_DELETE_OVER_MAX_ARG_CNT', message, guildData);
                        }
                    }
                    break;
                }
                default: {
                    logCommand('SYSCALL_UNKNOWN_ARG', message, guildData);
                }
            }
        }
    }
}

// TODO: ashz
const command_setting = async (message, commandArray, guildData) => {
    return;
}

//////////////////////////////////////////////////
// TrackBot Control Commands
//////////////////////////////////////////////////

const command_join = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            if(message.member.voice.channel == null) {
                logCommand('JOIN_VC_NULL', message, guildData);
                break;
            }
            if(guildData.TB.voiceConnection !== null) {
                logCommand('JOIN_VC_SET', message, guildData);
                break;
            }

            if(await TrackBot.join(guildData, message.client.user, message.channel, message.member.voice.channel)) {
                logCommand('JOIN_SUCCESS', message, guildData);
            } else {
                logCommand('JOIN_FAILED', message, guildData);
            }
            break;
        }
        default: {
            logCommand('JOIN_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_leave = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            if(guildData.TB.voiceConnection === null) {
                logCommand('LEAVE_BOT_VC_NULL', message, guildData);
                break;
            }

            if(await TrackBot.leave(guildData)) {
                logCommand('LEAVE_SUCCESS', message, guildData);
            } else {
                logCommand('LEAVE_FAILED', message, guildData);
            }
            break;
        }
        default: {
            logCommand('LEAVE_OVER_MAX_ARG_CNT', message, guildData);
        }
    }    
}

const command_play = async (message, commandArray, guildData) => {
    let volumeData = guildData.TB.volume;

    switch(commandArray.length) {
        case 1: {
            logCommand('PLAY_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 3: {
            volumeData = parseInt(commandArray[2]);
            if(isNaN(volumeData)) {
                logCommand('PLAY_INVALID_ARG_TYPE', message, guildData);
                break;
            }
        }
        case 2: {
            if(volumeData<1) {
                logCommand('PLAY_ARG_UNDER_LIMIT', message, guildData);
                break;
            } else if(volumeData>9) {
                logCommand('PLAY_ARG_OVER_LIMIT', message, guildData);
                break;
            }

            if( !(await TrackBot.add(guildData, commandArray[1], volumeData)) ) {
                break;
            }

            if(message.member.voice.channel === null) {
                logCommand('PLAY_USER_VC_NULL', message, guildData);
                break;
            }

            if(guildData.TB.voiceConnection === null) {
                if( !(await TrackBot.join(guildData, message.client.user, message.channel, message.member.voice.channel)) ) {
                    logCommand('PLAY_JOIN_FAILED', message, guildData);
                    break;
                }
            } else if(guildData.TB.voiceChannel !== message.member.voice.channel) {
                logCommand('PLAY_USER_INVALID_VC', message, guildData);
                break;
            }

            if(await TrackBot.play(guildData, guildData.TB.queue.length-1)) {
                logCommand('PLAY_SUCCESS', message, guildData);
            } else {
                logCommand('PLAY_FAILED', message, guildData);
            }
			break;
        }
        default: {
            logCommand('PLAY_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_start = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            let checkChannel = trackbot_channel_check(message.member.voice.channel, guildData.TB.voiceChannel, guildData.TB.voiceConnection);

            if(checkChannel !== null) {
                logCommand(`START${checkChannel}`, message, guildData);
                break;
            }

            if(guildData.TB.queue.length <= 0) {
                logCommand('START_QUEUE_EMPTY', message, guildData);
                break;
            }

            if(guildData.TB.playing) {
                logCommand('START_PLAYING', message, guildData);
                break;
            }

            if(await TrackBot.play(guildData)) {
            	logCommand('START_SUCCESS', message, guildData);
			} else {
            	logCommand('START_FAILED', message, guildData);
			}
            break;
        }
        default: {
            logCommand('START_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_stop = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            let checkChannel = trackbot_channel_check(message.member.voice.channel, guildData.TB.voiceChannel, guildData.TB.voiceConnection);
            if(checkChannel !== null) {
                logCommand(`STOP${checkChannel}`, message, guildData);
                break;
            }

            if(!guildData.TB.playing) {
                logCommand('STOP_STOPPED', message, guildData);
                break;
            }

            if(await TrackBot.stop(guildData)) {
            	logCommand('STOP_SUCCESS', message, guildData);
			} else {
            	logCommand('STOP_FAILED', message, guildData);
			}
            break;
        }
        default: {
            logCommand('STOP_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_resume = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            let checkChannel = trackbot_channel_check(message.member.voice.channel, guildData.TB.voiceChannel, guildData.TB.voiceConnection);
            if(checkChannel !== null) {
                logCommand(`RESUME${checkChannel}`, message, guildData);
                break;
            }

            if(guildData.TB.playing && !guildData.TB.paused) {
                logCommand('RESUME_PLAYING', message, guildData);
                break;
            }
            
            if(await TrackBot.resume(guildData)) {
                logCommand('RESUME_SUCCESS', message, guildData);
            } else {
                logCommand('RESUME_FAILED', message, guildData);
            }
            break;
        }
        default: {
            logCommand('RESUME_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_pause = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            let checkChannel = trackbot_channel_check(message.member.voice.channel, guildData.TB.voiceChannel, guildData.TB.voiceConnection);
            if(checkChannel !== null) {
                logCommand(`RESUME${checkChannel}`, message, guildData);
                break;
            }

            if(!guildData.TB.playing) {
                logCommand('PAUSE_STOPPED', message, guildData);
                break;
            }

            if(guildData.TB.paused) {
                logCommand('PAUSE_PAUSED', message, guildData);
                break;
            }
            
            if(await TrackBot.pause(guildData)) {
                logCommand('PAUSE_SUCCESS', message, guildData);
            } else {
                logCommand('PAUSE_FAILED', message, guildData);
            }
            break;
        }
        default: {
            logCommand('PAUSE_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

// TODO: ashz 
const command_status = async (message, commandArray, guildData) => {
    return;
}

//////////////////////////////////////////////////
// TrackBot Queue Commands
//////////////////////////////////////////////////

const command_list = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            let loopIdx;
            let guildQueue   = guildData.TB.queue;
            let queueListMsg = new Discord.MessageEmbed();
    
            if(guildQueue.length<1 || guildQueue===null) {
                console.log(guildQueue.length);
                console.log(guildQueue);
                logCommand('LIST_QUEUE_EMPTY', message, guildData);
                break;
            }

            queueListMsg
                .setColor(ExF.html_sky)
                .setTitle('Queue List')
                .setTimestamp();
            
            for(loopIdx=0 ; loopIdx<guildQueue.length ; loopIdx++) {
                queueListMsg.addField(
                    ExF.getLimitedString(`${guildData.TB.index==loopIdx?'-> ':' '}[${loopIdx}] [${ExF.getSecFormat(guildQueue[loopIdx].length)}] ${guildQueue[loopIdx].title}`, 89),
                    `${guildQueue[loopIdx].video_url}`,
                    false
                );
            }

            message.channel.send(queueListMsg);
            logCommand('LIST_SUCCESS', message, guildData);
            break;
        }
        default: {
            logCommand('LIST_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_add = async (message, commandArray, guildData) => {
    let volumeData = guildData.TB.volume;
    switch(commandArray.length) {
        case 1: {
            logCommand('ADD_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 3: {
            volumeData = parseInt(commandArray[2]);
            if(isNaN(volumeData)) {
                logCommand('ADD_INVALID_ARG_TYPE', message, guildData);
                break;
            }
        }
        case 2: {
            if(volumeData<1) {
                logCommand('ADD_ARG_UNDER_LIMIT', message, guildData);
                break;
            } else if(volumeData>9) {
                logCommand('ADD_ARG_OVER_LIMIT', message, guildData);
                break;
            }

            if(await TrackBot.add(guildData, commandArray[1], volumeData)) {
                logCommand('ADD_SUCCESS', message, guildData);
            } else {
                logCommand('ADD_FAILED', message, guildData);
            }
            break;
        }
        default: {
            logCommand('ADD_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_remove = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            logCommand('REMOVE_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 2: {
            let targetIdx = parseInt(commandArray[1]);
            if(isNaN(targetIdx)) {
                logCommand('REMOVE_INVALID_ARG_TYPE', message, guildData);
                break;
            }

			if(targetIdx<0) {
                logCommand('REMOVE_ARG_UNDER_LIMIT', message, guildData);
				break;
            } else if(targetIdx>=guildData.TB.queue.length) {
                logCommand('REMOVE_ARG_OVER_LIMIT', message, guildData);
                break;
            }
            
            if(targetIdx === guildData.TB.index) {
                logCommand('REMOVE_CUR_IDX', message, guildData);
                break;
            }
            
            if(await TrackBot.remove(guildData, targetIdx)) {
                logCommand('REMOVE_SUCCESS', message, guildData);
            } else {
                logCommand('REMOVE_FAILED', message, guildData);
            }
            break;
        }
        default: {
            logCommand('REMOVE_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_clear = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            if(guildData.TB.queue == null || guildData.TB.queue.length <= 0) {
                logCommand('CLEAR_QUEUE_EMPTY', message, guildData);
                break;
            }
            
            if(guildData.TB.playing && guildData.TB.queue.length === 1) {
                logCommand('CLEAR_CUR_IDX', message, guildData);
                break;
            }

            if(await TrackBot.clear(guildData)) {
                logCommand('CLEAR_SUCCESS', message, guildData);
            } else {
                logCommand('CLEAR_FAILED', message, guildData);
            }
            break;
        }
        default: {
            logCommand('CLEAR_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_next = async (message, commandArray, guildData) => {
    let skipCount = -1;
    switch(commandArray.length) {
        case 1: skipCount = 0;
        case 2: {
            let checkChannel = trackbot_channel_check(message.member.voice.channel, guildData.TB.voiceChannel, guildData.TB.voiceConnection);
            if(checkChannel !== null) {
                logCommand(`NEXT${checkChannel}`, message, guildData);
                break;
            }

            if(guildData.TB.queue.length <= 0) {
                logCommand('NEXT_QUEUE_EMPTY', message, guildData);
                break;
            }

            if(skipCount < 0) {
                skipCount = parseInt(commandArray[1]);
                if(isNaN(skipCount)) {
                    logCommand('NEXT_INVALID_ARG_TYPE', message, guildData);
                    break;
                }

                if(skipCount <= 1) {
                    logCommand('NEXT_INVALID_ARG_VAL', message, guildData);
                    break;
                }
            }

            if(skipCount <= 0) skipCount = 1;
            
            if(await TrackBot.next(guildData, skipCount)) {
                logCommand('NEXT_SUCCESS', message, guildData);
            } else {
                logCommand('NEXT_FAILED', message, guildData);
            }
            break;
        }
        default: {
            logCommand('NEXT_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_previous = async (message, commandArray, guildData) => {
    let skipCount = -1;
    switch(commandArray.length) {
        case 1: skipCount = 0;
        case 2: {
            let checkChannel = trackbot_channel_check(message.member.voice.channel, guildData.TB.voiceChannel, guildData.TB.voiceConnection);
            if(checkChannel !== null) {
                logCommand(`PREV${checkChannel}`, message, guildData);
                break;
            }
            
            if(guildData.TB.queue.length <= 0) {
                logCommand('PREV_QUEUE_EMPTY', message, guildData);
                break;
            }

            if(skipCount < 0) {
                skipCount = parseInt(commandArray[1]);
                if(isNaN(skipCount)) {
                    logCommand('PREV_INVALID_ARG_TYPE', message, guildData);
                    break;
                }

                if(skipCount <= 1) {
                    logCommand('PREV_INVALID_ARG_VAL', message, guildData);
                    break;
                }
            }
            
            if(await TrackBot.previous(guildData, skipCount)) {
                logCommand('PREV_SUCCESS', message, guildData);
            } else {
                logCommand('PREV_FAILED', message, guildData);
            }
            break;
        }
        default: {
            logCommand('PREV_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_loop = async (message, commandArray, guildData) => {
    let targetConv1;
    let targetConv2;

    switch(commandArray.length) {
        case 1: {
            logCommand('LOOP_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 2: {
            targetConv1 = commandArray[1].toLowerCase();

            if(targetConv1 === 'single' || targetConv1 === 'queue') {
                if(await TrackBot.loopToggle(guildData, targetConv1)) {
                    logCommand('LOOP_SUCCESS', message, guildData);
                } else {
                    logCommand('LOOP_FAILED', message, guildData);
                }
            } else {
                logCommand('LOOP_INVALID_ARG_VAL_1', message, guildData);
            }
            break;
        }
        case 3: {
            targetConv1 = commandArray[1].toLowerCase();
            targetConv2 = commandArray[2].toLowerCase();

            if(targetConv1 === 'single' || targetConv1 === 'queue') {
                if(targetConv2 === 'on') {
                    if(await TrackBot.loopEdit(guildData, targetConv1, true)) {
                        logCommand('LOOP_SUCCESS', message, guildData);
                    } else {
                        logCommand('LOOP_FAILED', message, guildData);
                    }
                } else if(targetConv2 === 'off') {
                    if(await TrackBot.loopEdit(guildData, targetConv1, false)) {
                        logCommand('LOOP_SUCCESS', message, guildData);
                    } else {
                        logCommand('LOOP_FAILED', message, guildData);
                    }
                } else {
                    logCommand('LOOP_INVALID_ARG_VAL_2', message, guildData);
                }
            } else {
                logCommand('LOOP_INVALID_ARG_VAL_1', message, guildData);
            }
            break;
        }
        default: {
            logCommand('LOOP_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

//////////////////////////////////////////////////
// TrackBot Playlist Commands
//////////////////////////////////////////////////

const command_playlist = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            logCommand('PLAYLIST_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 2: {
            switch(commandArray[1].toLowerCase()) {
                case 'list': {
                    let LE = new Discord.MessageEmbed();
                    let tmpPlaylist = guildData.TB.playlist;

					LE.setColor(ExF.html_sky)
                      .setAuthor(message.author.tag)
                      .setTitle('Playlist List')
                      .setTimestamp();

                    Object.entries(tmpPlaylist).forEach((element) => {
                        LE.addField(element[0], `Created By: ${tmpPlaylist[element[0]].owner}\nTrack Count: ${tmpPlaylist[element[0]].elements}\nLength: ${ExF.getSecFormat(tmpPlaylist[element[0]].length)}`, false);
                    });

                    message.channel.send(LE);
                    logCommand('PLAYLIST_LIST_SUCCESS', message, guildData);	
					break;
                }
                case 'create':
                case 'delete':
                case 'queue':
                case 'show':
                case 'add': 
                case 'remove': {
					logCommand(`PLAYLIST_${commandArray[1].toUpperCase()}_UNDER_REQ_ARG_CNT`, message, guildData);	
                    break;
                }
                default: {
                    logCommand('PLAYLIST_UNKNOWN_ARG_1', message, guildData);
                }
            }
            break;
        }
        case 3: {
            switch(commandArray[1].toLowerCase()) {
                case 'list': {
                    logCommand('PLAYLIST_LIST_OVER_MAX_ARG_CNT', message, guildData);	
                    break;
                }
                case 'create': {
                    let newPLname = commandArray[2];

                    if(guildData.TB.playlist !== undefined) {
                        if(newPLname in guildData.TB.playlist) {
                            logCommand('PLAYLIST_CREATE_FILE_EXISTS', message, guildData);
                            break;
                        }
                    } 

                    if(await TrackBot.playlist_create(guildData, newPLname, message.author.tag)) {
                        logCommand('PLAYLIST_CREATE_SUCCESS', message, guildData);
                    } else {
                        logCommand('PLAYLIST_CREATE_FAILED', message, guildData);
                    }
                    break;
                }
                case 'delete': {
                    let targetPlaylist = commandArray[2];
                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        logCommand('PLAYLIST_DELETE_NO_FILE_EXISTS', message, guildData);
                        break;
                    }

                    if(await TrackBot.playlist_delete(guildData, targetPlaylist)) {
                        logCommand('PLAYLIST_DELETE_SUCCESS', message, guildData);
                    } else {
                        logCommand('PLAYLIST_DELETE_FAILED', message, guildData);
                    }
                    break;
                }
                case 'queue': {
                    let targetPlaylist = commandArray[2];
                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        logCommand('PLAYLIST_QUEUE_NO_DATA_FOUND', message, guildData);
                        break;
                    }

                    if(await TrackBot.playlist_queue(guildData, targetPlaylist)) {
                        logCommand('PLAYLIST_QUEUE_SUCCESS', message, guildData);
                    } else {
                        logCommand('PLAYLIST_QUEUE_FAILED', message, guildData);
                    }
                    break;
                }
                case 'show': {
                    let targetPlaylist = commandArray[2];
                    let SE             = new Discord.MessageEmbed();
                    let targetFile     = path.join(guildData.configurationDir, `${targetPlaylist}.json`);
                    let playlist       = ExF.getArrayFromFile(targetFile);
                    let loopIdx;

                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        logCommand('PLAYLIST_SHOW_NO_DATA_FOUND', message, guildData);
                        break;
                    }
                    
					SE.setColor(ExF.html_sky)
                      .setAuthor(message.author.tag)
					  .setTitle(`[${targetPlaylist}][C:${guildData.TB.playlist[targetPlaylist].elements}][${ExF.getSecFormat(guildData.TB.playlist[targetPlaylist].length)}] Playlist Info`)
					  .setTimestamp();

                    for(loopIdx=0 ; loopIdx<playlist.length ; loopIdx++) {
                        SE.addField(
                            ExF.getLimitedString(`[${loopIdx}] ${playlist[0].title}`, 84),
                            `[URL] ${playlist[loopIdx].url}\n[Length] ${ExF.getSecFormat(playlist[loopIdx].length)}\n[Volume] ${playlist[loopIdx].vol}`,
                            false);
                    }

                    message.channel.send(SE);
                    logCommand('PLAYLIST_SHOW_SUCCESS', message, guildData);
                    break;
                }
                case 'add': 
                case 'remove': {
					logCommand(`PLAYLIST_${commandArray[1].toUpperCase()}_UNDER_REQ_ARG_CNT`, message, guildData);	
                    break;
                }
                default: {
                    logCommand('PLAYLIST_UNKNOWN_ARG_1', message, guildData);
                }
            }
            break;
        }
        case 4: {
            switch(commandArray[1].toLowerCase()) {
                case 'list':
                case 'create':
                case 'delete':
                case 'queue':
                case 'show': {
                    logCommand(`PLAYLIST_${commandArray[1].toUpperCase()}_OVER_MAX_ARG_CNT`, message, guildData);	
                    break;
                }
                case 'add': {
                    let targetPlaylist = commandArray[2];
                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        logCommand('PLAYLIST_ADD_NO_DATA_FOUND', message, guildData);
                        break;
                    }

                    if(await TrackBot.playlist_add(guildData, targetPlaylist, commandArray[3], guildData.TB.volume)) {
                        logCommand('PLAYLIST_ADD_SUCCESS', message, guildData);
                    } else {
                        logCommand('PLAYLIST_ADD_FAILED', message, guildData);
                    }
                    break;
                }
                case 'remove': {
                    let targetPlaylist = commandArray[2];
                    let targetIdx      = parseInt(commandArray[3]);

                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        logCommand('PLAYLIST_REMOVE_NO_PL_FOUND', message, guildData);
                        break;
                    }

                    if(isNaN(targetIdx)) {
                        logCommand('PLAYLIST_REMOVE_INVALID_ARG_TYPE', message, guildData);
                        break;
                    }

                    if(targetIdx >= guildData.TB.playlist[targetPlaylist].length || targetIdx < 0) {
                        logCommand('PLAYLIST_REMOVE_INVALID_ARG_VALUE', message, guildData);
                        break;
                    }

                    if(await TrackBot.playlist_remove(guildData, targetPlaylist, targetIdx)) {
                        logCommand('PLAYLIST_REMOVE_SUCCESS', message, guildData);
                    } else {
                        logCommand('PLAYLIST_REMOVE_FAILED', message, guildData);
                    }
                    break;
                }
                default: {
                    logCommand('PLAYLIST_UNKNOWN_ARG_1', message, guildData);
                }
            }
            break;
        }
        case 5: {
            switch(commandArray[1].toLowerCase()) {
                case 'list':
                case 'create':
                case 'delete':
                case 'queue':
                case 'show': {
                    logCommand(`PLAYLIST_${commandArray[1].toUpperCase()}_OVER_MAX_ARG_CNT`, message, guildData);	
                    break;
                }
                case 'add': {
                    let targetPlaylist = commandArray[2];
                    let volumeData     = parseInt(commandArray[4]);

                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        logCommand('PLAYLIST_ADD_NO_PL_FOUND', message, guildData);
                        break;
                    }

                    if(isNaN(volumeData)) {
                        logCommand('PLAYLIST_ADD_INVALID_ARG_TYPE', message, guildData);
                        break;
                    }

                    if(await TrackBot.playlist_add(guildData, targetPlaylist, commandArray[3], volumeData)) {
                        logCommand('PLAYLIST_ADD_SUCCESS', message, guildData);
                    } else {
                        logCommand('PLAYLIST_ADD_FAILED', message, guildData);
                    }
                    break;
                }
                case 'delete': {
                    logCommand('PLAYLIST_DELETE_OVER_MAX_ARG_CNT', message, guildData);	
                    break;
                }
                default: {
                    logCommand('PLAYLIST_UNKNOWN_ARG_1', message, guildData);
                }
            }
            break;
        }
        default: {
            logCommand('PLAYLIST_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

module.exports = {
    // System Commands
    help     : command_help,
    setting  : command_setting,
    syscall  : command_syscall,
    // TrackBot Control Commands
    join     : command_join,
    leave    : command_leave,
    play     : command_play,
    start    : command_start,
    stop     : command_stop,
    resume   : command_resume,
    pause    : command_pause,
    status   : command_status,
    // TrackBot Queue Commands
    list     : command_list,
    add      : command_add,
    remove   : command_remove,
    clear    : command_clear,
    next     : command_next,
    previous : command_previous,
    loop     : command_loop,
    // TrackBot Playlist Commands
    playlist : command_playlist,
};
