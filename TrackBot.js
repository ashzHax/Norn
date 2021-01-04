"use strict";

// external module
const YTDLC  = require('ytdl-core');

// internal module
const path   = require('path');

// custom modules
const ExF    = require('./ExF.js');
const log_TB = require('./Log.js').log_TB;

const connect_to_user_channel = async (guildData, client, userTextChannel, userVoiceChannel) => {
    if(!userVoiceChannel.permissionsFor(client).has("CONNECT")) {
        log_TB('JOIN_NO_PERM_CONNECT', guildData);
        return false;
    }
    if(!userVoiceChannel.permissionsFor(client).has("SPEAK")) {
        log_TB('JOIN_NO_PERM_SPEAK', guildData);
        return false;
    }

    try {
        guildData.TB.voiceConnection = (await userVoiceChannel.join());
    } catch(errorData) {
        console.error(errorData);
        log_TB('JOIN_FAILED', guildData);
        return false;
    }
    
    // ashz> faster connection speed
    guildData.TB.voiceConnection.voice.setSelfDeaf(true);

    guildData.TB.textChannel = userTextChannel;
    guildData.TB.voiceChannel = userVoiceChannel;

    return true;
}

const leave_connected_channel = async (guildData) => {
    try { await guildData.TB.voiceConnection.dispatcher.destroy(); } catch(errorData) {}
    try { await guildData.TB.voiceConnection.disconnect(); } catch(errorData) {}

    guildData.TB.voiceConnection  = null;
    guildData.TB.userVoiceChannel = null;
    guildData.TB.userTextChannel  = null;
    guildData.TB.queue            = [];
    guildData.TB.index            = 0;
    guildData.TB.playing          = false;
    guildData.TB.paused           = false;

    return true;
}

const play_track_override = async (guildData, targetIdx=null) => {
    let trackData;

    if(targetIdx !== null) {
        guildData.TB.index = targetIdx; 
    }
    
    trackData = guildData.TB.queue[guildData.TB.index];

    if(guildData.TB.playing) {
        await guildData.TB.voiceConnection.dispatcher.destroy();
    }

    // Why is the HighWaterMark 10KB? What is HighWaterMark?
    guildData.TB.voiceConnection.play(YTDLC(trackData.video_url), {filter:'audioonly', quality:'highestaudio', highWaterMark:(1<<25)})
                                .on('finish', () => {
                                    guildData.TB.playing = false;
                                    queue_play_next_idx(guildData);
                                })
                                .on('error', (errorData) => {
                                    console.error(errorData);
                                    log_TB('PLAY_STREAM_ERROR', guildData);

                                    guildData.TB.errorCount++;
                                    if(guildData.TB.errorCount >= 3) {
                                        log_TB('PLAY_MULTI_INIT_FAIL', guildData);
                                        queue_play_next_idx(guildData, 'fail');
                                        return;
                                    }

                                    play_track_override(guildData);
                                });

    guildData.TB.voiceConnection.dispatcher.setVolumeLogarithmic(trackData.volume*0.1);
    guildData.TB.playing = true;
    guildData.TB.paused = false;

    return true;
}

/////////////////////////////////////////// ^ CLEANED /////////////////////////////////////////////////////////

async function stop_and_reset_current_track(guildData)
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
function queue_play_next_idx(guildData, status=null)
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
            switch(status) {
                case 'fail': return;
            }
            if(loopSingle || loopQueue) {
                play_track_override(guildData);
            } else {
                log_TB('NEXT_NOTHING_NEXT',guildData);
            }
            break; 
        }
        default:
        {
            if(loopSingle) {
                play_track_override(guildData);
            } else if (loopQueue) {
                guildData.TB.index = (guildData.TB.index + 1) % guildData.TB.queue.length;
                play_track_override(guildData);
            } else {
                if((guildData.TB.index + 1) > guildData.TB.queue.length) {
                    log_TB('NEXT_QUEUE_END',guildData);
                } else {
                    guildData.TB.index = guildData.TB.index + 1;
                    play_track_override(guildData);
                }
            }
        }
    }
}

// command next queue
// skipCount = 0 : skips 1
// skipCount > 0 : skips skipCount times 
function play_next_track_in_queue(guildData,skipCount)
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
                play_track_override(guildData);
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
                play_track_override(guildData);
            } else {
                if((guildData.TB.index + skipCount) > guildData.TB.queue.length) {
                    log_TB('SKIP_NOTHING_NEXT',guildData);
                } else {
                    guildData.TB.index = guildData.TB.index+skipCount;
                    play_track_override(guildData);
                }
            }
        }
    }
}


// command next queue
// skipCount = 0 : skips 1
// skipCount > 0 : skips skipCount times 
function play_previous_track_in_queue(guildData,skipCount)
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
                play_track_override(guildData);
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
            play_track_override(guildData);
        }
    }
}


async function pause_current_track(guildData)
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


async function resume_current_track(guildData)
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


async function add_URL_to_track_queue(guildData,targetURL,rvolume)
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


async function remove_idx_to_queue(guildData,targetIdx)
{
    guildData.TB.queue.splice(targetIdx,1);
    if(guildData.TB.index > targetIdx) {
        guildData.TB.index--;
    }
}


async function clear_all_tracks_in_queue(guildData)
{
    let queueLength = guildData.TB.queue.length;
    let cIndex = guildData.TB.index;

    if(queueLength-1 > cIndex) {
        guildData.TB.queue.splice(cIndex+1,(queueLength-1)-cIndex);
    } 
    
    guildData.TB.queue.splice(0,cIndex);
    guildData.TB.index = 0;
}


async function toggle_loop_values(guildData,targetLoop)
{
    if(targetLoop === 'single') {
        guildData.TB.loopSingle = !guildData.TB.loopSingle;
    } else if(targetLoop === 'queue') {
        guildData.TB.loopQueue = !guildData.TB.loopQueue;
    }
    ExF.saveGuildData(guildData);
}


async function edit_loop_values(guildData,targetLoop,value)
{
    if(targetLoop === 'single') {
        guildData.TB.loopSingle = value;
    } else if(targetLoop === 'queue') {
        guildData.TB.loopQueue = value;
    }
    ExF.saveGuildData(guildData);
}


async function create_new_playlist_index_with_file(guildData, newPLname, plOwner)
{
    if(guildData.TB.playlist === undefined) {
        guildData.TB.playlist = {};
    }
    
    guildData.TB.playlist[newPLname] = 
    {
        owner: plOwner,
        length: 0,
        elements: 0,
    };

    const targetFile = path.join(guildData.configurationDir, `${newPLname}.json`);

    ExF.createFile(targetFile,null);
    ExF.saveGuildData(guildData);
}


async function delete_playlist_index_with_file(guildData, targetPLname)
{
    delete guildData.TB.playlist[targetPLname];

    const targetFile = path.join(guildData.configurationDir, `${targetPLname}.json`);

    ExF.removeFile(targetFile);
    ExF.saveGuildData(guildData);
}


async function append_to_target_playlist(guildData, targetPLname, url, vol)
{
    const targetFile = path.join(guildData.configurationDir, `${targetPLname}.json`);
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
    guildData.TB.playlist[targetPLname].length += parseInt(requestData.videoDetails.lengthSeconds);

    console.log(guildData.TB.playlist[targetPLname].length);
    guildData.TB.playlist[targetPLname].elements++;

    playlistData.push({title:requestData.videoDetails.title,length:requestData.videoDetails.lengthSeconds,video_url:url,volume:vol});

    ExF.saveGuildData(guildData);
    ExF.saveArrayToFile(targetFile,playlistData);

}


async function remove_from_target_playlist(guildData,targetPLname,targetIdx)
{
    const targetFile = path.join(guildData.configurationDir, `${targetPLname}.json`);
    let playlistData = ExF.getArrayFromFile(targetFile);
    
    guildData.TB.playlist[targetPLname].length -= parseInt(playlistData[targetIdx].lengthSeconds);
    guildData.TB.playlist[targetPLname].elements--;
    playlistData.splice(targetIdx,1);

    ExF.saveGuildData(guildData);
    ExF.saveArrayToFile(targetFile,playlistData);
}


async function append_target_playlist_to_current_queue(guildData, targetPLname)
{
    const targetFile = path.join(guildData.configurationDir, `${targetPLname}.json`);
    let playlistData = ExF.getArrayFromFile(targetFile);
    
    guildData.TB.queue = guildData.TB.queue.concat(playlistData);
}

module.exports = {
    join            : connect_to_user_channel,
    leave           : leave_connected_channel,
    play            : play_track_override,
    stop            : stop_and_reset_current_track,
    next            : play_next_track_in_queue,
    previous        : play_previous_track_in_queue,
    pause           : pause_current_track,
    resume          : resume_current_track,
    add             : add_URL_to_track_queue,
    remove          : remove_idx_to_queue,
    clear           : clear_all_tracks_in_queue,
    loopToggle      : toggle_loop_values,
    loopEdit        : edit_loop_values,
    playlist_create : create_new_playlist_index_with_file,
    playlist_delete : delete_playlist_index_with_file,
    playlist_add    : append_to_target_playlist,
    playlist_remove : remove_from_target_playlist,
    playlist_queue  : append_target_playlist_to_current_queue,
};
