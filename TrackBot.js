"use strict";

// external module
const YTDLC  = require('ytdl-core');

// internal module
const path   = require('path');

// custom modules
const ExF    = require('./ExF.js');
const log_TB = require('./Log.js').log_TB;

//////////////////////////////////////////////////
// Dynamic Functions
//////////////////////////////////////////////////

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
                                    queue_play_next_override(guildData);
                                })
                                .on('error', (errorData) => {
                                    console.error(errorData);
                                    log_TB('PLAY_FAILED', guildData);

                                    guildData.TB.errorCount++;
                                    if(guildData.TB.errorCount >= 3) {
                                        log_TB('PLAY_STREAM_MULTIPLE_INIT_FAILED', guildData);
                                        queue_play_next_override(guildData, 1, 'fail');
                                        return false;
                                    }

                                    play_track_override(guildData);
                                });

    guildData.TB.voiceConnection.dispatcher.setVolumeLogarithmic(trackData.volume*0.1);
    guildData.TB.playing = true;
    guildData.TB.paused = false;

    return true;
}

const stop_and_reset_track = async (guildData) => {
    try {
        await guildData.TB.voiceConnection.dispatcher.destroy();
    } catch(errorData) {
		console.error(errorData);
        log_TB('STOP_FAILED', guildData);
        return false;
    }

    guildData.TB.playing = false;
    guildData.TB.paused  = false;
	return true;
}

const resume_track = async (guildData) => {
    try {
        await guildData.TB.voiceConnection.dispatcher.resume();
    } catch(errorData) {
        log_TB('RESUME_FAILED', guildData);
        return false;
    }

    guildData.TB.paused = false;
    guildData.TB.playing = true;
    return true;
}

const pause_track = async (guildData) => {
    try {
        await guildData.TB.voiceConnection.dispatcher.pause(false);
    } catch(errorData) {
        log_TB('PAUSE_FAILED', guildData);
        return false;
    }
    
    guildData.TB.paused = true;
    guildData.TB.playing = false;
    return true;
}

const queue_add_data_from_URL = async (guildData, targetURL, targetVolume) => {
    let requestData;
    let videoData;

    try {
        requestData = await YTDLC.getInfo(targetURL);
    } catch(errorData) {
        console.error(errorData);
        log_TB('QUEUE_ADD_GET_DATA_FAILED', guildData);
        return false;
    }

    if(requestData == null) {
        log_TB('QUEUE_ADD_GET_DATA_NULL', guildData);
        return false;
    }

    videoData = {
        title:     requestData.videoDetails.title,
        video_url: requestData.videoDetails.video_url,
        length:    requestData.videoDetails.lengthSeconds,
        volume:    targetVolume,
    };

    guildData.TB.queue.push(videoData);
    return true;
}

const queue_remove_idx = async (guildData, targetIndex) => {
    guildData.TB.queue.splice(targetIndex, 1);
    if(guildData.TB.index > targetIndex) {
        guildData.TB.index--;
    }
    return true;
}

const queue_clear_all_index = async (guildData) => {
    let queueLength = guildData.TB.queue.length;
    let currentIndex = guildData.TB.index;

    if(!guildData.TB.playing) {
        guildData.TB.index = 0;
        guildData.TB.queue = [];
    } else {
        if(queueLength-1 > currentIndex) {
            guildData.TB.queue.splice(currentIndex+1,(queueLength-1)-currentIndex);
        } 
        guildData.TB.queue.splice(0,currentIndex);
        
        guildData.TB.index = 0;
        guildData.TB.queue = [];
    }
    return true;
}

const queue_play_next_override = async (guildData, skipCount=1, status) => {
    let loopSingle = guildData.TB.loopSingle;
    let loopQueue = guildData.TB.loopQueue;
 
    if(guildData.TB.queue.length === 1) {
        if(status === 'fail') return false;
        if(loopSingle || loopQueue) {
            play_track_override(guildData);
        } else {
            log_TB('NEXT_END_OF_QUEUE', guildData);
            return false;
        }
    } else {
        if(loopSingle || loopQueue) {
            guildData.TB.index = (guildData.TB.index+skipCount) % guildData.TB.queue.length;
            play_track_override(guildData);
        } else {
            if((guildData.TB.index+skipCount) > guildData.TB.queue.length) {
                log_TB('NEXT_END_OF_QUEUE', guildData);
                return false;
            } else {
                guildData.TB.index = guildData.TB.index + skipCount;
                play_track_override(guildData);
            }
        }
    }
    return true;
}

const queue_play_previous_override = async (guildData, skipCount) => {
    let loopSingle = guildData.TB.loopSingle;
    let loopQueue = guildData.TB.loopQueue;
 
    if(guildData.TB.queue.length === 1) {
        if(loopSingle || loopQueue) {
            play_track_override(guildData);
        } else {
            log_TB('PREV_END_OF_QUEUE', guildData);
            return false;
        }
    } else {
        // TODO : ashz, INVALID ALGORITHM, INSTEAD OF GOING BACKWARDS, COUNT GO FORWARDS
        let Uz_check = guildData.TB.index - skipCount;
        if(Uz_check < 0) {
            return false;
            Uz_check = Uz_check * -1;
        }
        guildData.TB.index = Uz_check % guildData.TB.queue.length;
        play_track_override(guildData);
    }
    return true;
}

const loop_toogle = async (guildData, targetLoop) => {
    if(targetLoop==='single') {
        guildData.TB.loopSingle = !guildData.TB.loopSingle;
    } else if(targetLoop==='queue') {
        guildData.TB.loopQueue = !guildData.TB.loopQueue;
    }

    ExF.saveGuildData(guildData);
    return true;
}

const loop_edit = async (guildData, targetLoop, boolValue) => {
    if(targetLoop==='single') {
        guildData.TB.loopSingle = boolValue;
    } else if(targetLoop==='queue') {
        guildData.TB.loopQueue = boolValue; 
    }

    ExF.saveGuildData(guildData);
    return true;
}

const playlist_create = async (guildData, playlistName, playlistOwner) => {
    let targetFile;

    if(guildData.TB.playlist === undefined) guildData.TB.playlist = {};
    
    guildData.TB.playlist[playlistName] = {
        owner    : playlistOwner,
        length   : 0,
        elements : 0,
    };
    targetFile = path.join(guildData.configurationDir, `${playlistName}.json`);

    ExF.createFile(targetFile, null);
    ExF.saveGuildData(guildData);
    return true;
}

const playlist_delete = async (guildData, playlistName) => {
    let targetFile = path.join(guildData.configurationDir, `${playlistName}.json`);

    delete guildData.TB.playlist[playlistName];
    ExF.removeFile(targetFile);
    ExF.saveGuildData(guildData);
    return true;
}

const playlist_append_to_queue = async (guildData, playlistName) => {
    let targetFile   = path.join(guildData.configurationDir, `${playlistName}.json`);
    let playlistData = ExF.getArrayFromFile(targetFile);
    
    guildData.TB.queue = guildData.TB.queue.concat(playlistData);
    return true;
}

const playlist_append_idx = async (guildData, playlistName, dataURL, targetVolume) => {
    let targetFile   = path.join(guildData.configurationDir, `${playlistName}.json`);
    let playlistData = ExF.getArrayFromFile(targetFile);
    let requestData;
    let newData;

    if(playlistData === null) {
        playlistData = [];
    }

    try {
        requestData = await YTDLC.getInfo(dataURL);
    } catch(errorData) {
        console.error(errorData);
        log_TB('QUEUE_APPEND_GET_INFO_FAILED', guildData);
        return false;
    }

    if(requestData == null) {
        log_TB('QUEUE_APPEND_DATA_NULL', guildData);
        return false;
    }
    
    guildData.TB.playlist[playlistName].length += parseInt(requestData.videoDetails.lengthSeconds);
    guildData.TB.playlist[playlistName].elements++;
    newData = {
        title     : requestData.videoDetails.title,
        length    : requestData.videoDetails.lengthSeconds,
        video_url : dataURL,
        volume    : targetVolume,
    };
    playlistData.push(newData);

    ExF.saveArrayToFile(targetFile, playlistData);
    ExF.saveGuildData(guildData);
    return true;
}

const playlist_remove_idx = async (guildData, playlistName, targetIdx) => {
    let targetFile   = path.join(guildData.configurationDir, `${playlistName}.json`);
    let playlistData = ExF.getArrayFromFile(targetFile);
    
    guildData.TB.playlist[playlistName].length -= parseInt(playlistData[targetIdx].lengthSeconds);
    guildData.TB.playlist[playlistName].elements--;
    playlistData.splice(targetIdx, 1);

    ExF.saveArrayToFile(targetFile, playlistData);
    ExF.saveGuildData(guildData);
    return true;
}

module.exports = {
    join            : connect_to_user_channel,
    leave           : leave_connected_channel,
    play            : play_track_override,
    stop            : stop_and_reset_track,
    resume          : resume_track,
    pause           : pause_track,
    add             : queue_add_data_from_URL,
    remove          : queue_remove_idx,
    clear           : queue_clear_all_index,
    next            : queue_play_next_override,
    previous        : queue_play_previous_override,
    loopToggle      : loop_toogle,
    loopEdit        : loop_edit,
    playlist_create : playlist_create,
    playlist_delete : playlist_delete,
    playlist_queue  : playlist_append_to_queue,
    playlist_add    : playlist_append_idx,
    playlist_remove : playlist_remove_idx,
};
