"use strict";

// external module
const YTDLC  = require('ytdl-core');

// custom module
const ExF    = require('./ExF.js');
const log_TB = require('./Log.js').log_TB;
const Path = require('path');

async function TB_JOIN(guildData,userVoiceChannel)
{
    try {
        guildData.TB.voiceConnection = await userVoiceChannel.join();
    } catch (errorData) {
        log_TB('join_fail',guildData);
        console.log(errorData);
        return false;
    }
    
    guildData.TB.voiceConnection.voice.setSelfDeaf(true); // ashz> faster connection speed
    guildData.TB.voiceChannel = userVoiceChannel;
    return true;
}
module.exports.TB_JOIN = TB_JOIN;

async function TB_LEAVE(guildData)
{
    try { guildData.TB.voiceConnection.dispatcher.destroy(); } catch(errorData) {}
    try { await guildData.TB.voiceConnection.disconnect(); } catch(errorData) {}
    guildData.TB.voiceConnection  = null;
    guildData.TB.userVoiceChannel = null;
    guildData.TB.userTextChannel  = null;
    guildData.TB.queue            = [];
    guildData.TB.index            = 0;
    guildData.TB.playing          = false;
    guildData.TB.paused          = false;
    return true;
}
module.exports.TB_LEAVE = TB_LEAVE;

async function TB_PLAY(guildData)
{
    const trackData = guildData.TB.queue[guildData.TB.index];

    if(guildData.TB.playing) {
        await guildData.TB.voiceConnection.dispatcher.destroy();
    }

    // Why is the HighWaterMark 10KB? What is HighWaterMark?
    guildData.TB.voiceConnection
        .play( YTDLC(trackData.video_url), {filter:'audioonly',quality:'highestaudio',highWaterMark:(1<<25)} )
        .on('finish', () => 
        {
            guildData.TB.playing = false;
            TB_QUEUE_NEXT(guildData);
        })
        .on('error', (errorData) =>
        {
            log_TB('PLAY_STREAM_DISCONNECTION_ERROR',guildData);
            console.error(errorData);

            guildData.TB.errorCount++;
            if(guildData.TB.errorCount >= 3) {
                log_TB('PLAY_STREAM_CONTINUOUS_DISCONNECTION_ERROR');
                return;
            }
            TB_PLAY(guildData);
        });

    guildData.TB.voiceConnection.dispatcher.setVolumeLogarithmic(trackData.volume*0.1);
    guildData.TB.playing=true;
    guildData.TB.paused=false;

    log_TB('PLAY_SUCCESS',guildData);
    return true;
}
module.exports.TB_PLAY = TB_PLAY;

async function TB_STOP(guildData)
{
    try{
        await  guildData.TB.voiceConnection.dispatcher.destroy();
    } catch(errorData) {
        log_TB('STOP_FAILED_TO_DESTROY_DISPATCH',guildData,errorData);
        return;
    }

    guildData.TB.playing          = false;
    guildData.TB.paused = false;
    log_TB('STOP_SUCCESS',guildData);
}
module.exports.TB_STOP = TB_STOP;

// queue clear & stop TB
async function TB_CLEAR(guildData)
{
    if(!guildData.TB.playing) {
        if(guildData.TB.queue == null) {
            log_TB('CLEAR_NOTHING_TO_STOP',guildData);
        }
        else {
            log_TB('CLEAR_CLEARING_QUEUE',guildData);
            guildData.TB.index = 0;
            guildData.TB.queue = [];
        }
    } 
    else {
        try {
            await guildData.TB.voiceConnection.dispatcher.destroy();
        }
        catch(errorData) {
            log_TB('CLEAR_FAILED_TO_DESTROY_DISPATCH',guildData);
            console.error(errorData);
            return;
        }

        guildData.TB.index = 0;
        guildData.TB.queue = [];
        guildData.TB.playing = false;

        log_TB('CLEAR_SUCCESS',guildData);
    }
}

// next queue
function TB_QUEUE_NEXT(guildData)
{
    const loopSingle = guildData.TB.loopSingle;
    const loopQueue = guildData.TB.loopQueue;
 
    switch(guildData.TB.queue.length)
    {
        case 0:
        {
            log_TB('NEXT_QUEUE_EMPTY',guildData);
            break;
        }
        case 1:
        {
            if(loopSingle || loopQueue) {
                TB_PLAY(guildData);
            } else {
                log_TB('NEXT_NOTHING_NEXT',guildData);
            }
            break; 
        }
        default:
        {
            if(loopSingle) {
                TB_PLAY(guildData);
            } else if (loopQueue) {
                guildData.TB.index = (guildData.TB.index + 1) % guildData.TB.queue.length;
                TB_PLAY(guildData);
            } else {
                if((guildData.TB.index + 1) > guildData.TB.queue.length) {
                    log_TB('NEXT_QUEUE_END',guildData);
                } else {
                    guildData.TB.index = guildData.TB.index + 1;
                    TB_PLAY(guildData);
                }
            }
        }
    }
}

// command next queue
// skipCount = 0 : skips 1
// skipCount > 0 : skips skipCount times 
function TB_NEXT(guildData,skipCount)
{
    const loopSingle = guildData.TB.loopSingle;
    const loopQueue = guildData.TB.loopQueue;
 
    switch(guildData.TB.queue.length)
    {
        case 0:
        {
            log_TB('SKIP_QUEUE_EMPTY',guildData);
            break;
        }
        case 1:
        {
            if(loopSingle || loopQueue) {
                TB_PLAY(guildData);
            } else {
                log_TB('SKIP_NOTHING_NEXT',guildData);
            }
            break; 
        }
        default:
        {
            if(skipCount <= 0) skipCount = 1;
            if(loopSingle || loopQueue) {
                guildData.TB.index = (guildData.TB.index + skipCount) % guildData.TB.queue.length ;
                TB_PLAY(guildData);
            } else {
                if((guildData.TB.index + skipCount) > guildData.TB.queue.length) {
                    log_TB('SKIP_NOTHING_NEXT',guildData);
                } else {
                    guildData.TB.index = guildData.TB.index+skipCount;
                    TB_PLAY(guildData);
                }
            }
        }
    }
}
module.exports.TB_NEXT = TB_NEXT;

// command next queue
// skipCount = 0 : skips 1
// skipCount > 0 : skips skipCount times 
function TB_PREV(guildData,skipCount)
{
    const loopSingle = guildData.TB.loopSingle;
    const loopQueue = guildData.TB.loopQueue;
 
    switch(guildData.TB.queue.length)
    {
        case 0:
        {
            log_TB('SKIP_QUEUE_EMPTY',guildData);
            break;
        }
        case 1:
        {
            if(loopSingle || loopQueue) {
                TB_PLAY(guildData);
            } else {
                log_TB('SKIP_NOTHING_NEXT',guildData);
            }
            break; 
        }
        default:
        {
            // INVALID ALGORITHM, INSTEAD OF GOING BACKWARDS, COUNT GO FORWARDS TODO : ashz
            let Uz_check = guildData.TB.index - skipCount;
            if(Uz_check < 0) {
                Uz_check = Uz_check * -1;
            }
            guildData.TB.index = Uz_check % guildData.TB.queue.length;
            TB_PLAY(guildData);
        }
    }
}
module.exports.TB_PREV = TB_PREV;

async function TB_PAUSE(guildData)
{
   
    try {
        await guildData.TB.voiceConnection.dispatcher.pause(false);
    }
    catch(errorData) {
        log_TB('PAUSE_PROCESS_ERROR',guildData);
        return;
    }
    
    guildData.TB.paused = true;
    guildData.TB.playing = false;
    log_TB('PAUSE_SUCCESS',guildData);
}
module.exports.TB_PAUSE  = TB_PAUSE;

async function TB_RESUME(guildData)
{
    if (guildData.TB.playing) {
        log_TB('RESUME_ALREADY_PLAYING',guildData);
        return;
    }

    try {
        await guildData.TB.voiceConnection.dispatcher.resume();
    }
    catch(errorData) {
        log_TB('RESUME_PROCESS_ERROR',guildData);
        return;
    }

    guildData.TB.paused  = false;
    guildData.TB.playing = true;
    log_TB('RESUME_SUCCESS',guildData);    
}
module.exports.TB_RESUME = TB_RESUME;

async function TB_QUEUE_ADD(guildData,targetURL,rvolume)
{
    let requestData;
    try {
        requestData = await YTDLC.getInfo(targetURL);
    }
    catch(receivedError) {
        log_TB('QUEUE_ADD_GET_INFO_FAILED',guildData,targetURL);
        console.log(receivedError);
        return false;
    }

    if(requestData==null) {
        log_TB('QUEUE_ADD_DATA_NULL',guildData,targetURL);
        return false;
    }

    const videoData = {
        title:     requestData.videoDetails.title,
        video_url: requestData.videoDetails.video_url,
        length:    requestData.videoDetails.lengthSeconds,
        volume:    rvolume
    };

    guildData.TB.queue.push(videoData);
    return true;
}
module.exports.TB_QUEUE_ADD = TB_QUEUE_ADD;

async function TB_QUEUE_REMOVE(guildData,targetIdx)
{
    guildData.TB.queue.splice(targetIdx,1);
    if(guildData.TB.index > targetIdx) {
        guildData.TB.index--;
    }
}
module.exports.TB_QUEUE_REMOVE = TB_QUEUE_REMOVE

async function TB_QUEUE_CLEAR(guildData)
{
    let queueLength = guildData.TB.queue.length;
    let cIndex = guildData.TB.index;

    if(queueLength-1 > cIndex) {
        guildData.TB.queue.splice(cIndex+1,(queueLength-1)-cIndex);
    } 
    
    guildData.TB.queue.splice(0,cIndex);
    guildData.TB.index = 0;
}
module.exports.TB_QUEUE_CLEAR = TB_QUEUE_CLEAR;

async function TB_SETTING_LOOP_TOGGLE(guildData,targetLoop)
{
    if(targetLoop === 'single') {
        guildData.TB.loopSingle = !guildData.TB.loopSingle;
    } else if(targetLoop === 'queue') {
        guildData.TB.loopQueue = !guildData.TB.loopQueue;
    }
    ExF.saveGuildData(guildData);
}
module.exports.TB_SETTING_LOOP_TOGGLE = TB_SETTING_LOOP_TOGGLE;

async function TB_SETTING_LOOP_EDIT(guildData,targetLoop,value)
{
    if(targetLoop === 'single') {
        guildData.TB.loopSingle = value;
    } else if(targetLoop === 'queue') {
        guildData.TB.loopQueue = value;
    }
    ExF.saveGuildData(guildData);
}
module.exports.TB_SETTING_LOOP_EDIT = TB_SETTING_LOOP_EDIT;

async function TB_PLAYLIST_CREATE(guildData, newPLname, plOwner)
{
    guildData.TB.PLAYLIST[newPLname] = 
    {
        owner: plOwner,
        length: 0,
        elements: 0,
    };

    const targetFile = Path.join(guildData.configurationDir, `${newPLname}.json`);

    ExF.createFile(targetFile,null);
    ExF.saveGuildData(guildData);
}
module.exports.TB_PLAYLIST_CREATE = TB_PLAYLIST_CREATE;

async function TB_PLAYLIST_DELETE(guildData, targetPLname)
{
    delete guildData.TB.PLAYLIST[targetPLname];

    const targetFile = Path.join(guildData.configurationDir, `${targetPLname}.json`);

    ExF.removeFile(targetFile);
    ExF.saveGuildData(guildData);
}
module.exports.TB_PLAYLIST_DELETE = TB_PLAYLIST_DELETE;

async function TB_PLAYLIST_ADD(guildData, targetPLname, url, vol)
{
    const targetFile = Path.join(guildData.configurationDir, `${targetPLname}.json`);
    let playlistData = ExF.getArrayFromFile(targetFile);
    let requestData;

    if(playlistData === null) {
        playlistData = [];
    }
    console.log(playlistData);

    try {
        requestData = await YTDLC.getInfo(url);
    }
    catch(receivedError) {
        log_TB('QUEUE_ADD_GET_INFO_FAILED',guildData,url);
        console.log(receivedError);
        return false;
    }

    if(requestData==null) {
        log_TB('QUEUE_ADD_DATA_NULL',guildData,url);
        return false;
    }
    
    console.log(requestData.videoDetails.lengthSeconds);
    guildData.TB.PLAYLIST[targetPLname].length += parseInt(requestData.videoDetails.lengthSeconds);

    console.log(guildData.TB.PLAYLIST[targetPLname].length);
    guildData.TB.PLAYLIST[targetPLname].elements++;

    playlistData.push({title:requestData.videoDetails.title,length:requestData.videoDetails.lengthSeconds,video_url:url,volume:vol});

    ExF.saveGuildData(guildData);
    ExF.saveArrayToFile(targetFile,playlistData);

}
module.exports.TB_PLAYLIST_ADD = TB_PLAYLIST_ADD;

async function TB_PLAYLIST_REMOVE(guildData,targetPLname,targetIdx)
{
    const targetFile = Path.join(guildData.configurationDir, `${targetPLname}.json`);
    let playlistData = ExF.getArrayFromFile(targetFile);
    
    guildData.TB.PLAYLIST[targetPLname].length -= parseInt(playlistData[targetIdx].lengthSeconds);
    guildData.TB.PLAYLIST[targetPLname].elements--;
    playlistData.splice(targetIdx,1);

    ExF.saveGuildData(guildData);
    ExF.saveArrayToFile(targetFile,playlistData);
}
module.exports.TB_PLAYLIST_REMOVE = TB_PLAYLIST_REMOVE;

async function TB_PLAYLIST_QUEUE(guildData, targetPLname)
{
    const targetFile = Path.join(guildData.configurationDir, `${targetPLname}.json`);
    let playlistData = ExF.getArrayFromFile(targetFile);
    
    guildData.TB.queue = guildData.TB.queue.concat(playlistData);
}
module.exports.TB_PLAYLIST_QUEUE = TB_PLAYLIST_QUEUE;