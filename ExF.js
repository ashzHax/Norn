"use strict";

// ashz> internal modules
const fs          = require('fs');
const process     = require('process');
const path        = require('path');

// ashz> custom modules
const log_console = require('./Log').log_console;

// ashz> get full date/time format
const get_full_date_time_to_string_log_format = (dateInstance) => {
    return dateInstance.getFullYear().toString().padStart(2, '0') + '/'
         +(dateInstance.getMonth()+1).toString().padStart(2, '0') + '/'
          +dateInstance.getDate().toString().padStart(2, '0')     + '  '
          +dateInstance.getHours().toString().padStart(2, '0')    + ':'
          +dateInstance.getMinutes().toString().padStart(2, '0')  + ':'
          +dateInstance.getSeconds().toString().padStart(2, '0')  + '.'
          +dateInstance.getMilliseconds().toString().padStart(3, '0');
}

// ashz> get full date, simple output format
const get_full_date_to_string_output_format = (dateInstance) => {
    return dateInstance.getFullYear().toString()
    	 +(dateInstance.getMonth()+1).toString().padStart(2, '0')
		  +dateInstance.getDate().toString().padStart(2, '0');
}

// ashz> custom String.replaceAll()
const edit_string_replaceAll_substring = (target_string, target_substring, replacement_substring) => {
    while(target_string.search(target_substring !== -1)) {
        target_string = target_string.replace(target_substring,replacement_substring);
    }
    return target_string;
}

// ashz> leaves debugging log
const get_debug_tracelog = (debug_message=null) => {
    let errorInstance               = new Error();
    let errorFrame                  = errorInstance.stack.split("\n")[2];
    let trace_debug_called_function = errorFrame.split(" ")[5];
    let trace_debug_called_line     = errorFrame.split(":")[2];
    return `${trace_debug_called_function}():${trace_debug_called_line} ${debug_message!==null?`${debug_message}`:``}`;
}

// ashz> for limited string length outputing functions, adds 3 dots for excluded strings
const get_string_cut_withint_limit = (target_string, limit) => {
    let returnString = target_string;
    if ((target_string.length+3) >= limit) {
        returnString = `${target_string.substring(0,target_string.length-((target_string.length+3)-limit))}...`;
    }
    return returnString;
}

// ashz> gets channel name from channel object
const get_channel_name_from_channel_instance = (channelInstance) => {
    return JSON.parse(JSON.stringify(channelInstance.toJSON()))['name'];
}

// ashz> time format from seconds
const get_string_with_time_format_from_second = (total_seconds) => {
    let hour=0;
    let minute=0;

    if(total_seconds >= 60) {
        minute = total_seconds % 60;
        minute = (total_seconds - minute) / 60;
        total_seconds %= 60;            
    }

    if(minute >= 60) {
        hour = minute % 60;
        hour = (minute - hour) / 60;
        minute %= 60;
    }

    if(hour > 0) {
        return `${hour}:${minute}:${total_seconds}`
    }
    else if(minute > 0){
        return `${minute}:${total_seconds}`
    }
    else {
        return `${total_seconds}`;
    }
}

// ashz> save guild data into file
const save_dynamic_guild_data_from_guild_object = (guildData, newData=false) => {
    let finalizedData = {
        GUILD_ID             : guildData.guildID,
        GUILD_NAME           : guildData.guildName,
        TB: {
            VOLUME           : guildData.TB.volume,
            LOOP_SINGLE      : guildData.TB.loopSingle,
            LOOP_QUEUE       : guildData.TB.loopQueue,
            PLAYLIST         : guildData.TB.playlist,
        }
    };
    let writeData = JSON.stringify(finalizedData, null, 4);
    let targetFile = path.join(guildData.configurationDir, guildData.configurationFile);

    if(newData) {
        fs.mkdir(guildData.configurationDir, (error_data) => {
            if(error_data) {
                console.error(error_data);
                log_console('[ERROR] Failed to create new directory for new guild.', guildData);
            }
        });
    }

    fs.writeFile(targetFile, writeData, (error_data) => {
        if(error_data) {
            console.error(error_data);
            log_console('[ERROR] Failed to create new file for new guild.', guildData);
        }
    });
}

// ashz> creates a new file
const create_target_file = (file_path, data) => {
    fs.writeFileSync(file_path, data, 'utf8', (error_data) => {
        if(error_data) {
            console.error(error_data);
            log_console('[ERROR] Failed to write file.', guildData);
        }
    });
}

// ashz> deleteds a name from file system (simply, deletes a file)
const remove_target_file = (target_file_path) => {
    try {
        fs.unlinkSync(target_file_path);
    } catch (error_data) {
        console.error(error_data);
    }
}

// ashz> gets JSON formated array to normal array data
const get_array_from_file = (target_file_path) => {
    let file_data;
    
    try {
        file_data = fs.readFileSync(target_file_path, 'utf8');
    } catch (error_data) {
        console.error(error_data);
    }
    
    if(file_data==null) return null;
    return JSON.parse(file_data);
}

// ashz> saves array data into a file after converting said array to JSON format
const save_array_to_file = (target_file_path, array_data) => {
    fs.writeFileSync(target_file_path, JSON.stringify(array_data, null, 4), (error_data) => {
        if(error_data) {
            console.error(error_data);
            log_console('[ERROR] Saving array data failed.', null);
        }
    });
}

module.exports = {
    // ashz> Error Values For Process
    NORN_FILE_NOT_FOUND                : 1900,
    GUILD_CONFIG_DIR_FAILED_TO_READ    : 1901,
    GUILD_SETTING_FILE_NOT_FOUND       : 1902,
    GUILD_CONFIG_DIR_CREATE_FAIL       : 1903,
    GUILD_SETTING_FILE_FAILED_TO_WRITE : 1904,
    
    // ashz> Color Values
    html_red          : '#FF0000',
    html_white        : '#000000',
    html_spring_green : '#00FF9E',
    html_blue         : '#0032FF',
    html_green        : '#00FF08',
    html_sky          : '#00D1FF',
    html_warm         : '#F1C40F',
    html_yellow       : '#F3FF00',
    html_orange       : '#FFAE00', 
    
    /*
    // ashz> Log Values
    TYPE_LOG     : 'LOG',
    TYPE_ALERT   : 'ALT',
    TYPE_EVENT   : 'EVT',
    TYPE_COMMAND : 'CMD',
    TYPE_ERROR   : 'ERR',
    TYPE_MESSAGE : 'MSG',
    TYPE_DEBUG   : 'DBG',
    */

    // ashz> Functions
    getStrDateTime   : get_full_date_time_to_string_log_format,
    getStrDate       : get_full_date_to_string_output_format,
    replaceAll       : edit_string_replaceAll_substring,
    traceLog         : get_debug_tracelog,
    getLimitedString : get_string_cut_withint_limit,
    getChannelName   : get_channel_name_from_channel_instance,
    getSecFormat     : get_string_with_time_format_from_second,
    saveGuildData    : save_dynamic_guild_data_from_guild_object,
    createFile       : create_target_file,
    removeFile       : remove_target_file,
    getArrayFromFile : get_array_from_file,
    saveArrayToFile  : save_array_to_file,
};
