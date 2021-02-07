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

            consoleLogText = consoleLogText.concat(' {');

            if(previousChannelName!==updatedChannelName) {
                consoleLogText = consoleLogText.concat(`name:{\"${previousChannelName}\"->\"${updatedChannelName}\"}`);
                isChange       = true;
            }

            if(eventData[0].topic!==eventData[1].topic) {
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                } else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`topic:{\"${eventData[0].topic}\"->\"${eventData[1].topic}\"}`);
            }

            if(eventData[0].rateLimitPerUser!==eventData[1].rateLimitPerUser) {
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                } else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`rateLimit:{\"${eventData[0].rateLimitPerUser}\"->\"${eventData[1].rateLimitPerUser}\"}`);
            }

            if(eventData[0].nsfw != eventData[1].nsfw) {
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                } else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`nsfw:{\"${eventData[0].nsfw}\"->\"${eventData[1].nsfw}\"}`);
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
        case 'GUILD_MEMBER_ADD': {
            eLog = null;
            console.log(eventData);
            consoleLogText = consoleLogText.concat('[external] User creation detected.');
            break;
        }
        case 'GUILD_MEMBER_REMOVE': {
            eLog = null;
            console.log(eventData);
            consoleLogText = consoleLogText.concat('[external] User deletion detected.');
            break;
        }
        case 'GUILD_MEMBER_UPDATE': {
            eLog = null;
            console.log(eventData[0]);
            console.log(eventData[1]);
            consoleLogText = consoleLogText.concat('[external] User update detected.');
            break;
        }
        case 'GUILD_MEMBER_AVAILABLE': {
            eLog = null;
            console.log(eventData);
            consoleLogText = consoleLogText.concat('[external] User availabilty detected.');
            break; 
        }
        case 'GUILD_MEMBERS_CHUNK': {
            eLog = null;
            console.log(eventData[0]);
            console.log(eventData[1]);
            console.log(eventData[2]);
            consoleLogText = consoleLogText.concat('[external] User chunk event detected.');
            break;
        }
        case 'GUILD_MEMBER_SPEAKING': {
            eLog = null;
            console.log(eventData[0]);
            console.log(eventData[1]);
            consoleLogText = consoleLogText.concat('[external] User speaking event detected.');
            break;
        }
        case 'GUILD_CREATE': {
            eLog = null;
            console.log(eventData);
            consoleLogText = consoleLogText.concat('[external] Guild creation detected.');
            break;
        }
        case 'GUILD_DELETE': {
            eLog = null;
            console.log(eventData);
            consoleLogText = consoleLogText.concat('[external] Guild deletion detected.');
            break;
        }
        case 'GUILD_UPDATE': {
            eLog = null;
            console.log(eventData[0]);
            console.log(eventData[1]);
            consoleLogText = consoleLogText.concat('[external] Guild update event detected.');
            break;
        }
        case 'GUILD_UNAVAILABLE': {
            eLog = null;
            console.log(eventData);
            consoleLogText = consoleLogText.concat('[external] Guild unavailable event detected.');
            break;
        }
        case 'USER_UPDATE': {
            eLog = null;
            console.log(eventData[0]);
            console.log(eventData[1]);
            consoleLogText = consoleLogText.concat('[user] User update event detected.');
            break;
        }
        case 'PRESENCE_UPDATE': {
            eLog = null;
            console.log(eventData[0]);
            console.log(eventData[1]);
            consoleLogText = consoleLogText.concat('[user] User presence update detected.');
            break;
        }
        case 'VOICE_STATE_UPDATE': {
            eLog = null;
            console.log(eventData[0]);
            console.log(eventData[1]);
            consoleLogText = consoleLogText.concat('[user] User voice state update detected.');
            break;
        }
        case 'DISCONNECT': {
            eLog = null;
            console.log(eventData[0]);
            console.log(eventData[1]);
            consoleLogText = consoleLogText.concat('[?] Disconnect event detected.');
            break;
        }
        case 'WARN': {
            eLog = null;
            console.log(eventData);
            consoleLogText = consoleLogText.concat('[bot] Warn event detected.');
            break;
        }
        case 'DEBUG': {
            eLog = null;
            console.log(eventData);
            consoleLogText = consoleLogText.concat('[bot] Debug event detected.');
            break;
        }
        case 'ERROR': {
            eLog = null;
            console.log(eventData);
            consoleLogText = consoleLogText.concat('[bot] Error event detected.');
            break;
        }
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

const command_result_handle_log = (logType, eventData, guildData) => {
    let commandIssuer;
    let consoleLogText;
    let eLog;

    if(eventData === null || guildData === null) {
        ExF.logConsole('[guild_null][command] Invalid logCommand() usage.');
        return;
    }

    eLog           = new Discord.MessageEmbed();
    commandIssuer  = eventData.author.tag;
    consoleLogText = `[${guildData.guildID}][command][${logType}][${eventData.author.tag}][${eventData.id}]`;
    
    switch(logType) {
		case 'HELP_SUCCESS': {
            eLog = null;
            consoleLogText = consoleLogText.concat(' Printed the help page.');
            break;
        }
		case 'HELP_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/help'

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'SYSCALL_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/syscall [?]'

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'SYSCALL_DELETE_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/syscall delete [ Lines(2~100) ]'

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'SYSCALL_DELETE_INVALID_ARGUMENT_TYPE': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/syscall delete [ Lines(2~100) ]'

            eLog.setColor(ExF.html_red)
                .setTitle('Invalid Argument Type')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid argument type. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        case 'SYSCALL_DELETE_ARG_UNDER_LIMIT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/syscall delete [ Lines(2~100)) ]'

            eLog.setColor(ExF.html_orange)
                .setTitle('Number Under Limit')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Integer is too low. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'SYSCALL_DELETE_ARG_OVER_LIMIT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/syscall delete [ Lines(2~100)) ]'

            eLog.setColor(ExF.html_orange)
                .setTitle('Number Over Limit')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Integer is too high. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'SYSCALL_DELETE_PROCESS_ERROR': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Delete')
                .setDescription('Critical error. Failed to bulk delete.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Failed bulk delete. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'SYSCALL_DELETE_PROCESS_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle(`Delete Completed`)
                .setDescription(receivedArgument)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Failed bulk delete. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'SYSCALL_DELETE_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/syscall delete [ Lines(2~100)) ]'

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'SYSCALL_UNKNOWN_ARG': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/syscall [?]'

            eLog.setColor(ExF.html_red)
                .setTitle('Unknown Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Unknown arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'JOIN_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Found')
                .setDescription('You are not inside a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` User is not inside a voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'JOIN_VC_SET': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Inside Voice Channel')
                .setDescription('Already joined a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot has already joined a voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'JOIN_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Joined Voice Channel')
                .setDescription('Norn is now connected to your voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Now connected to user's voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'JOIN_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Join')
                .setDescription('Critical error. Failed to join.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to join. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'JOIN_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/join'

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LEAVE_BOT_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Detected')
                .setDescription('Norn is not inside any voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is not inside any voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LEAVE_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Left Voice Channel')
                .setDescription('Norn has disconnected from it\'s voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is now disconnected from it\'s last voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LEAVE_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Leave')
                .setDescription('Critical error. Failed to leave.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to leave. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LEAVE_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/leave'

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAY_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/play [ URL ] [ Volume(1~9) ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAY_INVALID_ARG_TYPE': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/play [ URL ] [ Volume(1~9) ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Invalid Argument Type')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid argument type. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        case 'PLAY_ARG_UNDER_LIMIT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/play [ URL ] [ Volume(1~9) ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Number Under Limit')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Integer is too low. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        case 'PLAY_ARG_OVER_LIMIT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/play [ URL ] [ Volume(1~9) ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Number Over Limit')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Integer is too high. {receivedArgument:\"${receivedArgument}\"}`);
            break; 
        }
		case 'PLAY_USER_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Found')
                .setDescription('You are not inside a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` User is not inside a voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAY_JOIN_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed Joining Channel')
                .setDescription('Critical error. Failed to join user\' voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Catched error. Failed to join user\'s voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAY_SUCCESS': {

			/*
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
			*/

            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Playing And Overriding')
                .setDescription('Playing inputted track in queue. Overriding current track.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Playing inputted track in queue. Overriding current track. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAY_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Play')
                .setDescription('Critical error. Failed to play.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to play. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAY_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/play [ URL ] [ Volume(1~9) ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'START_USER_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Found')
                .setDescription('You are not inside a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` User is not inside a voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'START_BOT_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Detected')
                .setDescription('Norn is not inside any voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is not inside any voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'START_BOT_VCON_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Connection Found')
                .setDescription('Norn is not connected to a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot voice connection not found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'START_USER_INVALID_VC': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Different Channel')
                .setDescription('You are not inside the same channel as Norn.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not inside the same voice channel as bot. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'START_QUEUE_EMPTY': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Empty Queue')
                .setDescription('Nothing to start playing.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Track queue is empty. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'START_PLAYING': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Alreadying Playing')
                .setDescription('Norn is already playing a track.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Already playing a track. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'START_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Starting')
                .setDescription('Starting to play current track.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Starting to play current track. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'START_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Start')
                .setDescription('Critical error. Failed to start playing.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to start playing. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'START_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/start';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'STOP_USER_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Found')
                .setDescription('You are not inside a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` User is not inside a voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'STOP_BOT_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Detected')
                .setDescription('Norn is not inside any voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is not inside any voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'STOP_BOT_VCON_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Connection Found')
                .setDescription('Norn is not connected to a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot voice connection not found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'STOP_USER_INVALID_VC': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Different Channel')
                .setDescription('You are not inside the same channel as Norn.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not inside the same voice channel as bot. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'STOP_STOPPED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Already Stopped')
                .setDescription('Norn is not playing anything.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is already stopped. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'STOP_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Stopping')
                .setDescription('Stopped current track.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Stopped current track. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'STOP_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Stop')
                .setDescription('Critical error. Failed to stop playing.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to stop playing. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'STOP_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/stop';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_USER_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Found')
                .setDescription('You are not inside a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` User is not inside a voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Detected')
                .setDescription('Norn is not inside any voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is not inside any voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_BOT_VCON_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Connection Found')
                .setDescription('Norn is not connected to a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot voice connection not found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_USER_INVALID_VC': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Different Channel')
                .setDescription('You are not inside the same channel as Norn.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not inside the same voice channel as bot. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_PLAYING': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Already Playing')
                .setDescription('Norn is playing track.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is already stopped. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Resuming')
                .setDescription('Resuming current track.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Resuming current track. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Resume')
                .setDescription('Critical error. Failed to resume.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to resume. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/stop';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_USER_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Found')
                .setDescription('You are not inside a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` User is not inside a voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_BOT_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Detected')
                .setDescription('Norn is not inside any voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is not inside any voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_BOT_VCON_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Connection Found')
                .setDescription('Norn is not connected to a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot voice connection not found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'RESUME_USER_INVALID_VC': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Different Channel')
                .setDescription('You are not inside the same channel as Norn.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not inside the same voice channel as bot. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PAUSE_STOPPED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Stopped')
                .setDescription('Norn is not playing anything.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is already stopped. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PAUSE_PAUSED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Already Paused')
                .setDescription('Norn is not playing anything.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is already stopped. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PAUSE_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Pausing')
                .setDescription('Pausing current track.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Pausing current track. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PAUSE_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Pause')
                .setDescription('Critical error. Failed to pause.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to pause. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PAUSE_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/pause';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LIST_QUEUE_EMPTY': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Empty Queue')
                .setDescription('Nothing to list.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Queue is empty. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LIST_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog = null;
            consoleLogText = consoleLogText.concat(` Showing queue list. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LIST_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/list';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'ADD_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/add [ URL ] [ Volume(1~9) ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        case 'ADD_INVALID_ARG_TYPE': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/add [ URL ] [ Volume(1~9) ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Invalid Argument Type')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid argument type. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        case 'ADD_ARG_UNDER_LIMIT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/add [ URL ] [ Volume(1~9) ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Number Under Limit')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Integer is too low. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        case 'ADD_ARG_OVER_LIMIT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/add [ URL ] [ Volume(1~9) ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Number Over Limit')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Integer is too high. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'ADD_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Added Track To Queue')
                .setDescription('Added track data to queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Playing inputted track in queue. Overriding current track. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'ADD_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Add')
                .setDescription('Critical error. Failed to add track data to queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to resume. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'ADD_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/add [ URL ] [ Volume(1~9) ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'REMOVE_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/remove [ Index ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'REMOVE_INVALID_ARG_TYPE': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/remove [ Index ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Invalid Argument Type')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid argument type. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        case 'REMOVE_ARG_UNDER_LIMIT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/remove [ Index ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Number Under Limit')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Integer is too low. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        case 'REMOVE_ARG_OVER_LIMIT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/remove [ Index ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Number Over Limit')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Integer is too high. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'REMOVE_CUR_IDX': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Playing Current Index')
                .setDescription('Cannot remove currently playing track index.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Cannot remove current playing track. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'REMOVE_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Removed Track From Queue')
                .setDescription('Removed track index from queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Removed track index from queue. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'REMOVE_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Remove')
                .setDescription('Critical error. Failed to remove track from queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to remove. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'REMOVE_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/remove [ Index ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'CLEAR_QUEUE_EMPTY': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Empty Queue')
                .setDescription('Nothing to clear.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Queue is empty. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'CLEAR_CUR_IDX': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Only Current In Queue')
                .setDescription('No other track beside current inside queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` No other track beside current inside queue. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'CLEAR_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Cleared Queue')
                .setDescription('Cleared all tracks inside queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Cleared all tracks inside queue. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'CLEAR_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Clear')
                .setDescription('Critical error. Failed to clear queue\'s track data.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to clear queue\'s track data. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'CLEAR_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/clear';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'NEXT_USER_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Found')
                .setDescription('You are not inside a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` User is not inside a voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'NEXT_BOT_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Detected')
                .setDescription('Norn is not inside any voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is not inside any voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'NEXT_BOT_VCON_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Connection Found')
                .setDescription('Norn is not connected to a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot voice connection not found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'NEXT_USER_INVALID_VC': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Different Channel')
                .setDescription('You are not inside the same channel as Norn.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not inside the same voice channel as bot. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'NEXT_QUEUE_EMPTY': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Empty Queue')
                .setDescription('Nothing to play next.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Nothing to play next. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'NEXT_INVALID_ARG_TYPE': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/next [ Index ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Invalid Argument Type')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid argument type. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'NEXT_INVALID_ARG_VAL': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/next [ Index ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Invalid Argument Value')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid argument value. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        case 'NEXT_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Playing Next Track')
                .setDescription('Playing next track in queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Playing next track in queue. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'NEXT_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Play Next Track')
                .setDescription('Critical error. Failed to play next track.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to play next track. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'NEXT_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/next [ Index ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);    
            break;
        }
		case 'PREV_USER_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Found')
                .setDescription('You are not inside a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` User is not inside a voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PREV_BOT_VC_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Channel Detected')
                .setDescription('Norn is not inside any voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot is not inside any voice channel. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PREV_BOT_VCON_NULL': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Voice Connection Found')
                .setDescription('Norn is not connected to a voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Bot voice connection not found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PREV_USER_INVALID_VC': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Different Channel')
                .setDescription('You are not inside the same channel as Norn.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not inside the same voice channel as bot. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PREV_QUEUE_EMPTY': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Empty Queue')
                .setDescription('No track behind current track.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` No track behind current. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PREV_INVALID_ARG_TYPE': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/previous [ Index ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Invalid Argument Type')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid argument type. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PREV_INVALID_ARG_VAL': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/previous [ Index ]';

            eLog.setColor(ExF.html_orange)
                .setTitle('Invalid Argument Value')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid argument value. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PREV_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Playing Previous Track')
                .setDescription('Playing previous track in queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Playing previous track in queue. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PREV_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Play Previous Track')
                .setDescription('Critical error. Failed to play previous track.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to play previous track. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PREV_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/previous [ Index ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);    
            break;
        }
		case 'LOOP_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/loop [ single / queue ] [ on / off ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LOOP_INVALID_ARG_VAL_1': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/loop [ single / queue ] [ on / off ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Invalid Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LOOP_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setAuthor(commandIssuer)
                .setColor(ExF.html_green)
                .setTitle('Loop Settings Changed')
                .setDescription('Changed track queue loop settings.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Changed track queue loop settings. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LOOP_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Change Loop Settings')
                .setDescription('Critical error. Failed to change loop settings.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to change loop settings. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LOOP_INVALID_ARG_VAL_2': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/loop [ single / queue ] [ on / off ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Invalid Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LOOP_INVALID_ARG_VAL_1': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/loop [ single / queue ] [ on / off ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Invalid Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'LOOP_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/loop [ single / queue ] [ on / off ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist [ list / create / delete / queue / show / add / remove ] [ Playlist Name ] [ URL / Index ] [ Volume ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_LIST_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog = null;
            consoleLogText = consoleLogText.concat(` Showing list of all playlist(s). {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_CREATE_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist create [ Playlist Name ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_DELETE_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist delete [ Playlist Name ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_QUEUE_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist queue [ Playlist Name ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_SHOW_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist show [ Playlist Name ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_ADD_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist add [ Playlist Name ] [ URL ] [ Volume ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_REMOVE_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist remove [ Playlist Name ] [ Index ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_UNKNOWN_ARG_1': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist [ list / create / delete / queue / show / add / remove ] [ Playlist Name ] [ URL / Index ] [ Volume ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Unknown Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Unknown arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_LIST_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist list';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_CREATE_FILE_EXISTS': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('Existing Playlist')
                .setDescription('Playlist already exists.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Playlist already exists. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_CREATE_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_green)
                .setTitle('Creating Playlist')
                .setDescription('Created new playlist.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Created new playlist. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_CREATE_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Create Playlist')
                .setDescription('Critical error. Failed to create new playlist.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to create new playlist. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_DELETE_NO_FILE_EXISTS': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Playlist Found')
                .setDescription('Playlist does not exists.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Playlist does not exists. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_DELETE_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_green)
                .setTitle('Deleted Playlist')
                .setDescription('Deleted new playlist.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Deleted new playlist. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_DELETE_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Delete Playlist')
                .setDescription('Critical error. Failed to delete playlist.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to delete playlist. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_QUEUE_NO_DATA_FOUND': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Playlist Found')
                .setDescription('No playlist found.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` No playlist found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_QUEUE_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_green)
                .setTitle('Playlist Appended To Queue')
                .setDescription('Selected playlist data track was added to queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Selected playlist track data was added to queue. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_QUEUE_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Append Playlist To Queue')
                .setDescription('Critical error. Failed to delete playlist.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to delete playlist. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_SHOW_NO_DATA_FOUND': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Playlist Found')
                .setDescription('No playlist found.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` No playlist found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_SHOW_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_green)
                .setTitle('Showing Playlist')
                .setDescription('Selected playlist data track was added to queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Selected playlist track data was added to queue. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_ADD_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist add [ Playlist Name ] [ URL ] [ Volume ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_REMOVE_UNDER_REQ_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist remove [ Playlist Name ] [ URL ] [ Volume ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Not Enough Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Not enough arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_CREATE_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist create [ Playlist Name ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_DELETE_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist delete [ Playlist Name ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_QUEUE_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist queue [ Playlist Name ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_SHOW_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist show [ Playlist Name ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_ADD_NO_DATA_FOUND': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Playlist Found')
                .setDescription('No playlist found.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` No playlist found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_ADD_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_green)
                .setTitle('Playlist Appended To Queue')
                .setDescription('Selected playlist data track was added to queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Selected playlist track data was added to queue. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_ADD_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Add Track')
                .setDescription('Critical error. Failed to append track data to playlist.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to append track data to playlist. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_REMOVE_NO_DATA_FOUND': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Playlist Found')
                .setDescription('No playlist found.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` No playlist found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_REMOVE_INVALID_ARG_TYPE': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist remove [ Playlist Name ] [ Index ]'; 

            eLog.setColor(ExF.html_orange)
                .setTitle('Invalid Argument Type')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid argument type. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_REMOVE_ARG_UNDER_LIMIT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist remove [ Playlist Name ] [ Index ]'

            eLog.setColor(ExF.html_orange)
                .setTitle('Number Under Limit')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Integer is too low. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        case 'PLAYLIST_REMOVE_ARG_OVER_LIMIT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist remove [ Playlist Name ] [ Index ]'

            eLog.setColor(ExF.html_orange)
                .setTitle('Number Over Limit')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Integer is too high. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_REMOVE_SUCCESS': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_green)
                .setTitle('Playlist Removed From Queue')
                .setDescription('Selected playlist data track was removed from queue.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Selected playlist track data was removed from queue. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_REMOVE_FAILED': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_red)
                .setTitle('Failed To Remove Track')
                .setDescription('Critical error. Failed to remove track data from playlist.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Critical error. Failed to remove track data from playlist. {receivedArgument:\"${receivedArgument}\"}`);    
            break;
        }
		case 'PLAYLIST_ADD_NO_DATA_FOUND': {
            let receivedArgument = eventData.content;

            eLog.setColor(ExF.html_orange)
                .setTitle('No Playlist Found')
                .setDescription('No playlist found.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` No playlist found. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_ADD_INVALID_ARG_TYPE': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist add [ Playlist Name ] [ URL ] [ Volume ]'; 

            eLog.setColor(ExF.html_orange)
                .setTitle('Invalid Argument Type')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Invalid argument type. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
		case 'PLAYLIST_OVER_MAX_ARG_CNT': {
            let receivedArgument = eventData.content;
            let expectedArgument = '/playlist [ list / create / delete / queue / show / add / remove ] [ Playlist Name ] [ URL / Index ] [ Volume ]';

            eLog.setColor(ExF.html_red)
                .setTitle('Too Many Arguments')
                .setDescription(`:o: ${expectedArgument}\n:x: ${receivedArgument}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` Too many arguments. {receivedArgument:\"${receivedArgument}\"}`);
            break;
        }
        default: {
            eLog=null;
            consoleLogText = consoleLogText.concat(` Unknown log type received. {receivedLogType:\"${logType}\"}`);
        }
    }

    if(guildData!=null && eLog!=null) {
        eventData.channel.send(eLog);
    }

    if(consoleLogText == null) {
        console.log(ExF.traceLog('log event error, guildData is null'));
    } else {
        ExF.logConsole(consoleLogText, guildData);
    }
}

const trackbot_result_handle_log = (logType, guildData) => {

    let consoleLogText;
    let eLog;

    if(guildData === null) {
        ExF.logConsole('[guild_null][TB] Invalid logTrackBot() usage.');
        return;
    }

    eLog           = new Discord.MessageEmbed();
    consoleLogText = `[${guildData.guildID}][TB][${logType}]`;

    switch(logType) {
        case 'JOIN_NO_PERM_CONNECT': {
            eLog.setColor(ExF.html_red)
                .setTitle('Require Connection Permission')
                .setDescription('Norn does not have permission to connect to the voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(' No permission to join voice channel.');
			break;
		}
        case 'JOIN_NO_PERM_SPEAK': {
            eLog.setColor(ExF.html_red)
                .setTitle('Require Speaking Permission')
                .setDescription('Norn does not have permission to speak inside voice channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(' No permission to speak inside voice channel.');
			break;
		}
        case 'JOIN_FAILED': {
            eLog.setColor(ExF.html_red)
                .setTitle('Failed Joining Channel')
                .setDescription('Failed to join user\'s void channel.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(' Failed to connect to user\'s voice channel.');
			break;
		}
		case 'PLAY_FAILED': {
            eLog.setColor(ExF.html_red)
                .setTitle('Failed Playing Track')
                .setDescription(`Failed to play track. (Invalid link, premium-only video, or timed-out. Re-trying)\n${guildData.TB.queue[guildData.TB.index].video_url}`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(' Failed trying to play track. (Invalid link, premium-only video, or timed-out. Re-trying)');
            break;
        }
		case 'PLAY_STREAM_MULTIPLE_INIT_FAILED': {
            eLog.setColor(ExF.html_red)
                .setTitle('Skipping Track')
                .setDescription('Failed 3 times to play current track, playing next.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(' Failed 3 times to play current track, playing next.');
            break;
        }
        case 'STOP_FAILED': {
            eLog.setColor(ExF.html_red)
                .setTitle('Stop Failed')
                .setDescription('Failed to destroy voice connection dispatcher.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(' Failed 3 times to play current track, playing next.');
            break;
        }
        case 'RESUME_FAILED': {
            
            break;
        }
        case 'PAUSE_FAILED': {
            
            break;
        }
        case 'QUEUE_ADD_GET_DATA_FAILED': {
            
            break;
        }
		case 'QUEUE_ADD_GET_DATA_NULL': {
            
            break;
        }
		case 'NEXT_END_OF_QUEUE': {
            
            break;
        }
		case 'NEXT_END_OF_QUEUE': {
            
            break;
        }
		case 'PREV_END_OF_QUEUE': {
            
            break;
        }
        case 'QUEUE_APPEND_GET_INFO_FAILED': {
            
            break;
        }
        case 'QUEUE_APPEND_DATA_NULL': {
            
            break;
        }
        default: {
      		eLog=null;
			consoleLogText = consoleLogText.concat(`Unknown log type received. {receivedLogType:\"${logType}\"}`);
        }
    }

    if(guildData!==null && eLog!==null) {
        guildData.systemChannel.send(eLog);
    }

    if(consoleLogText == null) {
        console.log(ExF.traceLog('log event error, guildData is null'));
    } else {
        ExF.logConsole(consoleLogText, guildData);
    }
}

module.exports = {
    logEvent    : norn_event_handle_log,
    logCommand  : command_result_handle_log, 
    logTrackBot : trackbot_result_handle_log,
};
