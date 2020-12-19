"use strict";

// external module
const Discord    = require('discord.js');

// internal module
const FileSystem = require('fs');
const Path       = require('path');

// custom module
const Function   =  require('./Function.js');

function log_console(message=null,guildData=null)
{
    if(message==null) {
        console.log('Invalid \"log_console()\" function usage!');
    }
    else {
        if(guildData!=null) {
            let dataPath = Path.join(guildData.DYNAMIC.logPath,`${Function.getDay(new Date())}.log`);
            FileSystem.appendFile(dataPath,`[${Function.getStringDate(new Date())}]${(!message.startsWith('[')?' ':'')}${message}\n`,'utf8',()=>{});
        }
        console.log(`[${Function.getStringDate(new Date())}]${(!message.startsWith('[')?' ':'')}${message}`);
    }
}
module.exports.log_console = log_console;

// event data sent only to logging channel and console
function log_event(logType,eventData,guildData=null)
{
    var embdLog = new Discord.MessageEmbed();
    var consoleLogText;

    if(guildData != null) {
        consoleLogText = `[${guildData.STATIC.guildID}][event][${logType}]`;
    }
    else {
        consoleLogText = `[guild_null][event][${logType}]`;
    }

    switch(logType)
    {
        case 'BOT_READY':
        {
            embdLog = null;
            consoleLogText = consoleLogText.concat(' (*high animie sqeak*) I am here to serve!');
            break;
        }

//////////////////////////////////////////////////
// Event Handler: Channel
//////////////////////////////////////////////////
        case 'CHANNEL_CREATE':
        {
            let channelType = (eventData.type == 'voice') ? 'Voice Channel' : 'Text Channel';
            let channelName = Function.getChannelName(eventData);

            embdLog = null;
            consoleLogText = consoleLogText.concat(` {id:\"${eventData.id}\",name:\"${channelName}\",type:\"${channelType}\"}`);
            break;
        }
        case 'CHANNEL_DELETE':
        {
            let channelType = (eventData.type == 'voice') ? 'Voice Channel' : 'Text Channel';
            let channelName = Function.getChannelName(eventData);

            embdLog = null;
            consoleLogText = consoleLogText.concat(` {id:\"${eventData.id}\",name:\"${channelName}\",type:\"${channelType}\"}`);
            break;
        }
        case 'CHANNEL_PINS_UPDATE':
        {
            let channelName = Function.getChannelName(eventData[0]);
            let strTimeStamp = Function.getStringDate(eventData[1]);

            embdLog = null;
            consoleLogText = consoleLogText.concat(` {id:\"${eventData[0].id},name:\"${channelName}\",timestamp:\"${strTimeStamp}\"}`);
            break;
        }
        case 'CHANNEL_UPDATE':
        {
            let previousChannelName = Function.getChannelName(eventData[0]);
            let updatedChannelName  = Function.getChannelName(eventData[1]);
            var isChange = false;

            consoleLogText = consoleLogText.concat(' ');

            if(previousChannelName != updatedChannelName) 
            {
                consoleLogText = consoleLogText.concat(`{name:(\"${previousChannelName}\"->\"${updatedChannelName}\")`);
                isChange = true;
            }

            if(eventData[0].topic != eventData[1].topic)
            {
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                } else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`topic:(\"${eventData[0].topic}\"->\"${eventData[1].topic}\")`);
            }

            if(eventData[0].rateLimitPerUser != eventData[1].rateLimitPerUser)
            {
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                } else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`rateLimit:(\"${eventData[0].rateLimitPerUser}\"->\"${eventData[1].rateLimitPerUser}\")`);
            }

            if(eventData[0].nsfw != eventData[1].nsfw)
            {
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                } else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`nsfw:(\"${eventData[0].nsfw}\"->\"${eventData[1].nsfw}\")`);
            }

            consoleLogText = consoleLogText.concat('}');
            embdLog = null;
            break;
        }

//////////////////////////////////////////////////
// Event Handler: Message
//////////////////////////////////////////////////
        case 'MESSAGE':
        {
            // if event occuring channel is the bot channel, does not log
            if(eventData.author.id == guildData.DYNAMIC.Norn.user.id) return;
            
            // sometimes, contents could be empty
            if(eventData.content == '') return;
            
            // do not log commands
            if(eventData.content.startsWith('/')) return;
            
            embdLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] {message:\"${Function.replaceAll(eventData.content,'\n','\\n')}\",id:\"${eventData.id}\",channel_name:\"${eventData.channel.name}\"}`); 
            break;               
        }
        case 'MESSAGE_DELETE':
        {
            // command handling is a repeatitive event, not logging event
            if(eventData.content.startsWith('/')) return;
            
            // all delete by Norn will be ignored
            if(eventData.author.tag == guildData.DYNAMIC.Norn.user.tag) return;
            
            embdLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData.member.user.tag}] {message:\"${Function.replaceAll(eventData.content,'\n','\\n')}\",id:\"${eventData.id}\",channel_name:\"${eventData.channel.name}\"}`);
            break;
        }
        case 'MESSAGE_DELETE_BULK':
        {
            const channelName = eventData.first().channel.name;

            embdLog = null;
            consoleLogText = consoleLogText.concat(` {channel_name:\"${channelName}\"}`);s
            break;
        }
        case 'MESSAGE_UPDATE':
        {
            // all update caused by Norn will be ignored
            if(eventData[1].author.tag == guildData.DYNAMIC.Norn.user.tag) return;
            if(eventData[0].content == eventData[1].content) return;

            embdLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData[1].author.tag}] {message_update:(\"${eventData[0].content}\"->\"${eventData[1].content}\")}`)
            break;
        }
        case 'MESSAGE_REACTION_ADD':
        {
            embdLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData[1].tag}] {reaction:\"${eventData[0].emoji}\",message_id:\"${eventData[0].message.id}\",channel_name:\"${eventData[0].message.channel.name}\",message:\"${eventData[0].message.content}\"}`);
            break;
        }
        case 'MESSAGE_REACTION_DELETE':
        {
            embdLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData[1].tag}] {reaction:\"${eventData[0].emoji}\",message_id:\"${eventData[0].message.id}\",channel_name:\"${eventData[0].message.channel.name}\",message:\"${eventData[0].message.content}\"}`);
            break;
        }
        case 'MESSAGE_REACTION_REMOVE_ALL':
        {
            let emojiCache = '';
            eventData.reactions.cache.forEach(element =>
            {
                emojiCache.append(element.emoji);
            });

            embdLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] {reaction:\"${emojiCache}\",message_id:\"${eventData.id}\",channel_name:\"${eventData.channel.name}\",message:\"${eventData.content}\"}`);
            break;
        }
        case 'TYPING_START':
        {
            embdLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData[1].tag}] typing event detected! (Honestly don't know why I left this event...)`);
            break;
        }

//////////////////////////////////////////////////
// Event Handler: Command
//////////////////////////////////////////////////
        case 'COMMAND_NO_PERMISSION':
        {
            embdLog
                .setColor(Function.html_red)
                .setAuthor(eventData.author.tag)
                .setTitle('No Permission')
                .setDescription('[!.!] You have no permission to issue commands')
                .addField('Received Command',`\"${eventData.content}\"`,false)
                .setTimestamp();

            eventData.channel.send(embdLog);
            embdLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] {command:\"${eventData.content}\"}`);  
            break;
        }
        case 'COMMAND_UNKNOWN':
        {
            embdLog
                .setColor(Function.html_red)
                .setAuthor(eventData.author.tag)
                .setTitle('Unknown Command')
                .setDescription('[?.?] Unknown command, try \"/help\" for a list of commands')
                .addField('Received Command',`\"${eventData.content}\"`,false)
                .setTimestamp();
            
            eventData.channel.send(embdLog);
            embdLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] {command:\"${eventData.content}\"}`);  
            break;
        }
        case 'COMMAND_DATA_NULL':
        {
            embdLog
                .setColor(Function.html_red)
                .setAuthor(eventData.author.tag)
                .setTitle('Null Data Detected')
                .setDescription('[X.X] Critical error, something broke inside...')
                .addField('Received Command',`\"${eventData.content}\"`,false)
                .setTimestamp();
            
            eventData.channel.send(embdLog);
            embdLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] {command:\"${eventData.content}\"}`);  
            break;  
        }
        default:
        {
            embdLog = null;
            consoleLogText = consoleLogText.concat(' {error:\"undefined log type\"}');
        }
    }

    if(embdLog != null && guildData != null) {
        guildData.DYNAMIC.systemChannel.send(embdLog);
    }
    if(consoleLogText == null) {
        console.log(Function.traceDebug('log event error, guildData is null'));
    } else {
        log_console(consoleLogText,guildData);
    }
}
module.exports.log_event = log_event;

function log_command(logType,message,guildData,extraData=null) 
{
    const commandIssuer = message.author.tag;
    var emLog = new Discord.MessageEmbed();
    var consoleLogText;

    if(guildData != null) {
        consoleLogText = `[${guildData.STATIC.guildID}][command][${logType}][${message.author.tag}]`;
    } else {
        consoleLogText = `[guild_null][command][${logType}][${message.author.tag}]`;
    }
    
    switch(logType) 
    {
        //////////////////////////////////////////////////
        // Event Handler: help
        //////////////////////////////////////////////////
        case 'HELP_SUCCESS':
        {
            let logReason = 'Shown user the help list.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'HELP_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/help',         true)
                .addField('Received', message.content, true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////
        // Event Handler: join
        //////////////////////////////////////////////////
        case 'JOIN_TEXT_CHL_NULL':
        {
            let logReason = 'Text channel is Null inside message object.';
            let logData = 
            {
                error            : "true",
                critical         : "true",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_red)
                .setAuthor(commandIssuer)
                .setTitle('Critical')
                .setDescription(logReason)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'JOIN_VC_NULL':
        {
            let logReason = 'Voice channel is Null inside message object.';
            let logData = 
            {
                error            : "true",
                critical         : "maybe",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('No Voice Channel Found')
                .setDescription('You are not inside a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'JOIN_NO_PERM_CONNECT':
        {
            let logReason = 'Bot has no permission to join the channel.';
            let logData = 
            {
                error            : "true",
                critical         : "true",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_red)
                .setAuthor(commandIssuer)
                .setTitle('Critical')
                .setDescription(logReason)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'JOIN_NO_PERM_SPEAK':
        {
            let logReason = 'Bot has no permission to speak inside voice channel.';
            let logData = 
            {
                error            : "true",
                critical         : "true",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_red)
                .setAuthor(commandIssuer)
                .setTitle('Critical')
                .setDescription(logReason)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'JOIN_ALREADY_CONNECTED':
        {
            let logReason = 'Already connected to a voice channel.';
            let logData = 
            {
                error            : "true",
                critical         : "maybe",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Already Connected')
                .setDescription(logReason)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'JOIN_CONNECTION_FAILED':
        {
            let logReason = 'Error occured while trying to connect to voice channel.';
            let logData = 
            {
                error            : "true",
                critical         : "true",
                received_command : message.content,
                reason           : logReason,
                data             : extraData,
            };

            emLog
                .setColor(Function.html_red)
                .setAuthor(commandIssuer)
                .setTitle('Critical')
                .setDescription(logReason)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'JOIN_SUCCESS':
        {
            let logReason = 'Connected to voice channel.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_green)
                .setAuthor(commandIssuer)
                .setTitle('Joined Voice Channel')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'JOIN_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/join',         true)
                .addField('Received', message.content, true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////
        // Event Handler: join
        //////////////////////////////////////////////////
        case 'LEAVE_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/leave',        true)
                .addField('Received', message.content, true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'LEAVE_NO_CONNECTION':
        {
            let logReason = 'No connection instance found.';
            let logData = 
            {
                error            : "true",
                critical         : "maybe",
                received_command : message.content,
                reason           : logReason,
            };
    
            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Not Inside Voice Channel')
                .setDescription('You need to be inside a voice channel first.')
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'LEAVE_SUCCESS':
        {
            let logReason = 'Left voice channel.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };
    
            emLog
                .setColor(Function.html_orange)
                .setAuthor(commandIssuer)
                .setTitle('Left Voice Channel')
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////
        // Event Handler: play
        //////////////////////////////////////////////////
        case 'PLAY_UNDER_REQ_ARG_CNT':
        {
            let logReason = 'Received not enough arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Require More Arguments')
                .addField('Usage',    '/play [URL] [Volume]', true)
                .addField('Received', message.content,        true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PLAY_INVALID_ARG_TYPE':
        {
            let logReason = 'Received argument type is invalid.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Invalid Argument Type')
                .addField('Usage',    '/play [URL] [Volume]', true)
                .addField('Received', message.content,        true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PLAY_SUCCESS':
        {
            let logReason = 'Playing track with received information.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };
    
            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PLAY_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/play [URL] [Volume]', true)
                .addField('Received', message.content,        true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////
        // Event Handler: start
        //////////////////////////////////////////////////
        case 'START_NOT_CONNECTED_TO_VC':
        {
            let logReason = 'Found no voice channel.';
            let logData = 
            {
                error            : "true",
                critical         : "maybe",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Not Connected')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'START_ALREADY_PLAYING':
        {
            let logReason = 'Bot is already playing a track.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Already Playing')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'START_SUCCESS':
        {
            let logReason = 'Starting a stopped track.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };
    
            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'START_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/start',        true)
                .addField('Received', message.content, true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////
        // Event Handler: stop
        //////////////////////////////////////////////////
        case 'STOP_NOT_PLAYING_TRACK':
        {
            let logReason = 'Nothing to stop.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Not Running Anything')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'STOP_NO_VC':
        {
            let logReason = 'No voice channel found.';
            let logData = 
            {
                error            : "true",
                critical         : "true",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Critical')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'STOP_SUCCESS':
        {
            let logReason = 'Stopped running track.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };
    
            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'STOP_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/stop',         true)
                .addField('Received', message.content, true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////  
        // Event Handler: resume
        //////////////////////////////////////////////////
        case 'RESUME_ALREADY_RUNNING':
        {
            let logReason = 'Already running, cannot resume.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Already Running')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'RESUME_NOT_PAUSED':
        {
            let logReason = 'Not paused, cannot resume.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Not Paused')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'RESUME_NO_VC':
        {
            let logReason = 'No voice channel found.';
            let logData = 
            {
                error            : "true",
                critical         : "maybe",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Not Connected To A Voice Channel')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'RESUME_SUCCESS':
        {
            let logReason = 'Resumed track.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };
    
            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'RESUME_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/resume',       true)
                .addField('Received', message.content, true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////  
        // Event Handler: pause
        //////////////////////////////////////////////////
        case 'PAUSE_NOT_RUNNING':
        {
            let logReason = 'Already stopped, cannot pause.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Already Stopped')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PAUSE_ALREADY_PAUSED':
        {
            let logReason = 'Already paused.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Already Paused')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PAUSE_NO_VC':
        {
            let logReason = 'No voice channel found.';
            let logData = 
            {
                error            : "true",
                critical         : "maybe",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Not Connected To A Voice Channel')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PAUSE_SUCCESS':
        {
            let logReason = 'Paused track.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };
    
            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PAUSE_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/pause',        true)
                .addField('Received', message.content, true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////  
        // Event Handler: next
        //////////////////////////////////////////////////
        case 'NEXT_QUEUE_EMPTY':
        {
            let logReason = 'Queue is empty, nothing to play next.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Queue Empty')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'NEXT_INVALID_ARG_TYPE':
        {
            let logReason = 'Invalid argument type received, expecting a integer.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Invalid Argument Type')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'NEXT_INVALID_ARG_VAL':
        {
            let logReason = 'Invalid argument value received, expecting a number greater than 1';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Invalid Argument Type')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'NEXT_SUCCESS':
        {
            let logReason = 'Playing next track.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };
    
            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'NEXT_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/next [Skip Count]', true)
                .addField('Received', message.content,      true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////  
        // Event Handler: previous
        //////////////////////////////////////////////////
        case 'PREV_QUEUE_EMPTY':
        {
            let logReason = 'Queue is empty, nothing to play previous.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Queue Empty')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PREV_INVALID_ARG_TYPE':
        {
            let logReason = 'Invalid argument type received, expecting a integer.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Invalid Argument Type')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PREV_INVALID_ARG_VAL':
        {
            let logReason = 'Invalid argument value received, expecting a number greater than 1';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Invalid Argument Type')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PREV_SUCCESS':
        {
            let logReason = 'Playing previous track.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };
    
            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'PREV_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/previous [Skip Count]', true)
                .addField('Received', message.content,      true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////  
        // Event Handler: list
        //////////////////////////////////////////////////
        case 'LIST_QUEUE_EMPTY':
        {
            let logReason = 'Queue is empty.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Queue Empty')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'LIST_SUCCESS':
        {
            let logReason = 'Showing queue list.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };
    
            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'LIST_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/list',         true)
                .addField('Received', message.content, true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////  
        // Event Handler: add
        //////////////////////////////////////////////////
        case 'ADD_UNDER_REQ_ARG_CNT':
        {
            let logReason = 'Received not enough arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Require More Arguments')
                .addField('Usage',    '/add [URL] [Volume]', true)
                .addField('Received', message.content,       true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'ADD_INVALID_ARG_TYPE':
        {
            let logReason = 'Received argument type is invalid.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Invalid Argument Type')
                .addField('Usage',    '/add [URL] [Volume]', true)
                .addField('Received', message.content,        true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'ADD_SUCCESS':
        {
            let logReason = 'Added track to queue.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'ADD_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/add [URL] [Volume]', true)
                .addField('Received', message.content,       true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////  
        // Event Handler: remove
        //////////////////////////////////////////////////
        case 'REMOVE_UNDER_REQ_ARG_CNT':
        {
            let logReason = 'Received not enough arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Require More Arguments')
                .addField('Usage',    '/remove [Index]', true)
                .addField('Received', message.content,   true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'REMOVE_INVALID_ARG_TYPE':
        {
            let logReason = 'Received argument type is invalid.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Invalid Argument Type')
                .addField('Usage',    '/remove [Index]', true)
                .addField('Received', message.content,   true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'REMOVE_INVALID_ARG_VAL':
        {
            let maxLength = guildData.TB.DYNAMIC.queue.length-1;
            let logReason = `Invalid argument value received (${maxLength==0?'0':`0~${maxLength}`})`;
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Invalid Argument Type')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'REMOVE_PLAYING_TARGET_IDX':
        {
            let logReason = 'Cannot remove current track from queue.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Cannot Remove Current Track')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'REMOVE_SUCCESS':
        {
            let logReason = 'Removed track from queue.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'REMOVE_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/remove [Index]', true)
                .addField('Received', message.content,   true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////  
        // Event Handler: clear
        //////////////////////////////////////////////////
        case 'CLEAR_QUEUE_EMPTY':
        {
            let logReason = 'Queue is empty, nothing to clear out.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Queue Empty')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'CLEAR_PLAYING_TARGET_IDX':
        {
            let logReason = 'Current track is the only track in queue.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Cannot Remove Current Track')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'CLEAR_SUCCESS':
        {
            let logReason = 'Removed all track from queue.';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'CLEAR_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/clear',        true)
                .addField('Received', message.content, true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        //////////////////////////////////////////////////  
        // Event Handler: loop
        //////////////////////////////////////////////////
        case 'LOOP_UNDER_REQ_ARG_CNT':
        {
            let logReason = 'Received not enough arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Require More Arguments')
                .addField('Usage',    '/loop [single/queue] [on/off]', true)
                .addField('Received', message.content,   true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'LOOP_INVALID_ARG_VAL_1':
        {
            let logReason = `Invalid argument value received. ( Expecting: [ single | queue ] )`;
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Invalid Argument Value')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'LOOP_INVALID_ARG_VAL_2':
        {
            let logReason = `Invalid argument value received. ( Expecting: [ on | off ] )`;
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Invalid Argument Value')
                .setDescription(logReason)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'LOOP_SUCCESS':
        {
            let logReason = 'Edited Loop';
            let logData = 
            {
                error            : "false",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog = null;
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'LOOP_OVER_MAX_ARG_CNT':
        {
            let logReason = 'Received too many arguments.';
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(Function.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/loop [single/queue] [on/off]',        true)
                .addField('Received', message.content, true)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }

        default:
        {
            emLog=null;
            consoleLogText = consoleLogText.concat(' undefined log type');
        }
    }

    if(guildData!=null && emLog!=null) {
        message.channel.send(emLog);
    }
    if(consoleLogText == null) {
        console.log(Function.traceDebug('log event error, guildData is null'));
    } else {
        log_console(consoleLogText,guildData);
    }
}
module.exports.log_command = log_command;


function log_TB(logType,guildData,extraData=null)
{
    var devLog = new Discord.MessageEmbed();
    var usrLog = new Discord.MessageEmbed();
    var consoleLogText;

    if(guildData != null) {
        consoleLogText = `[${guildData.STATIC.guildID}][TB][${logType}]`;
    }
    else {
        consoleLogText = `[guild_null][TB][${logType}]`;
    }

    switch(logType)
    {
        case 'PLAY_STREAM_DISCONNECTION_ERROR':
        {
            devLog
                .setColor(Function.html_red)
                .setTitle(logType)
                .setDescription('Stream disconnection error has occured, restarting current track')
                .setTimestamp();
            usrLog
                .setColor(Function.html_red)
                .setTitle('Error trying to play track')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` disconnected from data stream`);
            break;
        }
        case 'PLAY_SUCCESS':
        {
            const idx = guildData.TB.DYNAMIC.index;
            const trackData = guildData.TB.DYNAMIC.queue[idx];

            devLog=null;
            //     .setColor(Function.html_green)
            //     .setTitle(logType)
            //     .setDescription(`playing:{${JSON.stringify(trackData)}`)
            //     .setTimestamp();
            usrLog
                .setColor(Function.html_spring_green)
                .setTitle(`\"${Function.stringCut(trackData.title,43)}\"`)
                // .setDescription('[~.~] Playing track, so lets duck, truck, and smash?')
                .addFields(
                    { name: 'Index',  value: idx,                                   inline: true },
                    { name: 'Length', value: Function.getSecondFormat(trackData.length), inline: true },
                    { name: 'Volume', value: trackData.volume,                      inline: true },
                    { name: 'URL',    value: trackData.video_url,                   inline: false },
                )  
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` playing:{\"idx\":${idx},${JSON.stringify(trackData)}}`);
            break;
        }
        case 'QUEUE_ADD_GET_INFO_FAILED':
        {
            console.log('failed getting queue data ('+extraData+')');
            break;
        }
        case 'QUEUE_ADD_DATA_NULL':
        {
            console.log('queue data search result returned null ('+extraData+')');
            break;
        }
        case 'SKIP_QUEUE_EMPTY':
        {
            usrLog
                .setColor(Function.html_red)
                .setTitle('Queue Empty')
                .setDescription('Nothing to skip.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` track queue is empty, nothing to skip`);
            break;
        }
        default:
        {
            consoleLogText = consoleLogText.concat(' unknown log type');
            devLog = null;
            usrLog = null;
        }
    }
 
    log_console(consoleLogText,guildData);

    if( (guildData!=null) && (devLog!=null) ) {
        guildData.DYNAMIC.systemChannel.send(devLog);
    }
    if( (guildData!=null) && (usrLog!=null) ) {
        guildData.TB.DYNAMIC.textChannel.send(usrLog);
    }
}
module.exports.log_TB = log_TB;
