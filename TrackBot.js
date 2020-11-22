"use strict";

// external module
const YTDLC  = require('ytdl-core');

// custom module
const AXC    = require('./Function.js');
const log_TB = require('./Log.js').log_TB;

async function TB_PLAY(guildData)
{
    const trackData = guildData.TB.queue[guildData.TB.index];

    // Why is the HighWaterMark 10KB? What is HighWaterMark?
    guildData.TB.connection
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
    
    guildData.TB.connection.dispatcher.setVolumeLogarithmic(trackData.volume*0.1);
    guildData.TB.playing=true;

    log_TB('PLAY_SUCCESS',guildData);
}

// stop command
async function TB_STOP(guildData)
{
    if(!guildData.TB.playing) {
        if(guildData.TB.queue == null) {
            log_TB('STOP_NOTHING_TO_STOP',guildData);
        }
        else {
            log_TB('STOP_CLEARING_QUEUE',guildData);
            guildData.index = 0;
            guildData.queue = [];
        }
    } 
    else {
        try {
            await guildData.TB.connection.dispatcher.destroy();
        }
        catch(errorData) {
            log_TB('STOP_FAILED_TO_DESTROY_DISPATCH',guildData);
            console.error(errorData);
            return;
        }

        guildData.index = 0;
        guildData.queue = [];
        guildData.TB.playing = false;

        log_TB('STOP_SUCCESS',guildData);
    }
}

// end of queue
async function TB_END(guildData)
{
    if(!guildData.TB.playing) {
        log_TB('STOP_INVALID_STATUS',guildData);
    }
    else {
        if(guildData.TB.index == guildData.TB.queue.length-1) {
            try {
                await guildData.TB.connection.dispatcher.destroy();
            }
            catch(errorData) {
                log_TB('STOP_FAILED_TO_DESTROY_DISPATCH',guildData);
                return;
            }

            guildData.TB.playing = false;

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
            await guildData.TB.connection.dispatcher.destroy();
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
function TB_NEXT(guildData)
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
                if (guildData.TB.queue.length-1 >= guildData.TB.index+1) {
                    guildData.TB.index++;
                    TB_PLAY(guildData);
                }
                else {
                    if (loopQueue) {
                        guildData.TB.index=0;
                        TB_PLAY(guildData);
                    }
                    else {
                        guildData.TB.index++;
                        TB_END(guildData);
                    }
                }
            }
        }
    }
}

// command next queue
// TODO: pre-connection check
function TB_SKIP(guildData)
{
    const loopSingle = guildData.TB.loopSingle;
    const loopQueue = guildData.TB.loopQueue; 
 
    switch(guildData.TB.queue.length)
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
            if (guildData.TB.queue.length-1 >= guildData.TB.index+1) {
                guildData.TB.index++;
                TB_PLAY(guildData);
            }
            else {
                if (guildData.TB.loopQueue) {
                    guildData.TB.index=0;
                    TB_PLAY(guildData);
                }
                else {
                    log_TB('SKIP_NOTHING_NEXT',guildData);
                }
            }
        }
    }
}

async function TB_PAUSE(guildData)
{
    if (!guildData.TB.playing) {
        log_TB('PAUSE_NOT_PLAYING',guildData);
        return;
    }
    
    try {
        await guildData.TB.connection.dispatcher.pause(false);
    }
    catch(errorData) {
        log_TB('PAUSE_PROCESS_ERROR',guildData);
        return;
    }
    
    guildData.TB.playing = false;
    log_TB('PAUSE_SUCCESS',guildData);
}

async function TB_RESUME(guildData)
{
    if (guildData.playing) {
        log_TB('RESUME_ALREADY_PLAYING',guildData);
        return;
    }

    try {
        await guildData.connection.dispatcher.resume();
    }
    catch(errorData) {
        log_TB('RESUME_PROCESS_ERROR',guildData);
        return;
    }

    guildData.playing=true;
    log_TB('RESUME_SUCCESS',guildData);    
}

module.exports.TB_PLAY   = TB_PLAY;
module.exports.TB_STOP   = TB_STOP;
module.exports.TB_NEXT   = TB_NEXT;
module.exports.TB_SKIP   = TB_SKIP;
module.exports.TB_PAUSE  = TB_PAUSE;
module.exports.TB_RESUME = TB_RESUME;
