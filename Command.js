"use strict";

// external module
const YTDLC       = require("ytdl-core");
const Discord     = require('discord.js');

// internal module
const fs = require('fs');
const Path = require('path');

// custom module
const TB          = require('./TrackBot.js');
const ExF    = require('./Function.js');
const log_command = require('./Log.js').log_command;

async function command_help(message,commandArray,guildData,helpEmbed)
{
    switch(commandArray.length) 
    {
        case 1:
        {   
            helpEmbed.setAuthor(message.author.tag);
            message.channel.send(helpEmbed);
            log_command('HELP_SUCCESS', message, guildData);
            break;
        }
        default:
        {
            log_command('HELP_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function tryJoining(message,guildData) 
{
    const userTextChannel  = message.channel;
    const userVoiceChannel = message.member.voice.channel;

    if(!userTextChannel) {
        log_command('JOIN_TEXT_CHL_NULL', message, guildData);
        return false;
    }

    if(!userVoiceChannel) {
        log_command('JOIN_VC_NULL', message, guildData);
        return false;
    }

    if(!userVoiceChannel.permissionsFor(message.client.user).has("CONNECT")) {
        log_command('JOIN_NO_PERM_CONNECT', message, guildData);
        return false;
    }
    
    if(!userVoiceChannel.permissionsFor(message.client.user).has("SPEAK")) {
        log_command('JOIN_NO_PERM_SPEAK', message, guildData);
        return false;
    }

    if(guildData.TB.DYNAMIC.voiceConnection != null) {
        log_command('JOIN_ALREADY_CONNECTED', message, guildData);
        return false;
    }

    if(!(await TB.TB_JOIN(guildData,userVoiceChannel))) {
        return false;
    }
    guildData.TB.DYNAMIC.textChannel = userTextChannel;

    log_command('JOIN_SUCCESS', message, guildData);
    return true;
}

async function command_join(message,commandArray,guildData)
{
    switch(commandArray.length)
    {
        case 1:
        {
            await tryJoining(message, guildData);
            break;
        }
        default:
        {
            log_command('JOIN_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
    return true;
}

async function command_leave(message,commandArray,guildData)
{
    switch(commandArray.length) 
    {
        case 1:
        {
            if(!guildData.TB.DYNAMIC.voiceConnection) {
                log_command('LEAVE_NO_CONNECTION', message, guildData);
                return;
            }
        
            if(!(await TB.TB_LEAVE(guildData))) {
                return;
            }
        
            log_command('LEAVE_SUCCESS',message,guildData);
            break;
        }
        default:
        {
            log_command('LEAVE_OVER_MAX_ARG_CNT', message, guildData);
        }
    }    
}

async function command_play(message,commandArray,guildData)
{
    var volumeData = guildData.TB.STATIC.volume;

    switch(commandArray.length)
    {
        case 1:
        {
            log_command('PLAY_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 3:
        {
            volumeData = parseInt(commandArray[2]);
            if(isNaN(volumeData)) {
                log_command('PLAY_INVALID_ARG_TYPE', message, guildData);
                break;
            }
        }
        case 2:
        {
            if(guildData.TB.DYNAMIC.voiceConnection == null) {
                if(!(await tryJoining(message, guildData))) {
                    break;
                }
            }

			if(!(await TB.TB_QUEUE_ADD(guildData, commandArray[1], volumeData))) {
                break;
            }

            guildData.TB.DYNAMIC.index = (guildData.TB.DYNAMIC.queue.length - 1);
            log_command('PLAY_SUCCESS', message, guildData);

            TB.TB_PLAY(guildData);
			break;
        }
        default:
        {
            log_command('PLAY_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function command_start(message,commandArray,guildData)
{
    switch(commandArray.length)
    {
        case 1:
        {
            if(guildData.TB.DYNAMIC.voiceConnection == null) {
                log_command('START_NOT_CONNECTED_TO_VC', message, guildData);
                break;
            }

            if(guildData.TB.DYNAMIC.playing) {
                log_command('START_ALREADY_PLAYING', message, guildData);
                break;
            }

            log_command('START_SUCCESS', message, guildData);
            TB.TB_PLAY(guildData);
            break;
        }
        default:
        {
            log_command('START_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function command_stop(message,commandArray,guildData)
{
    switch(commandArray.length)
    {
        case 1:
        {
            if(!guildData.TB.DYNAMIC.playing) {
                log_command('STOP_NOT_PLAYING_TRACK', message, guildData);
                break;
            }
            
            if(!guildData.TB.DYNAMIC.voiceConnection) {
                log_command('STOP_NO_VC', message, guildData);
                break;
            }

            log_command('STOP_SUCCESS', message, guildData);
            TB.TB_STOP(guildData);
            break;
        }
        default:
        {
            log_command('STOP_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function command_resume(message,commandArray,guildData)
{
    switch(commandArray.length)
    {
        case 1:
        {
            if(guildData.TB.DYNAMIC.voiceConnection == null) {
                log_command('RESUME_NO_VC', message, guildData); 
                break;
            }

            if(guildData.TB.DYNAMIC.playing) {
                log_command('RESUME_ALREADY_RUNNING', message, guildData);
                break;
            }

            if(!guildData.TB.DYNAMIC.paused) {
                log_command('RESUME_NOT_PAUSED', message, guildData);
                break;
            }
            
            log_command('RESUME_SUCCESS', message, guildData);
            TB.TB_RESUME(guildData);
            break;
        }
        default:
        {
            log_command('RESUME_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function command_pause(message,commandArray,guildData)
{
    switch(commandArray.length)
    {
        case 1:
        {
            if(guildData.TB.DYNAMIC.voiceConnection == null) {
                log_command('PAUSE_NO_VC', message, guildData); 
                break;
            }

            if(!guildData.TB.DYNAMIC.playing) {
                log_command('PAUSE_NOT_RUNNING', message, guildData);
                break;
            }

            if(guildData.TB.DYNAMIC.paused) {
                log_command('PAUSE_ALREADY_PAUSED', message, guildData);
                break;
            }
            
            log_command('PAUSE_SUCCESS', message, guildData);
            TB.TB_PAUSE(guildData);
            break;
        }
        default:
        {
            log_command('PAUSE_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function command_next(message,commandArray,guildData) 
{
    var skipCount = -1;
    switch(commandArray.length) 
    {
        case 1: skipCount = 0;
        case 2:
        {
            if(guildData.TB.DYNAMIC.queue.length <= 0) {
                log_command('NEXT_QUEUE_EMPTY', message, gyukdData);
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
            TB.TB_NEXT(guildData, skipCount);
            break;
        }
        default:
        {
            log_command('NEXT_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function command_previous(message,commandArray,guildData)
{
    var skipCount = -1;
    switch(commandArray.length) 
    {
        case 1: skipCount = 0;
        case 2:
        {
            if(guildData.TB.DYNAMIC.queue.length <= 0) {
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
            TB.TB_PREV(guildData, skipCount);
            break;
        }
        default:
        {
            log_command('PREV_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function command_list(message,commandArray,guildData)
{
    switch(commandArray.length)
    {
        case 1:
        {
            var loopIdx;
            const guildQueue = guildData.TB.DYNAMIC.queue;
            const queueList = new Discord.MessageEmbed();
    
            if(guildQueue.length <= 0) {
                log_command('LIST_QUEUE_EMPTY', message, guildData);
                break;
            }

            queueList
                .setColor(ExF.html_sky)
                .setTitle('Queue List')
                .setTimestamp();
            
            for(loopIdx=0 ; loopIdx<guildQueue.length ; loopIdx++) {
                queueList.addField(
                    ExF.stringCut(`${guildData.TB.DYNAMIC.index==loopIdx?'-> ':' '}[${loopIdx}] [${ExF.getSecondFormat(guildQueue[loopIdx].length)}] ${guildQueue[loopIdx].title}`,89),
                    `${guildQueue[loopIdx].video_url}`,
                    false
                );
            }

            message.channel.send(queueList);
            log_command('LIST_SUCCESS', message, guildData);
            break;
        }
        default:
        {
            log_command('LIST_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function command_add(message,commandArray,guildData) 
{
    var volumeData = guildData.TB.STATIC.volume;

    switch(commandArray.length) 
    {
        case 1:
        {
            log_command('ADD_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 3:
        {
            volumeData = parseInt(commandArray[2]);
            if(isNaN(volumeData)) {
                log_command('ADD_INVALID_ARG_TYPE', message, guildData);
                break;
            }
        }
        case 2:
        {
            log_command('ADD_SUCCESS', message, guildData);
            TB.TB_QUEUE_ADD(guildData, commandArray[1], volumeData);
            break;
        }
        default:
        {
            log_command('ADD_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function command_remove(message,commandArray,guildData)
{
    switch(commandArray.length) 
    {
        case 1:
        {
            log_command('REMOVE_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 2:
        {
            var targetIdx = parseInt(commandArray[1]);
            if(isNaN(targetIdx)) {
                log_command('REMOVE_INVALID_ARG_TYPE', message, guildData);
                break;
            }

			if(targetIdx<0 || targetIdx>=guildData.TB.DYNAMIC.queue.length) {
                log_command('REMOVE_INVALID_ARG_VAL', message, guildData);
				break;
            }
            
            if(targetIdx==guildData.TB.DYNAMIC.index) {
                log_command('REMOVE_PLAYING_TARGET_IDX', message, guildData);
                break;
            }

            log_command('REMOVE_SUCCESS', message, guildData);
            TB.TB_QUEUE_REMOVE(guildData, targetIdx);
            break;
        }
        default:
        {
            log_command('REMOVE_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
    return;
}

async function command_clear(message,commandArray,guildData)
{
    switch(commandArray.length)
    {
        case 1:
        {
            let queueLength = guildData.TB.DYNAMIC.queue.length;

            if(guildData.TB.DYNAMIC.queue == null || queueLength <= 0) {
                log_command('CLEAR_QUEUE_EMPTY', message, guildData);
                break;
            }
            
            if(guildData.TB.DYNAMIC.playing && queueLength == 1) {
                log_command('CLEAR_PLAYING_TARGET_IDX', message, guildData);
                break;
            }

            log_command('CLEAR_SUCCESS', message, guildData);
            TB.TB_QUEUE_CLEAR(guildData);
            break;
        }
        default:
        {
            log_command('CLEAR_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
    return;
}

async function command_loop(message,commandArray,guildData)
{
    switch(commandArray.length)
    {
        case 1:
        {
            log_command('LOOP_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 2:
        {
            let targetConv = commandArray[1].toLowerCase();
            if(targetConv === 'single' || targetConv === 'queue') {
                log_command('LOOP_SUCCESS', message, guildData);
                TB.TB_SETTING_LOOP_TOGGLE(guildData,targetConv);
            } else {
                log_command('LOOP_INVALID_ARG_VAL_1', message, guildData);
            }
            console.log(guildData.TB.STATIC);
            break;
        }
        case 3:
        {
            let targetConv1 = commandArray[1].toLowerCase();
            let targetConv2 = commandArray[2].toLowerCase();
            if(targetConv1 === 'single' || targetConv1 === 'queue') {
                if(targetConv2 === 'on') {
                    TB.TB_SETTING_LOOP_EDIT(guildData,targetConv1,true);
                } else if(targetConv2 === 'off') {
                    TB.TB_SETTING_LOOP_EDIT(guildData,targetConv1,false);
                } else {
                    log_command('LOOP_INVALID_ARG_VAL_2', message, guildData);
                    break;
                }
                log_command('LOOP_SUCCESS', message, guildData);
            } else {
                log_command('LOOP_INVALID_ARG_VAL_1', message, guildData);
            }
            console.log(guildData.TB.STATIC);
            break;
        }
        default:
        {
            log_command('LOOP_OVER_MAX_ARG_CNT', message, guildData);
        }
    }
}

async function command_playlist(message,commandArray,guildData) 
{
    switch(commandArray.length) 
    {
        case 1:
        {
            log_command('PLAYLIST_UNDER_REQ_ARG_CNT', message, guildData);
            break;
        }
        case 2:
        {
            switch(commandArray[1].toLowerCase()) 
            {
				case 'create':
				{
					log_command('PLAYLIST_CREATE_UNDER_REQ_ARG_CNT', message, guildData);	
					break;
				}
                case 'delete': {
					log_command('PLAYLIST_DELETE_UNDER_REQ_ARG_CNT', message, guildData);	
                    break;
                }
                case 'list':
				{
                    let LE = new Discord.MessageEmbed();
                    let playlist = guildData.TB.PLAYLIST;

					LE
                        .setColor(ExF.html_sky)
                        .setAuthor(message.author.tag)
						.setTitle('Playlist List')
						.setTimestamp();
                        
                    Object.entries(playlist).forEach((element) => {
                        LE.addField(element[0], `Created By: ${playlist[element[0]].owner}\nTrack Count: ${playlist[element[0]].elements}\nLength: ${ExF.getSecondFormat(playlist[element[0]].length)}`, false);
                    });
                    message.channel.send(LE);
                    log_command('PLAYLIST_LIST_SUCCESS', message, guildData);	
					break;
                }
                case 'add':
                {
                    log_command('PLAYLIST_ADD_UNDER_REQ_ARG_CNT', message, guildData);	
                    break;
                }
                case 'remove':
                {
                    log_command('PLAYLIST_REMOVE_UNDER_REQ_ARG_CNT', message, guildData);	
                    break;
                }
                default: {
                    log_command('PLAYLIST_UNKNOWN_ARG_1', message, guildData);
                }
            }      
            break;
        }
        case 3:
        {
            switch(commandArray[1].toLowerCase())
            {
                case 'create': 
                {
                    let newPLname = commandArray[2];

                    if(newPLname in guildData.TB.PLAYLIST)
                    {
                        log_command('PLAYLIST_CREATE_FILE_EXISTS', message, guildData);
                        break;
                    }
                    TB.TB_PLAYLIST_CREATE(guildData, newPLname, message.author.tag);
                    log_command('PLAYLIST_CREATE_SUCCESS', message, guildData);
                    break;
                }
                case 'delete': 
                {
                    let targetPLname = commandArray[2];

                    if(!(targetPLname in guildData.TB.PLAYLIST))
                    {
                        log_command('PLAYLIST_DELETE_FILE_NOT_EXISTS', message, guildData);
                        break;
                    }
                    TB.TB_PLAYLIST_DELETE(guildData, targetPLname);
                    log_command('PLAYLIST_DELETE_SUCCESS', message, guildData);
                    break;
                }
                case 'add':
                {
                    log_command('PLAYLIST_ADD_UNDER_REQ_ARG_CNT', message, guildData);	
                    break;
                }
                case 'remove':
                {
                    log_command('PLAYLIST_REMOVE_UNDER_REQ_ARG_CNT', message, guildData);	
                    break;
                }
                case 'show':
                {
                    let targetPLname = commandArray[2];

                    if(!(targetPLname in guildData.TB.PLAYLIST))
                    {
                        log_command('PLAYLIST_SHOW_FILE_NOT_EXISTS', message, guildData);
                        break;
                    }
                    
                    let SE = new Discord.MessageEmbed();
                    const targetFile = Path.join(guildData.DYNAMIC.configurationDir, `${targetPLname}.json`);
                    let playlist = ExF.getArrayFromFile(targetFile);

					SE
                        .setColor(ExF.html_sky)
                        .setAuthor(message.author.tag)
						.setTitle(`[${targetPLname}][C:${guildData.TB.PLAYLIST[targetPLname].elements}][${ExF.getSecondFormat(guildData.TB.PLAYLIST[targetPLname].length)}] Playlist Info`)
						.setTimestamp();

                        
                    var i;
                    for(i=0;i<playlist.length;i++) {
                        SE.addField(
                            ExF.stringCut(`[${i}] ${playlist[0].title}`,84),
                            `[URL] ${playlist[i].url}\n[Length] ${ExF.getSecondFormat(playlist[i].length)}\n[Volume] ${playlist[i].vol}`,
                            false);
                    }
                    message.channel.send(SE);

                    log_command('PLAYLIST_SHOW_SUCCESS', message, guildData);
                    break;
                }
                case 'queue':
                {
                    let targetPLname = commandArray[2];

                    if(!(targetPLname in guildData.TB.PLAYLIST))
                    {
                        log_command('PLAYLIST_QUEUE_FILE_NOT_EXISTS', message, guildData);
                        break;
                    }

                    TB.TB_PLAYLIST_QUEUE(guildData, targetPLname);
                    log_command('PLAYLIST_QUEUE_SUCCESS', message, guildData);
                    break;
                }
            }
            break;
        }
        case 4:
        {
            switch(commandArray[1].toLowerCase())
            {
                case 'add':
                {
                    let targetPLname = commandArray[2];

                    if(!(targetPLname in guildData.TB.PLAYLIST))
                    {
                        log_command('PLAYLIST_ADD_NO_PLAYLIST_FOUND', message, guildData);
                        break;
                    }

                    TB.TB_PLAYLIST_ADD(guildData,targetPLname,commandArray[3],guildData.TB.STATIC.volume);
                    log_command('PLAYLIST_ADD_SUCCESS', message, guildData);
                    break;
                }
                case 'remove':
                {
                    let targetPLname = commandArray[2];

                    if(!(targetPLname in guildData.TB.PLAYLIST))
                    {
                        log_command('PLAYLIST_REMOVE_NO_PLAYLIST_FOUND', message, guildData);
                        break;
                    }

                    let targetIdx = parseInt(commandArray[3]);
                    if(isNaN(targetIdx)) {
                        log_command('PLAYLIST_REMOVE_INVALID_ARG_TYPE', message, guildData);
                        break;
                    }

                    if(targetIdx >= guildData.TB.PLAYLIST[targetPLname].length || targetIdx < 0) {
                        log_command('PLAYLIST_REMOVE_INVALID_ARG_VALUE', message, guildData);
                        break;
                    }

                    TB.TB_PLAYLIST_REMOVE(guildData,targetPLname,targetIdx);
                    log_command('PLAYLIST_REMOVE_SUCCESS', message, guildData);
                    break;
                }
            }
            break;
        }
        case 5:
        {
            switch(commandArray[1].toLowerCase())
            {
                case 'add':
                {
                    let targetPLname = commandArray[2];

                    if(!(targetPLname in guildData.TB.PLAYLIST))
                    {
                        log_command('PLAYLIST_ADD_NO_PLAYLIST_FOUND', message, guildData);
                        break;
                    }

                    let volumeData = parseInt(commandArray[4]);
                    if(isNaN(volumeData)) {
                        log_command('PLAYLIST_ADD_INVALID_ARG_TYPE', message, guildData);
                        break;
                    }

                    TB.TB_PLAYLIST_ADD(guildData,targetPLname,commandArray[3],volumeData);
                    log_command('PLAYLIST_ADD_SUCCESS', message, guildData);
                    break;
                }
            }
            break;
        }
        default:
        {

        }
    }
}


module.exports = {
    command_help,
    command_join,
    command_leave,
    command_play,
    command_start,
    command_stop,
    command_resume,
    command_pause,
    command_next,
    command_previous,
    command_list,
    command_add,
    command_remove,
    command_clear,
    command_loop,
    command_playlist,
};

//////////////////////////////////////////////////////////////
// TODO: move it over to syscall
/*
async function command_delete(message,commandArray,guildData)
{
    switch(commandArray.length) 
    {
        case 1:
        {
            log_command('DELETE_NOT_ENOdUGH_ARGUMENTS', message, guildData);
            break;
        }
        case 2:
        {
            var count = parseInt(commandArray[1]);
            if (isNaN(count)) 
            {
                log_command('DELETE_INVALID_ARGUMENT_TYPE', message, guildData);
                break;
            }

            if (count > 100)
            {
                log_command('DELETE_ARGUMENT_OVER_LIMIT', message, guildData);
                break;
            } 
            else if(count < 2)
            {
                log_command('DELETE_ARGUMENT_UNDER_LIMIT', message, guildData);
                break;
            } 

            try
            {
                const bulkMessage = await message.channel.messages.fetch({limit: count});
                message.channel.bulkDelete(bulkMessage);
            }
            catch(errorData)
            {
                log_command('DELETE_PROCESS_ERROR', message, guildData);
                break;
            }
            
            log_command('DELETE_PROCESS_SUCCESS', message, guildData);
            break;
        }
        default: 
        {
            log_command('DELETE_TOO_MANY_ARGUMENTS', message, guildData);
        }
    }
}
module.exports.command_delete = command_delete;
*/
