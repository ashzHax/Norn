"use strict";

const fs      = require('fs');
const process = require('process');

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
    while(target_string.search(target_substring !== -1) {
        target_string = target_string.replace(target_substring,replacement_substring);
    }
    return target_string;
}

const print_debug_tracelog = (debug_message=null) => {
    let errorInstance               = new Error();
    let errorFrame                  = errorInstance.stack.split("\n")[2];
    let trace_debug_called_function = errorFrame.split(" ")[5];
    let trace_debug_called_line     = errorFrame.split(":")[2];
    return `${trace_debug_called_function}():${trace_debug_called_line} ${(debug_message!==null)?\":${debug_message}\":""}`;
}

//////////////////////////////////////////// ^ CLEAN
const string_cut = (target_string, limit) => {
    var returnString = target_string;
    if ((target_string.length+3) >= limit) {
        returnString = `${target_string.substring(0,limit-1)}...`;
    }

    return returnString;
}

const get_channel_name_with_channel_instance = (channel) => {
    return JSON.parse(JSON.stringify(channel.toJSON()))['name'];
}

const get_string_with_format_from_second = (second) => {
    var hour=0;
    var minute=0;

    if(second >= 60) {
        minute = second % 60;
        minute = (second - minute) / 60;
        second %= 60;            
    }

    if(minute >= 60) {
        hour = minute % 60;
        hour = (minute - hour) / 60;
        minute %= 60;
    }

    if(hour > 0) {
        return `${hour}:${minute}:${second}`
    }
    else if(minute > 0){
        return `${minute}:${second}`
    }
    else {
        return `${second}`;
    }
}

const saveGuildData = (guildData,newData=false) => {
    const finalizedData = {
        GUILD_ID             : guildData.guildID,
        GUILD_NAME           : guildData.guildName,
        ADMINISTRATOR_LIST   : guildData.administratorList,
        TB: {
            VOLUME           : guildData.TB.volume,
            LOOP_SINGLE      : guildData.TB.loopSingle,
            LOOP_QUEUE       : guildData.TB.loopQueue,
            PLAYLIST         : guildData.TB.PLAYLIST,
        }
    };
    const writeData = JSON.stringify(finalizedData,null,4);
    const targetFile = require('path').join(guildData.configurationDir, guildData.configurationFile);

    if(newData) {
        fs.mkdir(guildData.configurationDir, (errorData) => {
            if(errorData) {
                console.log(errorData);
                process.exit(ExF.GUILD_MKDIR_FAIL);
            }
        });
    }

    fs.writeFile(targetFile, writeData, (errorData) =>
    {
        if(errorData) {
            console.log(errorData);
            process.exit(ExF.CONFIG_GUILD_WRITE_FAIL);
        }
    });
}

const createNewFile = (fpath,data) => {
    fs.writeFileSync(fpath,data,'utf8',(error) => {
        if(error) {
            console.error(error);
        }
    });
}

const removeFile = (targetPath) => {
    fs.unlinkSync(targetPath);
}

const getArrayFromFile = (targetPath) => {
    let data = fs.readFileSync(targetPath,'utf8');
    console.log(data);
    if(data===null) return null;
    return JSON.parse(data);
}

const saveArrayToFile = (targetPath,arrayData) => {
    fs.writeFileSync(targetPath,JSON.stringify(arrayData,null,4),(err)=>{
        if(err){
            console.log(err);
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
    getStringDate : get_full_date_time_to_string_log_format,
    getDay        : get_full_date_to_string_output_format,
    replaceAll    : edit_string_replaceAll_substring,
    traceDebug    : print_debug_tracelog,
    stringCut : string_cut,
    getChannelName : get_channel_name_with_channel_instance,
    getSecondFormat : get_string_with_format_from_second,
    saveGuildData : saveGuildData,
    createNewFile : createNewFile,
    removeFile : removeFile,
    getArrayFromFile : getArrayFromFile,
    saveArrayToFile : saveArrayToFile,
};
