"use strict";

const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const { pid } = require("process");
const fs          = require('fs');
const Process     = require('process');
const Path        = require('path');

// fixed error values
module.exports.NORN_SETTING_FILE_NOT_FOUND     = 1900;
module.exports.GUILD_CONFIG_DIR_FAILED_TO_READ = 1901;
module.exports.GUILD_SETTING_FILE_NOT_FOUND    = 1902;
module.exports.GUILD_CONFIG_DIR_CREATE_FAIL    = 1903;
module.exports.GUILD_WRITE_FAIL                = 1904;
module.exports.FILE_NOT_FOUND                  = 1905;
module.exports.GUILD_MKDIR_FAIL                = 1906;

// color values
module.exports.html_red          = '#FF0000';
module.exports.html_white        = '#000000';
module.exports.html_spring_green = '#00FF9E';
module.exports.html_blue         = '#0032FF';
module.exports.html_green        = '#00FF08';
module.exports.html_sky          = '#00D1FF';
module.exports.html_warm         = '#F1C40F';
module.exports.html_yellow       = '#F3FF00';
module.exports.html_orange       = '#FFAE00'; 

// log values
module.exports.TYPE_LOG =     'LOG';
module.exports.TYPE_ALERT =   'ALT';
module.exports.TYPE_EVENT =   'EVT';
module.exports.TYPE_COMMAND = 'CMD';
module.exports.TYPE_ERROR =   'ERR';
module.exports.TYPE_MESSAGE = 'MSG';
module.exports.TYPE_DEBUG =   'DBG';

// get personal date format
function get_date_string_format(DateInstance)
{
    return DateInstance.getFullYear().toString().padStart(2, '0')+'/'
          +(DateInstance.getMonth()+1).toString().padStart(2, '0')+'/'
          +DateInstance.getDate().toString().padStart(2, '0')+' '
          +DateInstance.getHours().toString().padStart(2, '0')+':'
          +DateInstance.getMinutes().toString().padStart(2, '0')+':'
          +DateInstance.getSeconds().toString().padStart(2, '0')+'.'
          +DateInstance.getMilliseconds().toString().padStart(3, '0');
}
module.exports.getStringDate = get_date_string_format;

function get_current_day_simple_string_format(DateInstance)
{
    return DateInstance.getFullYear().toString()
        +(DateInstance.getMonth()+1).toString().padStart(2, '0')
        +DateInstance.getDate().toString().padStart(2, '0');
}
module.exports.getDay = get_current_day_simple_string_format;

// replace all character instance of parameter 0 with parameter 1
function string_replace_all(target_string,target_character,replacement_character)
{
    while(target_string.search(target_character) !== -1)
    {
        target_string = target_string.replace(target_character,replacement_character);
    }

    return target_string;
}
module.exports.replaceAll = string_replace_all;

function trace_debug(debug_message=null)
{
    const errorInstance               = new Error();
    let errorFrame                    = errorInstance.stack.split("\n")[2];
    const trace_debug_called_function = errorFrame.split(" ")[5];
    const trace_debug_called_line     = errorFrame.split(":")[2];

    return `${trace_debug_called_function}():${trace_debug_called_line}${ debug_message!==null?`:\"${debug_message}\"`:"" }`;
}
module.exports.traceDebug = trace_debug;

function string_cut(target_string,limit)
{
    var returnString = target_string;
    if ((target_string.length+3) >= limit) 
    {
        returnString = `${target_string.substring(0,limit-1)}...`;
    }

    return returnString;
}
module.exports.stringCut = string_cut;

function get_channel_name_with_channel_instance(channel)
{
    return JSON.parse(JSON.stringify(channel.toJSON()))['name'];
}
module.exports.getChannelName = get_channel_name_with_channel_instance;

function get_string_with_format_from_second(second)
{
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

module.exports.getSecondFormat = get_string_with_format_from_second;

function saveGuildData(guildData,newData=false)
{
    const finalizedData = {
        GUILD_ID             : guildData.STATIC.guildID,
        GUILD_NAME           : guildData.STATIC.guildName,
        ADMINISTRATOR_LIST   : guildData.STATIC.administratorList,
        TB: {
            VOLUME           : guildData.TB.STATIC.volume,
            LOOP_SINGLE      : guildData.TB.STATIC.loopSingle,
            LOOP_QUEUE       : guildData.TB.STATIC.loopQueue,
            PLAYLIST         : guildData.TB.PLAYLIST,
        }
    };
    const writeData = JSON.stringify(finalizedData,null,4);
    const targetFile = Path.join(guildData.DYNAMIC.configurationDir, guildData.DYNAMIC.configurationFile);

    if(newData) {
        fs.mkdir(guildData.DYNAMIC.configurationDir, (errorData) => {
            if(errorData) {
                console.log(errorData);
                Process.exit(ExF.GUILD_MKDIR_FAIL);
            }
        });
    }

    fs.writeFile(targetFile, writeData, (errorData) =>
    {
        if(errorData) {
            console.log(errorData);
            Process.exit(ExF.CONFIG_GUILD_WRITE_FAIL);
        }
    });
}
module.exports.saveGuildData = saveGuildData;

function createNewFile(path,data)
{
    fs.writeFileSync(path,data,'utf8',(error) => {
        if(error) {
            console.error(error);
        }
    });
}
module.exports.createNewFile = createNewFile;

function removeFile(targetPath)
{
    fs.unlinkSync(targetPath);
}
module.exports.removeFile = removeFile;

function getArrayFromFile(targetPath)
{
    let data = fs.readFileSync(targetPath,'utf8');
    console.log(data);
    if(data===null) return null;
    return JSON.parse(data);
}
module.exports.getArrayFromFile = getArrayFromFile;

function saveArrayToFile(targetPath,arrayData)
{
    fs.writeFileSync(targetPath,JSON.stringify(arrayData,null,4),(err)=>{
        if(err){
            console.log(err);
        }
    });
}
module.exports.saveArrayToFile = saveArrayToFile;