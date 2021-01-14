"use strict";

// external module
const Discord = require('discord.js');

// custom module
const ExF     = require('./ExF.js');

//////////////////////////////////////////////////
// Logging of events
//////////////////////////////////////////////////

const norn_event_handle_log = (logType, eventData=null, guildData=null) => {

    let eLog = new Discord.MessageEmbed();
    let consoleLogText;

    if(guildData !== null) {
        consoleLogText = `[${guildData.guildID}][event][${logType}]`;
    } else {
        consoleLogText = `[guild_null][event][${logType}]`;
    }

    switch(logType) {
        case 'BOT_READY': {
            eLog = null;
            consoleLogText = consoleLogText.concat(' Here to serve! (And to steal API bandwidth usage)');
            break;
        }
        case 'CHANNEL_CREATE': {
            let channelType = (eventData.type==='voice') ? 'voice_channel':'text_channel';

            eLog = null;
            consoleLogText = consoleLogText.concat(` {id:\"${eventData.id}\",name:\"${ExF.getChannelName(eventData)}\",type:\"${channelType}\"}`);
            break;
        }
        case 'CHANNEL_DELETE': {
            let channelType = (eventData.type==='voice') ? 'voice_channel':'text_channel';

            eLog = null;
            consoleLogText = consoleLogText.concat(` {id:\"${eventData.id}\",name:\"${ExF.getChannelName(eventData)}\",type:\"${channelType}\"}`);
            break;
        }
        case 'CHANNEL_PINS_UPDATE': {
            eLog = null;
            consoleLogText = consoleLogText.concat(` {id:\"${eventData[0].id},name:\"${ExF.getChannelName(eventData[0])}\",timestamp:\"${ExF.getStrDateTime(eventData[1])}\"}`);
            break;
        }
        case 'CHANNEL_UPDATE': {
            let previousChannelName = ExF.getChannelName(eventData[0]);
            let updatedChannelName  = ExF.getChannelName(eventData[1]);
            let isChange            = false;

            consoleLogText = consoleLogText.concat(' ');

            if(previousChannelName!==updatedChannelName) {
                consoleLogText = consoleLogText.concat(`{name:(\"${previousChannelName}\"->\"${updatedChannelName}\")`);
                isChange       = true;
            }

            if(eventData[0].topic!==eventData[1].topic) {
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                } else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`topic:(\"${eventData[0].topic}\"->\"${eventData[1].topic}\")`);
            }

            if(eventData[0].rateLimitPerUser!==eventData[1].rateLimitPerUser) {
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                } else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`rateLimit:(\"${eventData[0].rateLimitPerUser}\"->\"${eventData[1].rateLimitPerUser}\")`);
            }

            if(eventData[0].nsfw != eventData[1].nsfw) {
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                } else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`nsfw:(\"${eventData[0].nsfw}\"->\"${eventData[1].nsfw}\")`);
            }

            eLog = null;
            consoleLogText = consoleLogText.concat('}');
            break;
        }
        case 'MESSAGE': {
            // ashz> if event occuring channel is the bot channel, does not log
            if(eventData.author.id == guildData.Norn.user.id) return;
            
            // ashz> sometimes, contents could be empty
            if(eventData.content == '') return;
            
            // ashz> do not log commands
            if(eventData.content.startsWith('/')) return;
            
            eLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] {message:\"${ExF.replaceAll(eventData.content,'\n','\\n')}\",id:\"${eventData.id}\",channel_name:\"${eventData.channel.name}\"}`); 
            break;               
        }
        case 'MESSAGE_DELETE': {
            // ashz> command handling is a repeatitive event, not logging event
            if(eventData.content.startsWith('/')) return;
            
            // ashz> all delete by Norn will be ignored
            if(eventData.author.tag == guildData.Norn.user.tag) return;
            
            eLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData.member.user.tag}] {message:\"${ExF.replaceAll(eventData.content,'\n','\\n')}\",id:\"${eventData.id}\",channel_name:\"${eventData.channel.name}\"}`);
            break;
        }
        case 'MESSAGE_DELETE_BULK': {
            eLog = null;
            consoleLogText = consoleLogText.concat(` {channel_name:\"${eventData.first().channel.name}\"}`);
            break;
        }
        case 'MESSAGE_UPDATE': {
            // ashz> all updates caused by Norn will be ignored
            if(eventData[1].author.tag === guildData.Norn.user.tag) return;
            if(eventData[0].content === eventData[1].content) return;

            eLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData[1].author.tag}] {message_update:(\"${eventData[0].content}\"->\"${eventData[1].content}\")}`);
            break;
        }
        case 'MESSAGE_REACTION_ADD': {
            eLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData[1].tag}] {reaction:\"${eventData[0].emoji}\",message_id:\"${eventData[0].message.id}\",channel_name:\"${eventData[0].message.channel.name}\",message:\"${eventData[0].message.content}\"}`);
            break;
        }
        case 'MESSAGE_REACTION_DELETE': {
            eLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData[1].tag}] {reaction:\"${eventData[0].emoji}\",message_id:\"${eventData[0].message.id}\",channel_name:\"${eventData[0].message.channel.name}\",message:\"${eventData[0].message.content}\"}`);
            break;
        }
        case 'MESSAGE_REACTION_REMOVE_ALL': {
            let emojiCache = '';

            eventData.reactions.cache.forEach((element) => {
                emojiCache.append(element.emoji);
            });

            eLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] {reaction:\"${emojiCache}\",message_id:\"${eventData.id}\",channel_name:\"${eventData.channel.name}\",message:\"${eventData.content}\"}`);
            break;
        }
        case 'TYPING_START': {
            eLog = null;
            consoleLogText = consoleLogText.concat(`[${eventData[1].tag}] Typing event detected.`);
            break;
        }
        case 'ROLE_CREATE': {
            eLog = null;
            consoleLogText = consoleLogText.concat(`[administrator] {id:\"${eventData.id}\",name:\"${eventData.name}\"}`);
            break;
        }
        case 'ROLE_DELETE': {
            eLog = null;
            consoleLogText = consoleLogText.concat(`[administrator] {id:\"${eventData.id}\",name:\"${eventData.name}\",color:\"${eventData.color}\",rawPosition:\"${eventData.rawPosition}\"}`);
            break;
        }
        case 'ROLE_UPDATE': { // TODO: ashz
            eLog = null;
            consoleLogText = consoleLogText.concat(`[administrator] Update to role detected. {id:\"${eventData[1].id}\"}`);
            break;
        }
        case 'EMOJI_CREATE': {
            eLog.setColor(ExF.html_green)
                .setTitle('New Emoji')
                .setDescription(`:${eventData.name}:`)
                .setTimestamp();

            consoleLogText = consoleLogText.concat(`[administrator] Added a new Emoji to the guild. {id:\"${eventData.id}\",name:\"${eventData.name}\",auther:\"${eventData.author}\"}`);
            break;
        }
        case 'EMOJI_DELETE': {
            eLog.setColor(ExF.html_orange)
                .setTitle('Deleted Emoji')
                .setDescription(`:${eventData.name}:`)
                .setTimestamp();
            
            consoleLogText = consoleLogText.concat(`[administrator] Deleted Emoji from the guild. {id:\"${eventData.id}\",name:\"${eventData.name}\",auther:\"${eventData.author}\"}`);
            break;
        }
        case 'EMOJI_UPDATE': {
            eLog.setColor(ExF.html_yellow)
                .setTitle('Emoji Updated')
                .setDescription(`:${eventData[0].name}:`)
                .setTimestamp();
            
            consoleLogText = consoleLogText.concat('[administrator] Emoji update event detected.');

            if(eventData[0].name !== eventData[1].name) {
                eLog.addField('Name', `${eventData[0].name} -> ${eventData[1].name}`, true);
                consoleLogText = consoleLogText.concat(` {name:{\"${eventData[0].name}\"->\"${eventData[1].name}\"}}`);
            }
            break;
        }
        case 'GUILD_BAN_ADD': {
            eLog.setColor(ExF.html_orange)
                .setAuthor(eventData[1].username)
                .setTitle('User Banned')
                .setDescription('User is now banned from the guild.')
                .setTimestamp();
            
            consoleLogText = consoleLogText.concat(`[administrator] A user is now banned from the guild. {name:\"${eventData[1].username}\"}`);
            break;
        }
        case 'GUILD_BAN_REMOVE': {
            eLog.setColor(ExF.html_green)
                .setAuthor(eventData[1].username)
                .setTitle('User Un-Banned')
                .setDescription('User is now unbanned from the guild.')
                .setTimestamp();
            
            consoleLogText = consoleLogText.concat(`[administrator] A user is now unbanned from the guild. {name:\"${eventData[1].username}\"}`);
            break;
        }

///////////////////////////////////////////// CLEANED ^
        case 'GUILD_MEMBER_ADD': {
            console.log(eventData);
            console.log('=============================================');
            break;
        }
        case 'GUILD_MEMBER_REMOVE': {
            console.log(eventData);
            console.log('=============================================');
            break;
        }
        case 'GUILD_MEMBER_UPDATE': {
            console.log(eventData[0]);
            console.log('=============================================');
            console.log(eventData[1]);
            console.log('=============================================');
            break;
        }
        case 'GUILD_MEMBER_AVAILABLE': {
            console.log(eventData);
            console.log('=============================================');
            break;
        }
        case 'GUILD_MEMBERS_CHUNK': {
            console.log(eventData[0]);
            console.log('=============================================');
            console.log(eventData[1]);
            console.log('=============================================');
            console.log(eventData[2]);
            console.log('=============================================');
            break;
        }
        case 'GUILD_MEMBER_SPEAKING': {
            console.log(eventData[0]);
            console.log('=============================================');
            console.log(eventData[1]);
            console.log('=============================================');
            break;
        }
        case 'GUILD_CREATE': {
            break;
        }
        case 'GUILD_DELETE': {
            break;
        }
        case 'GUILD_UPDATE': {
            break;
        }
        case 'GUILD_UNAVAILABLE': {
            break;
        }
        case 'USER_UPDATE': {
            break;
        }
        case 'PRESENCE_UPDATE': {
            break;
        }
        case 'VOICE_STATE_UPDATE': {
            break;
        }
        case 'DISCONNECT': {
            break;
        }
        case 'WARN': {
            break;
        }
        case 'DEBUG': {
            break;
        }
        case 'ERROR': {
            break;
        }
///////////////////////////////////////////// CLEANED v

        case 'COMMAND_NO_PERMISSION': {
            eLog
                .setColor(ExF.html_red)
                .setAuthor(eventData.author.tag)
                .setTitle('Insufficient Permission')
                .setDescription(eventData.content)
                .setTimestamp();

            // ashz> For people who are dumb
            eventData.channel.send(eLog);

            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] {id:\"${eventData.id}\",content:\"${eventData.content}\"}`);
            break;
        }
        case 'COMMAND_UNKNOWN': {
            eLog
                .setColor(ExF.html_red)
                .setAuthor(eventData.author.tag)
                .setTitle('Undefined Command')
                .setDescription(eventData.content)
                .setTimestamp();
            
            // ashz> For people who are dumb
            eventData.channel.send(eLog);

            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] {id:\"${eventData.id}\",content:\"${eventData.content}\"}`);
            break;
        }
        case 'COMMAND_DATA_NULL': {
            eLog
                .setColor(ExF.html_red)
                .setAuthor(eventData.author.tag)
                .setTitle('Message Data Contains Null')
                .setDescription(eventData.content)
                .addField('Critical Error', 'Data inside event object is null.', false)
                .setTimestamp();

            // ashz> Just for them helpful people
            eventData.channel.send(eLog);

            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}][CRITICAL] {id:\"${eventData.id}\",content:\"${eventData.content}\"}`);  
            break;  
        }
        default: {
            eLog = null;
            consoleLogText = consoleLogText.concat(' undefined log type.');
        }
    }

    // ashz> Send Embedded Log
    if(guildData!==null && eLog!==null) {
        guildData.systemChannel.send(eLog);
    }

    ExF.logConsole(consoleLogText, guildData);
}

function command_result_handle_log(logType,message,guildData,extraData=null) 
{
    const commandIssuer = message.author.tag;
    var emLog = new Discord.MessageEmbed();
    var consoleLogText;

    if(guildData != null) {
        consoleLogText = `[${guildData.guildID}][command][${logType}][${message.author.tag}]`;
    } else {
        consoleLogText = `[guild_null][command][${logType}][${message.author.tag}]`;
    }
    
    switch(logType) {

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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_red)
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
                .setColor(ExF.html_red)
                .setAuthor(commandIssuer)
                .setTitle('Critical')
                .setDescription(logReason)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
        case 'JOIN_CONNECTED':
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_red)
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
                .setColor(ExF.html_green)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_orange)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
            let maxLength = guildData.TB.queue.length-1;
            let logReason = `Invalid argument value received (${maxLength==0?'0':`0~${maxLength}`})`;
            let logData = 
            {
                error            : "true",
                critical         : "false",
                received_command : message.content,
                reason           : logReason,
            };

            emLog
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
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
                .setColor(ExF.html_yellow)
                .setAuthor(commandIssuer)
                .setTitle('Too Many Arguments')
                .addField('Usage',    '/loop [single/queue] [on/off]',        true)


            consoleLogText = consoleLogText.concat(` ${JSON.stringify(logData)}`);
            break;
        }
		case 'HELP_SUCCESS': {break;}
		case 'HELP_OVER_MAX_ARG_CNT': {break;}
		case 'SYSCALL_UNDER_REQ_ARG_CNT': {break;}
		case 'SYSCALL_DELETE_UNDER_REQ_ARG_CNT': {break;}
		case 'SYSCALL_DELETE_INVALID_ARGUMENT_TYPE': {break;}
		case 'SYSCALL_DELETE_ARGUMENT_OVER_LIMIT': {break;}
		case 'SYSCALL_DELETE_ARGUMENT_UNDER_LIMIT': {break;}
		case 'SYSCALL_DELETE_PROCESS_ERROR': {break;}
		case 'SYSCALL_DELETE_PROCESS_SUCCESS': {break;}
		case 'SYSCALL_DELETE_OVER_MAX_ARG_CNT': {break;}
		case 'SYSCALL_UNKNOWN_ARG': {break;}
		case 'JOIN_VC_NULL': {break;}
		case 'JOIN_VC_SET': {break;}
		case 'JOIN_SUCCESS': {break;}
		case 'JOIN_FAILED': {break;}
		case 'JOIN_OVER_MAX_ARG_CNT': {break;}
		case 'LEAVE_BOT_VC_NULL': {break;}
		case 'LEAVE_SUCCESS': {break;}
		case 'LEAVE_FAILED': {break;}
		case 'LEAVE_OVER_MAX_ARG_CNT': {break;}
		case 'PLAY_UNDER_REQ_ARG_CNT': {break;}
		case 'PLAY_INVALID_ARG_TYPE': {break;}
		case 'PLAY_INVALID_ARG_VAL': {break;}
		case 'PLAY_USER_VC_NULL': {break;}
		case 'PLAY_JOIN_FAILED': {break;}
		case 'PLAY_USER_INVALID_VC': {break;}
		case 'PLAY_SUCCESS': {break;}
		case 'PLAY_FAILED': {break;}
		case 'PLAY_OVER_MAX_ARG_CNT': {break;}
		case 'START_USER_VC_NULL': {break;}
		case 'START_BOT_VC_NULL': {break;}
		case 'START_BOT_VCON_NULL': {break;}
		case 'START_USER_INVALID_VC': {break;}
		case 'START_QUEUE_EMPTY': {break;}
		case 'START_PLAYING': {break;}
		case 'START_SUCCESS': {break;}
		case 'START_FAILED': {break;}
		case 'START_OVER_MAX_ARG_CNT': {break;}
		case 'STOP_USER_VC_NULL': {break;}
		case 'STOP_BOT_VC_NULL': {break;}
		case 'STOP_BOT_VCON_NULL': {break;}
		case 'STOP_USER_INVALID_VC': {break;}
		case 'STOP_STOPPED': {break;}
		case 'STOP_SUCCESS': {break;}
		case 'STOP_FAILED': {break;}
		case 'STOP_OVER_MAX_ARG_CNT': {break;}
		case 'RESUME_USER_VC_NULL': {break;}
		case 'RESUME_VC_NULL': {break;}
		case 'RESUME_BOT_VCON_NULL': {break;}
		case 'RESUME_USER_INVALID_VC': {break;}
		case 'RESUME_PLAYING': {break;}
		case 'RESUME_SUCCESS': {break;}
		case 'RESUME_FAILED': {break;}
		case 'RESUME_OVER_MAX_ARG_CNT': {break;}
		case 'RESUME_USER_VC_NULL': {break;}
		case 'RESUME_BOT_VC_NULL': {break;}
		case 'RESUME_BOT_VCON_NULL': {break;}
		case 'RESUME_USER_INVALID_VC': {break;}
		case 'PAUSE_STOPPED': {break;}
		case 'PAUSE_PAUSED': {break;}
		case 'PAUSE_SUCCESS': {break;}
		case 'PAUSE_FAILED': {break;}
		case 'PAUSE_OVER_MAX_ARG_CNT': {break;}
		case 'LIST_QUEUE_EMPTY': {break;}
		case 'LIST_SUCCESS': {break;}
		case 'LIST_OVER_MAX_ARG_CNT': {break;}
		case 'ADD_UNDER_REQ_ARG_CNT': {break;}
		case 'ADD_INVALID_ARG_TYPE': {break;}
		case 'PLAY_INVALID_ARG_VAL': {break;}
		case 'ADD_SUCCESS': {break;}
		case 'ADD_FAILED': {break;}
		case 'ADD_OVER_MAX_ARG_CNT': {break;}
		case 'REMOVE_UNDER_REQ_ARG_CNT': {break;}
		case 'REMOVE_INVALID_ARG_TYPE': {break;}
		case 'REMOVE_INVALID_ARG_VAL': {break;}
		case 'REMOVE_CUR_IDX': {break;}
		case 'REMOVE_SUCCESS': {break;}
		case 'REMOVE_FAILED': {break;}
		case 'REMOVE_OVER_MAX_ARG_CNT': {break;}
		case 'CLEAR_QUEUE_EMPTY': {break;}
		case 'CLEAR_CUR_IDX': {break;}
		case 'CLEAR_SUCCESS': {break;}
		case 'CLEAR_FAILED': {break;}
		case 'CLEAR_OVER_MAX_ARG_CNT': {break;}
		case 'NEXT_USER_VC_NULL': {break;}
		case 'NEXT_BOT_VC_NULL': {break;}
		case 'NEXT_BOT_VCON_NULL': {break;}
		case 'NEXT_USER_INVALID_VC': {break;}
		case 'NEXT_QUEUE_EMPTY': {break;}
		case 'NEXT_INVALID_ARG_TYPE': {break;}
		case 'NEXT_INVALID_ARG_VAL': {break;}
		case 'NEXT_SUCCESS': {break;}
		case 'NEXT_FAILED': {break;}
		case 'NEXT_OVER_MAX_ARG_CNT': {break;}
		case 'PREV_USER_VC_NULL': {break;}
		case 'PREV_BOT_VC_NULL': {break;}
		case 'PREV_BOT_VCON_NULL': {break;}
		case 'PREV_USER_INVALID_VC': {break;}
		case 'PREV_QUEUE_EMPTY': {break;}
		case 'PREV_INVALID_ARG_TYPE': {break;}
		case 'PREV_INVALID_ARG_VAL': {break;}
		case 'PREV_SUCCESS': {break;}
		case 'PREV_FAILED': {break;}
		case 'PREV_OVER_MAX_ARG_CNT': {break;}
		case 'LOOP_UNDER_REQ_ARG_CNT': {break;}
		case 'LOOP_SUCCESS': {break;}
		case 'LOOP_FAILED': {break;}
		case 'LOOP_INVALID_ARG_VAL_1': {break;}
		case 'LOOP_SUCCESS': {break;}
		case 'LOOP_FAILED': {break;}
		case 'LOOP_SUCCESS': {break;}
		case 'LOOP_FAILED': {break;}
		case 'LOOP_INVALID_ARG_VAL_2': {break;}
		case 'LOOP_INVALID_ARG_VAL_1': {break;}
		case 'LOOP_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_UNDER_REQ_ARG_CNT': {break;}
		case 'PLAYLIST_LIST_SUCCESS': {break;}
		case 'PLAYLIST_CREATE_UNDER_REQ_ARG_CNT': {break;}
		case 'PLAYLIST_DELETE_UNDER_REQ_ARG_CNT': {break;}
		case 'PLAYLIST_QUEUE_UNDER_REQ_ARG_CNT': {break;}
		case 'PLAYLIST_SHOW_UNDER_REQ_ARG_CNT': {break;}
		case 'PLAYLIST_ADD_UNDER_REQ_ARG_CNT': {break;}
		case 'PLAYLIST_REMOVE_UNDER_REQ_ARG_CNT': {break;}
		case 'PLAYLIST_UNKNOWN_ARG_1': {break;}
		case 'PLAYLIST_LIST_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_CREATE_FILE_EXISTS': {break;}
		case 'PLAYLIST_CREATE_SUCCESS': {break;}
		case 'PLAYLIST_CREATE_FAILED': {break;}
		case 'PLAYLIST_DELETE_NO_FILE_EXISTS': {break;}
		case 'PLAYLIST_DELETE_SUCCESS': {break;}
		case 'PLAYLIST_DELETE_FAILED': {break;}
		case 'PLAYLIST_QUEUE_NO_DATA_FOUND': {break;}
		case 'PLAYLIST_QUEUE_SUCCESS': {break;}
		case 'PLAYLIST_QUEUE_FAILED': {break;}
		case 'PLAYLIST_SHOW_NO_PL_FOUND': {break;}
		case 'PLAYLIST_SHOW_SUCCESS': {break;}
		case 'PLAYLIST_ADD_UNDER_REQ_ARG_CNT': {break;}
		case 'PLAYLIST_REMOVE_UNDER_REQ_ARG_CNT': {break;}
		case 'PLAYLIST_UNKNOWN_ARG_1': {break;}
		case 'PLAYLIST_LIST_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_CREATE_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_DELETE_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_QUEUE_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_SHOW_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_ADD_NO_PL_FOUND': {break;}
		case 'PLAYLIST_ADD_SUCCESS': {break;}
		case 'PLAYLIST_ADD_FAILED': {break;}
		case 'PLAYLIST_REMOVE_NO_PL_FOUND': {break;}
		case 'PLAYLIST_REMOVE_INVALID_ARG_TYPE': {break;}
		case 'PLAYLIST_REMOVE_INVALID_ARG_VALUE': {break;}
		case 'PLAYLIST_REMOVE_SUCCESS': {break;}
		case 'PLAYLIST_REMOVE_FAILED': {break;}
		case 'PLAYLIST_UNKNOWN_ARG_1': {break;}
		case 'PLAYLIST_LIST_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_CREATE_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_DELETE_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_QUEUE_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_SHOW_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_ADD_NO_PL_FOUND': {break;}
		case 'PLAYLIST_ADD_INVALID_ARG_TYPE': {break;}
		case 'PLAYLIST_ADD_SUCCESS': {break;}
		case 'PLAYLIST_ADD_FAILED': {break;}
		case 'PLAYLIST_DELETE_OVER_MAX_ARG_CNT': {break;}
		case 'PLAYLIST_UNKNOWN_ARG_1': {break;}
		case 'PLAYLIST_OVER_MAX_ARG_CNT': {break;}

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
        console.log(ExF.traceLog('log event error, guildData is null'));
    } else {
        ExF.logConsole(consoleLogText,guildData);
    }
}

function trackbot_result_handle_log(logType, guildData ,extraData=null)
{
    var devLog = new Discord.MessageEmbed();
    var usrLog = new Discord.MessageEmbed();
    var consoleLogText;

    if(guildData != null) {
        consoleLogText = `[${guildData.guildID}][TB][${logType}]`;
    }
    else {
        consoleLogText = `[guild_null][TB][${logType}]`;
    }

    switch(logType)
    {
        case 'PLAY_STREAM_DISCONNECTION_ERROR':
        {
            devLog
                .setColor(ExF.html_red)
                .setTitle(logType)
                .setDescription('Stream disconnection error has occured, restarting current track')
                .setTimestamp();
            usrLog
                .setColor(ExF.html_red)
                .setTitle('Error trying to play track')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` disconnected from data stream`);
            break;
        }
        case 'PLAY_SUCCESS':
        {
            const idx = guildData.TB.index;
            const trackData = guildData.TB.queue[idx];

            devLog=null;
            //     .setColor(ExF.html_green)
            //     .setTitle(logType)
            //     .setDescription(`playing:{${JSON.stringify(trackData)}`)
            //     .setTimestamp();
            usrLog
                .setColor(ExF.html_spring_green)
                .setTitle(`\"${ExF.getLimitedString(trackData.title,43)}\"`)
                // .setDescription('[~.~] Playing track, so lets duck, truck, and smash?')
                .addFields(
                    { name: 'Index',  value: idx,                                   inline: true },
                    { name: 'Length', value: ExF.getSecFormat(trackData.length), inline: true },
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
                .setColor(ExF.html_red)
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
 
    ExF.logConsole(consoleLogText,guildData);

    if( (guildData!=null) && (devLog!=null) ) {
        guildData.systemChannel.send(devLog);
    }
    if( (guildData!=null) && (usrLog!=null) ) {
        guildData.TB.textChannel.send(usrLog);
    }
}

module.exports = {
    logEvent    : norn_event_handle_log,
    logCommand  : command_result_handle_log,
    logTrackBot : trackbot_result_handle_log,
};
