"use strict";

// external module
const YTDLC       = require("ytdl-core");
const Discord     = require('discord.js');

// internal module
const FileSystem = require('fs');

// custom module
const TB          = require('./TrackBot.js');
const Function    = require('./Function.js');
const log_command = require('./Log.js').log_command;

async function command_help(message,commandArray,guildData,helpEmbed)
{
    switch(commandArray.length) 
    {
        case 1:
        {            
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
                log_command('NEXT_QUEUE_EMPTY');
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
                .setColor(Function.html_sky)
                .setTitle('Queue List')
                .setTimestamp();

            for(loopIdx=0 ; loopIdx<guildQueue.length ; loopIdx++) {
                queueList.addField(
                    `${guildData.TB.DYNAMIC.index==loopIdx?'-> ':' '}[${loopIdx}] [${Function.getSecondFormat(guildQueue[loopIdx].length)}] ${guildQueue[loopIdx].title}`,
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

module.exports.command_help     = command_help;
module.exports.command_join     = command_join;
module.exports.command_leave    = command_leave;
module.exports.command_play     = command_play;
module.exports.command_start    = command_start;
module.exports.command_stop     = command_stop;
module.exports.command_add      = command_add;
module.exports.command_resume   = command_resume;
module.exports.command_pause    = command_pause;
module.exports.command_next     = command_next;
module.exports.command_previous = command_previous;
module.exports.command_list     = command_list;

//////////////////////////////////////////////////////////////
// TODO


// TODO: create this thing
async function command_status(message,commandArray,guildData) 
{
    return;
}
module.exports.command_status = command_status;

// TODO: create this thing, already made, just need to imply to system
async function command_clear(message,commandArray,guildData) 
{
    switch(commandArray.length) 
    {
        case 1:
        {
            guildData.TB.DYNAMIC.index = 0;
            guildData.TB.DYNAMIC.queue = [];
            log_command('CLEAR_SUCCESS',message,guildData);
            break;
        }
        default:
        {
            log_command('CLEAR_TOO_MANY_ARGUMENTS',message,guildData);
        }
    }
}
module.exports.command_clear = command_clear;

const CONFIGURATION_GUILD_DATA_FILE_PATH = './config.json';
function writePlaylistData(playlistName,guildData)
{
    FileSystem.readFile(CONFIGURATION_GUILD_DATA_FILE_PATH, (errorData,fileData) => {
        if(errorData) {
            console.log(errorData);
            return;
        }
        
        guildData.TB.playlist = playlistName;

        let TMP_CONFIGURATION_GUILD_DATA = JSON.parse(fileData);

        TMP_CONFIGURATION_GUILD_DATA[guildData.guildID].TRACK_BOT_PLAYLIST = playlistName;

        const writeData = JSON.stringify(TMP_CONFIGURATION_GUILD_DATA);
        
        FileSystem.writeFile(CONFIGURATION_GUILD_DATA_FILE_PATH,writeData, errorData =>
        {
            if(errorData) {
                console.log(error);
                return;
            }
        });
    });
}

async function command_playlist(message,commandArray,guildData) 
{
    switch(commandArray.length) 
    {
        case 1:
        {
            log_command('PLAYLIST_NOT_ENOUGH_ARGUMENT',message,guildData);
            break;
        }
        case 2:
        {
            switch(commandArray[1].toLowerCase()) 
            {
                case 'show':
                case 'play': {
                    log_command('PLAYLIST_SHOW_PLAYLIST_LIST',message,guildData);
                    break;
                }
                default: {
                    log_command('PLAYLIST_NOT_ENOUGH_ARGUMENT',message,guildData);
                }
            }      
            break;
        }
        case 3:
        {
            switch(commandArray[1].toLowerCase())
            {
                case 'create': {
                    writePlaylistData(commandArray[1],guildData);
                    console.log('done');
                    break;
                }
            }
            break;
        }
    }
}
module.exports.command_playlist = command_playlist;


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