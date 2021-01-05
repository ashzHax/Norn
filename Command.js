"use strict";

// external module
const Discord     = require('discord.js');

// internal module
const path        = require('path');

// custom module
const TrackBot    = require('./TrackBot.js');
const ExF         = require('./ExF.js');
const log_command = require('./Log.js').log_command;

//////////////////////////////////////////////////
// global variables
//////////////////////////////////////////////////

// command list help page
const helpEmbed = new Discord.MessageEmbed();
const commandList = [
    // system commands
    {command : "help",          data : {arg:"",                                                                                                    info:"Show this list of commands."}},
    {command : "setting(WIP)",  data : {arg:"[ def_vol / admin_list ] [ Volume / add / remove ]",                                                  info:"Edits the bot general settings."}},
    {command : "syscall(WIP)",  data : {arg:"[ ? ]",                                                                                               info:"Specialized commands, mostly for administrators."}},
    // trackbot control commands
    {command : "join",          data : {arg:"",                                                                                                    info:"Bot joins your current voice channel."}},
    {command : "leave",         data : {arg:"",                                                                                                    info:"Bot leaves whatever channel it's currently connected to."}},
    {command : "play",          data : {arg:"[ URL ] [ Volume ]",                                                                                  info:"Immediately plays the track from the video of the URL."}},
    {command : "start",         data : {arg:"",                                                                                                    info:"Starts the current track."}},
    {command : "stop",          data : {arg:"",                                                                                                    info:"Stops the current track."}},
    {command : "resume",        data : {arg:"",                                                                                                    info:"Resumes paused track."}},
    {command : "pause",         data : {arg:"",                                                                                                    info:"Pauses the current track."}},
    {command : "status(WIP)",   data : {arg:"",                                                                                                    info:"Shows bot's current status."}},
    // trackbot queue commands
    {command : "list",          data : {arg:"",                                                                                                    info:"Shows the queue list."}},
    {command : "add",           data : {arg:"[ URL ] [ Volume ]",                                                                                  info:"Adds the URL data to the queue."}},
    {command : "remove",        data : {arg:"[ Index ]",                                                                                           info:"Removes the URL/Index data from the queue."}},
    {command : "clear",         data : {arg:"",                                                                                                    info:"Clears the entire queue."}},
    {command : "next",          data : {arg:"[ Count ]",                                                                                           info:"Plays the next queued track. (Default: 1)"}},
    {command : "previous",      data : {arg:"[ Count ]",                                                                                           info:"Plays the previous queued track. (Default: 1)"}},
    {command : "loop",          data : {arg:"[ single / queue ] [ on / off ]",                                                                     info:"Edits the loop settings."}},
    // trackbot playlist commands
    {command : "playlist",      data : {arg:"[ list / create / delete / queue / show / add / remove ] [ Playlist Name ] [ URL / Index / Volume ]", info:"Playlist managment command."}},
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
    if(user_vc == null) {
        return '_USER_VC_NULL';
    }

    if(bot_vc === null) {
        return '_BOT_VCON_NULL';
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
            log_command('HELP_SUCCESS', message, guildData);
            break;
        }
        default: {
            log_command('HELP_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

// TODO: ashz
const command_syscall = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            log_command('SYSCALL_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        default: {
            switch(commandArray[1].toLowerCase()) {
                case 'delete': {
                    switch(commandArray.length) {
                        case 2: {
                            log_command('SYSCALL_DELETE_UNDER_REQ_ARG_CNT', message, guildData);
                            break;
                        }
                        case 3: {
                            var count = parseInt(commandArray[1]);
                            if (isNaN(count)) {
                                log_command('SYSCALL_DELETE_INVALID_ARGUMENT_TYPE', message, guildData);
                                break;
                            }

                            if (count > 100) {
                                log_command('SYSCALL_DELETE_ARGUMENT_OVER_LIMIT', message, guildData);
                                break;
                            }
                            else if(count < 2) {
                                log_command('SYSCALL_DELETE_ARGUMENT_UNDER_LIMIT', message, guildData);
                                break;
                            }

                            try {
                                const bulkMessage = await message.channel.messages.fetch({limit: count});
                                message.channel.bulkDelete(bulkMessage);
                            } catch(errorData) {
                                log_command('SYSCALL_DELETE_PROCESS_ERROR', message, guildData);
                                break;
                            }
                            
                            log_command('SYSCALL_DELETE_PROCESS_SUCCESS', message, guildData);
                            break;
                        }
                        default: {
                            log_command('SYSCALL_DELETE_OVER_MAX_ARG_CNT', message, guildData);
                        }
                    }
                    break;
                }
                default: {
                    log_command('SYSCALL_UNKNOWN_ARG', message, guildData);
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
                log_command('JOIN_VC_NULL', message, guildData);
                break;
            }
            if(guildData.TB.voiceConnection !== null) {
                log_command('JOIN_VC_SET', message, guildData);
                break;
            }

            if(await TrackBot.join(guildData, message.client.user, message.channel, message.member.voice.channel)) {
                log_command('JOIN_SUCCESS', message, guildData);
            } else {
                log_command('JOIN_FAILED', message, guildData);
            }
            break;
        }
        default: {
            log_command('JOIN_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_leave = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            if(guildData.TB.voiceConnection === null) {
                log_command('LEAVE_BOT_VC_NULL', message, guildData);
                break;
            }

            if(await TrackBot.leave(guildData)) {
                log_command('LEAVE_SUCCESS', message, guildData);
            } else {
                log_command('LEAVE_FAILED', message, guildData);
            }
            break;
        }
        default: {
            log_command('LEAVE_OVER_MAX_ARG_CNT', message, guildData);
        }
    }    
}

const command_play = async (message, commandArray, guildData) => {
    let volumeData = guildData.TB.volume;

    switch(commandArray.length) {
        case 1: {
            log_command('PLAY_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 3: {
            volumeData = parseInt(commandArray[2]);
            if(isNaN(volumeData)) {
                log_command('PLAY_INVALID_ARG_TYPE', message, guildData);
                break;
            }
        }
        case 2: {
            if(volumeData<1 || volumeData>9) {
                log_command('PLAY_INVALID_ARG_VAL', message, guildData);
                break;
            }

            if( !(await TrackBot.add(guildData, commandArray[1], volumeData)) ) {
                break;
            }

            if(message.member.voice.channel === null) {
                log_command('PLAY_USER_VC_NULL', message, guildData);
                break;
            }

            if(guildData.TB.voiceConnection === null) {
                if( !(await TrackBot.join(guildData, message.client.user, message.channel, message.member.voice.channel)) ) {
                    log_command('PLAY_JOIN_FAILED', message, guildData);
                    break;
                }
            } else if(guildData.TB.voiceChannel !== message.member.voice.channel) {
                log_command('PLAY_USER_INVALID_VC', message, guildData);
                break;
            }

            if(await TrackBot.play(guildData, guildData.TB.queue.length-1)) {
                log_command('PLAY_SUCCESS', message, guildData);
            } else {
                log_command('PLAY_FAILED', message, guildData);
            }
			break;
        }
        default: {
            log_command('PLAY_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_start = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            let checkChannel = trackbot_channel_check(message.member.voice.channel, guildData.TB.voiceChannel, guildData.TB.voiceConnection);

            if(checkChannel !== null) {
                log_command(`START${checkChannel}`, message, guildData);
                break;
            }

            if(guildData.TB.queue.length <= 0) {
                log_command('START_QUEUE_EMPTY', message, guildData);
                break;
            }

            if(guildData.TB.playing) {
                log_command('START_PLAYING', message, guildData);
                break;
            }

            if(await TrackBot.play(guildData)) {
            	log_command('START_SUCCESS', message, guildData);
			} else {
            	log_command('START_FAILED', message, guildData);
			}
            break;
        }
        default: {
            log_command('START_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_stop = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            let checkChannel = trackbot_channel_check(message.member.voice.channel, guildData.TB.voiceChannel, guildData.TB.voiceConnection);
            if(checkChannel !== null) {
                log_command(`STOP${checkChannel}`, message, guildData);
                break;
            }

            if(!guildData.TB.playing) {
                log_command('STOP_STOPPED', message, guildData);
                break;
            }

            if(await TrackBot.stop(guildData)) {
            	log_command('STOP_SUCCESS', message, guildData);
			} else {
            	log_command('STOP_FAILED', message, guildData);
			}
            break;
        }
        default: {
            log_command('STOP_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

//// TRACKBOT SYNCED ^

const command_resume = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            let checkChannel = trackbot_channel_check(message.member.voice.channel, guildData.TB.voiceChannel, guildData.TB.voiceConnection);
            if(checkChannel !== null) {
                log_command(`RESUME${checkChannel}`, message, guildData);
                break;
            }

            if(guildData.TB.playing && !guildData.TB.paused) {
                log_command('RESUME_PLAYING', message, guildData);
                break;
            }
            
            log_command('RESUME_SUCCESS', message, guildData);
            TrackBot.resume(guildData);
            break;
        }
        default: {
            log_command('RESUME_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_pause = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            let checkChannel = trackbot_channel_check(message.member.voice.channel, guildData.TB.voiceChannel, guildData.TB.voiceConnection);
            if(checkChannel !== null) {
                log_command(`RESUME${checkChannel}`, message, guildData);
                break;
            }

            if(!guildData.TB.playing) {
                log_command('PAUSE_STOPPED', message, guildData);
                break;
            }

            if(guildData.TB.paused) {
                log_command('PAUSE_PAUSED', message, guildData);
                break;
            }
            
            log_command('PAUSE_SUCCESS', message, guildData);
            TrackBot.pause(guildData);
            break;
        }
        default: {
            log_command('PAUSE_OVER_MAX_ARG_CNT', message, guildData);
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
    
            if(guildQueue.length<=1 || guildQueue===null) {
                log_command('LIST_QUEUE_EMPTY', message, guildData);
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
            log_command('LIST_SUCCESS', message, guildData);
            break;
        }
        default: {
            log_command('LIST_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_add = async (message, commandArray, guildData) => {
    let volumeData = guildData.TB.volume;
    switch(commandArray.length) {
        case 1: {
            log_command('ADD_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 3: {
            volumeData = parseInt(commandArray[2]);
            if(isNaN(volumeData)) {
                log_command('ADD_INVALID_ARG_TYPE', message, guildData);
                break;
            }
        }
        case 2: {
            if(volumeData<1 || volumeData>9) {
                log_command('PLAY_INVALID_ARG_VAL', message, guildData);
                break;
            }

            log_command('ADD_SUCCESS', message, guildData);
            TrackBot.add(guildData, commandArray[1], volumeData);
            break;
        }
        default: {
            log_command('ADD_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_remove = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            log_command('REMOVE_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 2: {
            let targetIdx = parseInt(commandArray[1]);
            if(isNaN(targetIdx)) {
                log_command('REMOVE_INVALID_ARG_TYPE', message, guildData);
                break;
            }

			if(targetIdx<0 || targetIdx>=guildData.TB.queue.length) {
                log_command('REMOVE_INVALID_ARG_VAL', message, guildData);
				break;
            }
            
            if(targetIdx === guildData.TB.index) {
                log_command('REMOVE_CUR_IDX', message, guildData);
                break;
            }

            log_command('REMOVE_SUCCESS', message, guildData);
            TrackBot.remove(guildData, targetIdx);
            break;
        }
        default: {
            log_command('REMOVE_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_clear = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            let queueLength = guildData.TB.queue.length;
            if(guildData.TB.queue === null || queueLength <= 0) {
                log_command('CLEAR_QUEUE_EMPTY', message, guildData);
                break;
            }
            
            if(guildData.TB.playing && queueLength === 1) {
                log_command('CLEAR_CUR_IDX', message, guildData);
                break;
            }

            log_command('CLEAR_SUCCESS', message, guildData);
            TrackBot.clear(guildData);
            break;
        }
        default: {
            log_command('CLEAR_OVER_MAX_ARG_CNT', message, guildData);
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
                log_command(`NEXT${checkChannel}`, message, guildData);
                break;
            }

            if(guildData.TB.queue.length <= 0) {
                log_command('NEXT_QUEUE_EMPTY', message, guildData);
                break;
            }

            if(skipCount < 0) {
                skipCount = parseInt(commandArray[1]);
                if(isNaN(skipCount)) {
                    log_command('NEXT_INVALID_ARG_TYPE', message, guildData);
                    break;
                }

                if(skipCount <= 1) {
                    log_command('NEXT_INVALID_ARG_VAL', message, guildData);
                    break;
                }
            }
            
            log_command('NEXT_SUCCESS', message, guildData);
            TrackBot.next(guildData, skipCount);
            break;
        }
        default: {
            log_command('NEXT_OVER_MAX_ARG_CNT', message, guildData);
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
                log_command(`PREV${checkChannel}`, message, guildData);
                break;
            }
            
            if(guildData.TB.queue.length <= 0) {
                log_command('PREV_QUEUE_EMPTY');
                break;
            }

            if(skipCount < 0) {
                skipCount = parseInt(commandArray[1]);
                if(isNaN(skipCount)) {
                    log_command('PREV_INVALID_ARG_TYPE', message, guildData);
                    break;
                }

                if(skipCount <= 1) {
                    log_command('PREV_INVALID_ARG_VAL', message, guildData);
                    break;
                }
            }
            
            log_command('PREV_SUCCESS', message, guildData);
            TrackBot.previous(guildData, skipCount);
            break;
        }
        default: {
            log_command('PREV_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

const command_loop = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            log_command('LOOP_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 2: {
            let targetConv = commandArray[1].toLowerCase();
            if(targetConv === 'single' || targetConv === 'queue') {
                log_command('LOOP_SUCCESS', message, guildData);
                TrackBot.loopToggle(guildData, targetConv);
            } else {
                log_command('LOOP_INVALID_ARG_VAL_1', message, guildData);
            }
            break;
        }
        case 3: {
            let targetConv1 = commandArray[1].toLowerCase();
            let targetConv2 = commandArray[2].toLowerCase();
            if(targetConv1 === 'single' || targetConv1 === 'queue') {
                if(targetConv2 === 'on') {
                    log_command('LOOP_SUCCESS', message, guildData);
                    TrackBot.loopEdit(guildData, targetConv1, true);
                } else if(targetConv2 === 'off') {
                    log_command('LOOP_SUCCESS', message, guildData);
                    TrackBot.loopEdit(guildData, targetConv1, false);
                } else {
                    log_command('LOOP_INVALID_ARG_VAL_2', message, guildData);
                }
            } else {
                log_command('LOOP_INVALID_ARG_VAL_1', message, guildData);
            }
            break;
        }
        default: {
            log_command('LOOP_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

//////////////////////////////////////////////////
// TrackBot Playlist Commands
//////////////////////////////////////////////////

const command_playlist = async (message, commandArray, guildData) => {
    switch(commandArray.length) {
        case 1: {
            log_command('PLAYLIST_UNDER_REQ_ARG_CNT', message, guildData);
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
                    log_command('PLAYLIST_LIST_SUCCESS', message, guildData);	
					break;
                }
                case 'create':
                case 'delete':
                case 'queue':
                case 'show':
                case 'add': 
                case 'remove': {
					log_command(`PLAYLIST_${commandArray[1].toUpperCase()}_UNDER_REQ_ARG_CNT`, message, guildData);	
                    break;
                }
                default: {
                    log_command('PLAYLIST_UNKNOWN_ARG_1', message, guildData);
                }
            }
            break;
        }
        case 3: {
            switch(commandArray[1].toLowerCase()) {
                case 'list': {
                    log_command(`PLAYLIST_LIST_OVER_MAX_ARG_CNT`, message, guildData);	
                    break;
                }
                case 'create': {
                    let newPLname = commandArray[2];

                    if(guildData.TB.playlist !== undefined) {
                        if(newPLname in guildData.TB.playlist) {
                            log_command('PLAYLIST_CREATE_FILE_EXISTS', message, guildData);
                            break;
                        }
                    } 

                    TrackBot.playlist_create(guildData, newPLname, message.author.tag);
                    log_command('PLAYLIST_CREATE_SUCCESS', message, guildData);
                    break;
                }
                case 'delete': {
                    let targetPlaylist = commandArray[2];
                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        log_command('PLAYLIST_DELETE_NO_FILE_EXISTS', message, guildData);
                        break;
                    }

                    TrackBot.playlist_delete(guildData, targetPlaylist);
                    log_command('PLAYLIST_DELETE_SUCCESS', message, guildData);
                    break;
                }
                case 'queue': {
                    let targetPlaylist = commandArray[2];
                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        log_command('PLAYLIST_QUEUE_NO_DATA_FOUND', message, guildData);
                        break;
                    }

                    TrackBot.playlist_queue(guildData, targetPlaylist);
                    log_command('PLAYLIST_QUEUE_SUCCESS', message, guildData);
                    break;
                }
                case 'show': {
                    let targetPlaylist = commandArray[2];
                    let SE           = new Discord.MessageEmbed();
                    let targetFile   = path.join(guildData.configurationDir, `${targetPlaylist}.json`);
                    let playlist     = ExF.getArrayFromFile(targetFile);
                    let loopIdx;

                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        log_command('PLAYLIST_SHOW_NO_PL_FOUND', message, guildData);
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
                    log_command('PLAYLIST_SHOW_SUCCESS', message, guildData);
                    break;
                }
                case 'add': 
                case 'remove': {
					log_command(`PLAYLIST_${commandArray[1].toUpperCase()}_UNDER_REQ_ARG_CNT`, message, guildData);	
                    break;
                }
                default: {
                    log_command('PLAYLIST_UNKNOWN_ARG_1', message, guildData);
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
                    log_command(`PLAYLIST_${commandArray[1].toUpperCase()}_OVER_MAX_ARG_CNT`, message, guildData);	
                    break;
                }
                case 'add': {
                    let targetPlaylist = commandArray[2];
                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        log_command('PLAYLIST_ADD_NO_PL_FOUND', message, guildData);
                        break;
                    }

                    TrackBot.playlist_add(guildData, targetPlaylist, commandArray[3], guildData.TB.volume);
                    log_command('PLAYLIST_ADD_SUCCESS', message, guildData);
                    break;
                }
                case 'remove': {
                    let targetPlaylist = commandArray[2];
                    let targetIdx      = parseInt(commandArray[3]);

                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        log_command('PLAYLIST_REMOVE_NO_PL_FOUND', message, guildData);
                        break;
                    }

                    if(isNaN(targetIdx)) {
                        log_command('PLAYLIST_REMOVE_INVALID_ARG_TYPE', message, guildData);
                        break;
                    }

                    if(targetIdx >= guildData.TB.playlist[targetPlaylist].length || targetIdx < 0) {
                        log_command('PLAYLIST_REMOVE_INVALID_ARG_VALUE', message, guildData);
                        break;
                    }

                    TrackBot.playlist_remove(guildData, targetPlaylist, targetIdx);
                    log_command('PLAYLIST_REMOVE_SUCCESS', message, guildData);
                    break;
                }
                default: {
                    log_command('PLAYLIST_UNKNOWN_ARG_1', message, guildData);
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
                    log_command(`PLAYLIST_${commandArray[1].toUpperCase()}_OVER_MAX_ARG_CNT`, message, guildData);	
                    break;
                }
                case 'add': {
                    let targetPlaylist = commandArray[2];
                    let volumeData     = parseInt(commandArray[4]);

                    if(!(targetPlaylist in guildData.TB.playlist)) {
                        log_command('PLAYLIST_ADD_NO_PL_FOUND', message, guildData);
                        break;
                    }

                    if(isNaN(volumeData)) {
                        log_command('PLAYLIST_ADD_INVALID_ARG_TYPE', message, guildData);
                        break;
                    }

                    TrackBot.playlist_add(guildData, targetPlaylist, commandArray[3], volumeData);
                    log_command('PLAYLIST_ADD_SUCCESS', message, guildData);
                    break;
                }
                case 'delete': {
                    log_command(`PLAYLIST_DELETE_OVER_MAX_ARG_CNT`, message, guildData);	
                    break;
                }
                default: {
                    log_command('PLAYLIST_UNKNOWN_ARG_1', message, guildData);
                }
            }
            break;
        }
        default: {
            log_command(`PLAYLIST_OVER_MAX_ARG_CNT`, message, guildData);
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
