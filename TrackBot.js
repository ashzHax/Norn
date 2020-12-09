"use strict";

// external module
const YTDLC  = require('ytdl-core');

// custom module
const AXC    = require('./Function.js');
const log_TB = require('./Log.js').log_TB;

async function TB_PLAY(guildData)
{
    const trackData = guildData.TB.DYNAMIC.queue[guildData.TB.DYNAMIC.index];

    // Why is the HighWaterMark 10KB? What is HighWaterMark?
    guildData.TB.DYNAMIC.voiceConnection
        .play( YTDLC(trackData.video_url), {filter:'audioonly',quality:'highestaudio',highWaterMark:(1<<25)} )
        .on('finish', () => 
        {
            TB_NEXT(guildData);
        })
        .on('error', (errorData) =>
        {
            log_TB('PLAY_STREAM_DISCONNECTION_ERROR',guildData);
            console.error(errorData);

            TB_PLAY(guildData);
        });
    guildData.TB.DYNAMIC.voiceConnection.dispatcher.setVolumeLogarithmic(trackData.volume*0.1);
    guildData.TB.DYNAMIC.playing=true;

    log_TB('PLAY_SUCCESS',guildData);
}
module.exports.TB_PLAY = TB_PLAY;

async function TB_STOP(guildData)
{
    if(!guildData.TB.DYNAMIC.playing) {
        if(guildData.TB.DYNAMIC.queue == null) {
            log_TB('STOP_NOTHING_TO_STOP',guildData);
        }
        else {
            log_TB('STOP_CLEARING_QUEUE',guildData);
            guildData.TB.DYNAMIC.index = 0;
            guildData.TB.DYNAMIC.queue = [];
        }
    } 
    else {
        try {
            await guildData.TB.DYNAMIC.voiceConnection.dispatcher.destroy();
        }
        catch(errorData) {
            log_TB('STOP_FAILED_TO_DESTROY_DISPATCH',guildData);
            console.error(errorData);
            return;
        }

        guildData.TB.DYNAMIC.index = 0;
        guildData.TB.DYNAMIC.queue = [];
        guildData.TB.DYNAMIC.playing = false;

        log_TB('STOP_SUCCESS',guildData);
    }
}
module.exports.TB_STOP   = TB_STOP;

// end of queue
async function TB_END(guildData)
{
    if(!guildData.TB.DYNAMIC.playing) {
        log_TB('STOP_INVALID_STATUS',guildData);
    }
    else {
        if(guildData.TB.DYNAMIC.index == guildData.TB.DYNAMIC.queue.length-1) {
            try {
                await guildData.TB.DYNAMIC.voiceConnection.dispatcher.destroy();
            }
            catch(errorData) {
                log_TB('STOP_FAILED_TO_DESTROY_DISPATCH',guildData);
                return;
            }

            guildData.TB.DYNAMIC.playing = false;

            log_TB('STOP_SUCCESS_QUEUE_END',guildData); 
        }    
        else {
            log_TB('STOP_INVALID_STATUS',guildData);
        }
    }
}

// queue clear & stop TB
async function TB_CLEAR(guildData)
{
    if(!guildData.TB.DYNAMIC.playing) {
        if(guildData.TB.DYNAMIC.queue == null) {
            log_TB('CLEAR_NOTHING_TO_STOP',guildData);
        }
        else {
            log_TB('CLEAR_CLEARING_QUEUE',guildData);
            guildData.TB.DYNAMIC.index = 0;
            guildData.TB.DYNAMIC.queue = [];
        }
    } 
    else {
        try {
            await guildData.TB.DYNAMIC.voiceConnection.dispatcher.destroy();
        }
        catch(errorData) {
            log_TB('CLEAR_FAILED_TO_DESTROY_DISPATCH',guildData);
            console.error(errorData);
            return;
        }

        guildData.TB.DYNAMIC.index = 0;
        guildData.TB.DYNAMIC.queue = [];
        guildData.TB.DYNAMIC.playing = false;

        log_TB('CLEAR_SUCCESS',guildData);
    }
}

// next queue
function TB_NEXT(guildData)
{
    const loopSingle = guildData.TB.STATIC.loopSingle;
    const loopQueue = guildData.TB.STATIC.loopQueue; 

    switch(guildData.TB.DYNAMIC.queue.length)
    {
        case 0:
        {
            log_TB('NEXT_QUEUE_EMPTY',guildData);
            break;
        }
        case 1:
        {
            if (loopSingle || loopQueue) {
                TB_PLAY(guildData);
            }
            else {
                log_TB('NEXT_QUEUE_END',guildData);
                TB_END(guildData);
            }
            break;
        }
        default:
        {
            if (loopSingle) {
                TB_PLAY(guildData);
            }
            else {
                if (guildData.TB.DYNAMIC.queue.length-1 >= guildData.TB.DYNAMIC.index+1) {
                    guildData.TB.DYNAMIC.index++;
                    TB_PLAY(guildData);
                }
                else {
                    if (loopQueue) {
                        guildData.TB.DYNAMIC.index=0;
                        TB_PLAY(guildData);
                    }
                    else {
                        guildData.TB.DYNAMIC.index++;
                        TB_END(guildData);
                    }
                }
            }
        }
    }
}
module.exports.TB_NEXT   = TB_NEXT;

// command next queue
// TODO: pre-connection check
function TB_SKIP(guildData)
{
    const loopSingle = guildData.TB.STATIC.loopSingle;
 
    switch(guildData.TB.DYNAMIC.queue.length)
    {
        case 0:
        {
            log_TB('SKIP_QUEUE_EMPTY');
            break;
        }
        case 1:
        {
            TB_PLAY(guildData);
            break; 
        }
        default:
        {
            if (guildData.TB.DYNAMIC.queue.length-1 >= guildData.TB.DYNAMIC.index+1) {
                guildData.TB.DYNAMIC.index++;
                TB_PLAY(guildData);
            }
            else {
                if (loopSingle) {
                    guildData.TB.DYNAMIC.index=0;
                    TB_PLAY(guildData);
                }
                else {
                    log_TB('SKIP_NOTHING_NEXT',guildData);
                }
            }
        }
    }
}
module.exports.TB_SKIP   = TB_SKIP;

async function TB_PAUSE(guildData)
{
    if (!guildData.TB.DYNAMIC.playing) {
        log_TB('PAUSE_NOT_PLAYING',guildData);
        return;
    }
    
    try {
        await guildData.TB.DYNAMIC.voiceConnection.dispatcher.pause(false);
    }
    catch(errorData) {
        log_TB('PAUSE_PROCESS_ERROR',guildData);
        return;
    }
    
    guildData.TB.DYNAMIC.playing = false;
    log_TB('PAUSE_SUCCESS',guildData);
}
module.exports.TB_PAUSE  = TB_PAUSE;

async function TB_RESUME(guildData)
{
    if (guildData.TB.DYNAMIC.playing) {
        log_TB('RESUME_ALREADY_PLAYING',guildData);
        return;
    }

    try {
        await guildData.TB.DYNAMIC.voiceConnection.dispatcher.resume();
    }
    catch(errorData) {
        log_TB('RESUME_PROCESS_ERROR',guildData);
        return;
    }

    guildData.TB.DYNAMIC.playing=true;
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

    guildData.TB.DYNAMIC.queue.push(videoData);
    return true;
}
module.exports.TB_QUEUE_ADD = TB_QUEUE_ADD;







