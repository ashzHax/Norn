"use strict";

// external module
const YTDLC       = require("ytdl-core");

// internal module
const FileSystem = require('fs');

// custom module
const AXC         = require('./Function.js');
const TB          = require('./TrackBot.js');
const log_command = require('./Log.js').log_command;

async function command_delete(message,commandArray,guildData)
{
    switch(commandArray.length) 
    {
        case 1:
        {
            log_command('DELETE_NOT_ENOUGH_ARGUMENTS', message, guildData);
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

async function command_join(message,commandArray,guildData)
{
    const userTextChannel  = message.channel;
    const userVoiceChannel = message.member.voice.channel;

    if (!userTextChannel)
    {
        log_command('JOIN_NO_TEXT_CHANNEL', message, guildData);
        return;
    }

    if (!userVoiceChannel) 
    {
        log_command('JOIN_NO_VOICE_CHANNEL', message, guildData);
        return;
    }

    if (!userVoiceChannel.permissionsFor(message.client.user).has("CONNECT")) 
    {
        log_command('JOIN_NO_CONNECT_PERMISSION', message, guildData);
        return;
    }
    
    if (!userVoiceChannel.permissionsFor(message.client.user).has("SPEAK")) 
    {
        log_command('JOIN_NO_SPEAK_PERMISSION', message, guildData);
        return;
    }

    async function createConnection()
    {
        try 
        {
            guildData.TB.DYNAMIC.voiceConnection = await userVoiceChannel.join();
        }
        catch (errorData)
        {
            log_command('JOIN_CONNECTION_FAILED', message, guildData);
            return false;
        }
        
        // ashz: faster connection speed
        guildData.TB.DYNAMIC.voiceConnection.voice.setSelfDeaf(true);

        log_command('JOIN_SUCCESS', message, guildData);
        return true;
    }
    
    switch(commandArray.length) 
    {
        case 1:
        {
            if(await createConnection()) {
                guildData.TB.DYNAMIC.textChannel  = userTextChannel;
                guildData.TB.DYNAMIC.voiceChannel = userVoiceChannel;
            }
            break;
        }
        case 2:
        case 3:
        {
            if(await createConnection()) {
                guildData.TB.DYNAMIC.textChannel = userTextChannel;
                guildData.TB.DYNAMIC.voiceChannel = userVoiceChannel;
                command_play(message,commandArray,guildData);
            }
            break;
        }
        default:
        {
            log_command('JOIN_TOO_MANY_ARGUMENT', message, guildData);   
        }
    }   
}
module.exports.command_join = command_join;

async function command_leave(message,guildData)
{
    if(!guildData.TB.DYNAMIC.voiceConnection) {
        log_command('LEAVE_NO_CONNECTION_FOUND',message,guildData);
        return;
    }

    guildData.TB.DYNAMIC.voiceConnection.disconnect();
    guildData.TB.DYNAMIC.voiceConnection = null;

    log_command('LEAVE_SUCCESS',message,guildData);
}
module.exports.command_leave = command_leave;

async function command_play(message,commandArray,guildData)
{
    var volumeData = guildData.TB.STATIC.volume;

    switch(commandArray.length) {
        case 1: 
        {
            log_command('PLAY_NOT_ENOUGH_ARGUMENT',message,guildData);
            return;
        }
        case 3: volumeData=commandArray[2];
        case 2:
        {
            if(guildData.TB.DYNAMIC.voiceConnection == null) {
                command_join(message,commandArray,guildData);
                return;
            }

            let requestData;
            try {
                requestData = await YTDLC.getInfo(commandArray[1]);
            }
            catch(receivedError) {
                log_command('PLAY_GET_INFO_FAILED',message,guildData);
                console.log(receivedError);
                return;
            }

            if(requestData==null) {
                log_command('PLAY_RECEIVED_DATA_NULL',message,guildData);
                return;
            }

            const videoData = {
                title:     requestData.videoDetails.title,
                video_url: requestData.videoDetails.video_url,
                length:    requestData.videoDetails.lengthSeconds,
                volume:    volumeData
            };
    
            guildData.TB.DYNAMIC.queue.push(videoData);
            break;
        }
        default:
        {
            log_command('PLAY_TOO_MANY_ARGUMENT',message,guildData);
            return;   
        }
    }

    if(guildData.TB.playing) {
        log_command('PLAY_ADDED_REQUEST_TO_QUEUE',message,guildData);
        return;
    }

    try {
        TB.TB_PLAY(guildData);
    }
    catch(receivedError) {
        log_command('PLAY_TB_PLAY_ERROR',message,guildData);
        console.log(receivedError);
        return;
    }
}
module.exports.command_play = command_play;

async function command_stop(guildData)
{
    TB.TB_STOP(guildData,false);
}
module.exports.command_stop = command_stop;

async function command_pause(guildData)
{
    TB.TB_PAUSE(guildData);
}
module.exports.command_pause = command_pause;

async function command_resume(guildData)
{
    TB.TB_RESUME(guildData);
}
module.exports.command_resume = command_resume;

async function command_skip(message,commandArray,guildData) 
{
    TB.TB_SKIP(guildData);
}
module.exports.command_skip = command_skip;

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
