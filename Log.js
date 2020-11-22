"use strict";

// external module
const Discord = require('discord.js');

// custom module
const AXC =     require('./Function.js');

function log_console(message=null)
{
    if(message==null) {
        console.log('Invalid \"log_console()\" function usage!');
    }
    else {
        console.log(`[${AXC.getStringDate(new Date())}]${(!message.startsWith('[')?' ':'')}${message}`);
    }
}
module.exports.log_console = log_console;

// event data sent only to logging channel and console
function log_event(logType,eventData,guildData=null)
{
    var devLog = new Discord.MessageEmbed();
    var usrLog = new Discord.MessageEmbed();
    var consoleLogText;

    if(guildData != null) {
        consoleLogText = `[${guildData.guildID}][event][${logType}]`;
    }
    else {
        consoleLogText = `[guild_null][event][${logType}]`;
    }

    switch(logType)
    {
        case 'BOT_READY':
        {
            //devLog = null;
            devLog
                .setColor(AXC.html_spring_green)
                .setTitle(logType)
                .setDescription('[+.+] I live to serve you my liege')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(`[${guildData.Norn.user.tag}] I live to serve you, my liege`);
            break;
        }
//////////////////////////////////////////////////
// Event Handler: Channel
//////////////////////////////////////////////////
        case 'CHANNEL_CREATE':
        {
            let channelType = (eventData.type == 'voice') ? 'Voice Channel' : 'Text Channel';
            let channelName = AXC.getChannelName(eventData);

            devLog
                .setColor(AXC.html_green)
                .setTitle(logType)
                .setDescription(`[#.#] Created a new channel named \"${channelName}\"`)
                .setTimestamp()
                .addFields(
                    { name: 'Type', value: channelType,  inline: false },
                    { name: 'ID',   value: eventData.id, inline: false },
                );

            consoleLogText = consoleLogText.concat(` id:\"${eventData.id}\",name:\"${channelName}\",type:\"${channelType}\"`);
            break;
        }
        case 'CHANNEL_DELETE':
        {
            let channelType = (eventData.type == 'voice') ? 'Voice Channel' : 'Text Channel';
            let channelName = AXC.getChannelName(eventData);

            devLog
                .setColor(AXC.html_green)
                .setTitle(logType)
                .setDescription(`[X.X] Deleted a channel named \"${channelName}\"`)
                .setTimestamp()
                .addFields(
                    { name: 'Type', value: channelType,  inline: false },
                    { name: 'ID',   value: eventData.id, inline: false },
                );

            consoleLogText = consoleLogText.concat(` id:\"${eventData.id}\",name:\"${channelName}\",type:\"${channelType}\"`);
            break;
        }
        case 'CHANNEL_PINS_UPDATE':
        {
            let channelName = AXC.getChannelName(eventData[0]);
            let strTimeStamp = AXC.getStringDate(eventData[1]);

            devLog
                .setColor(AXC.html_green)
                .setTitle(logType)
                .setDescription('[#.#] Pin update detected')
                .setTimestamp()
                .addFields(
                    { name: 'ID',           value: eventData[0].id, inline: false },
                    { name: 'Channel Name', value: channelName,     inline: false },
                    { name: 'Timestamp',    value: strTimeStamp,    inline: false },
                );

            consoleLogText = consoleLogText.concat(` id:\"${eventData[0].id},name:\"${channelName}\",timestamp:\"${strTimeStamp}\"`);
            break;
        }
        case 'CHANNEL_UPDATE':
        {
            let previousChannelName = AXC.getChannelName(eventData[0]);
            let updatedChannelName  = AXC.getChannelName(eventData[1]);
            
            var isChange = false;

            consoleLogText = consoleLogText.concat(' ');
            devLog
                .setColor(AXC.html_green)
                .setTitle(logType)
                .setDescription('A channel\'s setting(s) have been updated')
                .setTimestamp();

            if(previousChannelName != updatedChannelName) 
            {
                devLog.addField('Name', `\"${previousChannelName}\" -> \"${updatedChannelName}\"`, false);
                consoleLogText = consoleLogText.concat(`name:(\"${previousChannelName}\"->\'${updatedChannelName})\"`);
                isChange = true;
            }
            if(eventData[0].topic != eventData[1].topic)
            {
                devLog.addField('Topic', `\"${eventData[0].topic}\" -> \"${eventData[1].topic}\"`, false);
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                }
                else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`topic:(\"${eventData[0].topic}\"->\"${eventData[1].topic}\")`);
            }
            if(eventData[0].rateLimitPerUser != eventData[1].rateLimitPerUser)
            {
                devLog.addField('Rate Limit', `\"${eventData[0].rateLimitPerUser}\" -> \"${eventData[1].rateLimitPerUser}\"`, false);
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                } 
                else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`rateLimit:(\"${eventData[0].rateLimitPerUser}\"->\"${eventData[1].rateLimitPerUser}\")`);
            }
            if(eventData[0].nsfw != eventData[1].nsfw)
            {
                devLog.addField('NSFW', `\"${eventData[0].nsfw}\" -> \"${eventData[1].nsfw}\"`, false);
                if(isChange) {
                    consoleLogText=consoleLogText.concat(',');
                }
                else {
                    isChange = true;
                }
                consoleLogText = consoleLogText.concat(`nsfw:(\"${eventData[0].nsfw}\"->\"${eventData[1].nsfw}\")`);
            }
            break;
        }
//////////////////////////////////////////////////
// Event Handler: Message
//////////////////////////////////////////////////
        case 'MESSAGE':
        {
            // if event occuring channel is the bot channel, does not log
            if(eventData.author.id == guildData.Norn.user.id) return;
            
            // sometimes, contents could be empty
            if(eventData.content == '') return;
            
            // do not log commands
            if(eventData.content.startsWith('/')) return;

            devLog
                .setColor(AXC.html_blue)
                .setAuthor(`user: ${eventData.author.tag}`)
                .setTitle(logType)
                .setDescription(`\"${eventData.content}\"`)
                .addFields(
                    { name: 'Message ID',   value: eventData.id,           inline: true },
                    { name: 'Channel Name', value: eventData.channel.name, inline: true },
                )  
                .setTimestamp();eventData.content
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] message:\"${AXC.replaceAll(eventData.content,'\n','\\n')}\",id:\"${eventData.id}\",channel_name:\"${eventData.channel.name}\"`); 
            break;               
        }
        case 'MESSAGE_DELETE':
        {
            // command handling is a repeatitive event, not logging event
            if(eventData.content.startsWith('/')) return;
            
            // all delete by Norn will be ignored
            if(eventData.author.tag == guildData.Norn.user.tag) return;
            
            devLog
                .setColor(AXC.html_blue)
                .setAuthor(`user: ${eventData.member.user.tag}`)
                .setTitle(logType)
                .setDescription(`\"${eventData.content}\"`)
                .addFields(
                    { name: 'Message ID',   value: eventData.id,           inline: true },
                    { name: 'Channel Name', value: eventData.channel.name, inline: true },
                )  
                .setTimestamp();
            consoleLogText = consoleLogText.concat(`[${eventData.member.user.tag}] message:\"${AXC.replaceAll(eventData.content,'\n','\\n')}\",id:\"${eventData.id}\",channel_name:\"${eventData.channel.name}\"`);
            break;
        }
        case 'MESSAGE_DELETE_BULK':
        {
            const channelName = eventData.first().channel.name;

            devLog
                .setColor(AXC.html_blue)
                .setTitle(logType)
                .setDescription('Bulk delete event was triggered')
                .addField('Channel Name',channelName,true)  
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` channel_name:\"${channelName}\"`);
            break;
        }
        case 'MESSAGE_UPDATE':
        {
            // all update caused by Norn will be ignored
            if(eventData[1].author.tag == guildData.Norn.user.tag) return;
            if(eventData[0].content == eventData[1].content) return;

            devLog
                .setColor(AXC.html_blue)
                .setAuthor(`user: ${eventData[1].author.tag}`)
                .setTitle(logType)
                .setDescription(`\"${eventData[0].content}\" -> \"${eventData[1].content}\"`)
                .setTimestamp()
            consoleLogText = consoleLogText.concat(`[${eventData[1].author.tag}] message_update:{\"${eventData[0].content}\"->\"${eventData[1].content}\"}`)
            break;
        }
        case 'MESSAGE_REACTION_ADD':
        {
            devLog
                .setColor(AXC.html_blue)
                .setAuthor(`user: ${eventData[1].tag}`)
                .setTitle(logType)
                .setDescription(`Reacted to a message with \"${eventData[0].emoji}\"`)
                .addFields(
                    { name: 'Message ID',   value: eventData[0].message.id,           inline: true },
                    { name: 'Channel Name', value: eventData[0].message.channel.name, inline: true },
                    { name: 'Message',      value: eventData[0].message.content,      inline: false },
                )  
                .setTimestamp();
            consoleLogText = consoleLogText.concat(`[${eventData[1].tag}] reaction:\"${eventData[0].emoji}\",message_id:\"${eventData[0].message.id}\",channel_name:\"${eventData[0].message.channel.name}\",message:\"${eventData[0].message.content}\"`);
            break;
        }
        case 'MESSAGE_REACTION_DELETE':
        {
            devLog
                .setColor(AXC.html_blue)
                .setAuthor(`user: ${eventData[1].tag}`)
                .setTitle(logType)
                .setDescription(`Deleted a reaction \"${eventData[0].emoji}\"`)
                .addFields(
                    { name: 'Message ID',   value: eventData[0].message.id,           inline: true },
                    { name: 'Channel Name', value: eventData[0].message.channel.name, inline: true },
                    { name: 'Message',      value: eventData[0].message.content,      inline: false },
                )  
                .setTimestamp();
            consoleLogText = consoleLogText.concat(`[${eventData[1].tag}] reaction:\"${eventData[0].emoji}\",message_id:\"${eventData[0].message.id}\",channel_name:\"${eventData[0].message.channel.name}\",message:\"${eventData[0].message.content}\"`);
            break;
        }
        case 'MESSAGE_REACTION_REMOVE_ALL':
        {
            let emojiCache = '';
            eventData[0].reactions.cache.forEach(element => {
                emojiCache.append(element.emoji);
            });

            devLog
                .setColor(AXC.html_blue)
                .setAuthor(`user: ${eventData.author.tag}`)
                .setTitle(logType)
                .setDescription(`Deleted reactions \"${emojiCache}\"`)
                .addFields(
                    { name: 'Message ID',   value: eventData.id,           inline: true  },
                    { name: 'Channel Name', value: eventData.channel.name, inline: true  },
                    { name: 'Message',      value: eventData.content,      inline: false },
                )  
                .setTimestamp();
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] reaction:\"${emojiCache}\",message_id:\"${eventData.id}\",channel_name:\"${eventData.channel.name}\",message:\"${eventData.content}\"`);
            break;
        }
        case 'TYPING_START':
        {
            devLog
                .setColor(AXC.html_blue)
                .setAuthor(`user: ${eventData[1].tag}`)
                .setTitle(logType)
                .setDescription(`Typing event detected`)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(`[${eventData[1].tag}] typing event detected`);
            break;
        }
//////////////////////////////////////////////////
// Event Handler: Command
//////////////////////////////////////////////////
        case 'COMMAND_NO_PERMISSION':
        {
            devLog
                .setColor(AXC.html_blue)
                .setAuthor(`user: ${eventData.author.tag}`)
                .setTitle(logType)
                .setDescription('[-.-] User does not have permission to run this command')
                .addFields(
                    { name: 'Channel',          value: AXC.getChannelName(eventData.channel), inline: true },
                    { name: 'Message ID',       value: eventData.id,                          inline: true },
                    { name: 'Received Command', value: eventData.content,                     inline: true },
                    { name: 'Cause',            value: 'no permission to use this command',   inline: true },
                )  
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(eventData.author.tag)
                .setTitle('No Permission')
                .setDescription('[o.O] You have no permissions to issue commands')
                .addField('Received Message',`\"${eventData.content}\"`,false)
                .setTimestamp();
            
            eventData.channel.send(usrLog);
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] command:\"${eventData.content}\",reason:\"no permission to use this command\"`);  
            break;
        }
        case 'COMMAND_UNKNOWN':
        {
            devLog
                .setColor(AXC.html_blue)
                .setAuthor(`user: ${eventData.author.tag}`)
                .setTitle(logType)
                .setDescription('Unknown command was received')
                .addFields(
                    { name: 'Channel',          value: AXC.getChannelName(eventData.channel), inline: true },
                    { name: 'Message ID',       value: eventData.id,                          inline: true },
                    { name: 'Received Command', value: eventData.content,                     inline: true },
                    { name: 'Cause',            value: 'unknown command',                     inline: true },
                )  
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(eventData.author.tag)
                .setTitle('Unknown command (Try /help)')
                .setDescription('[?.?] Unknown command, try typing /help for a list of commands')
                .addField('Received Message',`\"${eventData.content}\"`,false)
                .setTimestamp();
            
            eventData.channel.send(usrLog);
            consoleLogText = consoleLogText.concat(`[${eventData.author.tag}] command:\"${eventData.content}\",reason:\"unknown command\"`);  
            break;
        }
        default:
        {
            consoleLogText = consoleLogText.concat(' undefined log type');
        }
    }

    if( (guildData!=null) && (devLog!=null) ) {
        guildData.systemChannel.send(devLog);
    }
    log_console(consoleLogText);
}
module.exports.log_event = log_event;

function log_command(logType,message,guildData) 
{
    const commandUser = message.author.tag;

    var devLog = new Discord.MessageEmbed();
    var usrLog = new Discord.MessageEmbed();
    var consoleLogText;

    if(guildData != null) {
        consoleLogText = `[${guildData.guildID}][command][${logType}][${message.author.tag}]`;
    }
    else {
        consoleLogText = `[guild_null][command][${logType}][${message.author.tag}]`;
    }
    
    switch(logType) 
    {
        case 'DELETE_NOT_ENOUGH_ARGUMENTS':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Not enough arguments')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Not enough arguments')
                .addField('Received Command',message.content,false)
                .addField('Example','/delete [2~100]',false)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'DELETE_TOO_MANY_ARGUMENTS':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Too many arguments')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Too many arguments')
                .addField('Received Command',message.content,false)
                .addField('Example','/delete [2~100]',false)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'DELETE_INVALID_ARGUMENT_TYPE':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Invalid argument type')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Invalid argument type (Expected INT)')
                .addField('Received Command',message.content,false)
                .addField('Example','/delete [2~100]',false)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`)
            break;
        }
        case 'DELETE_ARGUMENT_OVER_LIMIT':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Argument value is over-limit')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Argument value is over-limit (Expected 2~100)')
                .addField('Received Command',message.content,false)
                .addField('Example','/delete [2~100]',false)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`)
            break; 
        }
        case 'DELETE_ARGUMENT_UNDER_LIMIT':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Argument value is under-limit')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Argument value is under-limit (Expected 2~100)')
                .addField('Received Command',message.content,false)
                .addField('Example','/delete [2~100]',false)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`)
            break; 
        }
        case 'DELETE_PROCESS_ERROR':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Bulk delete process failed (high level error)')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('[X.X] Bulk delete process failed')
                .setDescription('Are all the target messages under 14 days old?')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` process_failed:\"high chance target messages are over 14 days old\",received_command:\"${message.content}\"`);
            break; 
        }
        case 'DELETE_PROCESS_SUCCESS':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Bulk delete process failed (high level error)')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_green)
                .setAuthor(commandUser)
                .setTitle('[@.@] Bulk delete success')
                .setDescription('Congratulation, you erased all the evidence. Hopefully.')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break; 
        }
        case 'JOIN_NO_TEXT_CHANNEL':
        {
            devLog
                .setColor(AXC.html_red)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('No text channel found (High level error)')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('No text channel found')
                .setDescription('High level error, please report to the developer')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` process_failed:\"cannot retrieve text channel\",received_command:\"${message.content}\"`);
            break;
        }
        case 'JOIN_NO_VOICE_CHANNEL':
        {
            devLog
                .setColor(AXC.html_red)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('No voice channel found')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Voice channel not found')
                .setDescription('[@.@] You are not in a voice channel')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'JOIN_NO_CONNECT_PERMISSION':
        {
            devLog
                .setColor(AXC.html_red)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('No connect permission (Low level error)')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Cannot connect to voice channel')
                .setDescription('[>.>] I have no permission to connect to a voice channel')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'JOIN_NO_SPEAK_PERMISSION':
        {
            devLog
                .setColor(AXC.html_red)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('No speak permission (Low level error)')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Cannot speak in voice channel')
                .setDescription('[>.>] I have no permission to speak in a voice channel')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'JOIN_CONNECTION_FAILED':
        {
            devLog
                .setColor(AXC.html_red)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Connection failed (High level error)')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Connection failed')
                .setDescription('[X.X] Failed to connect to voice channel')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` process_failed:\"connection failed\",received_command:\"${message.content}\"`);
            break;
        }
        case 'JOIN_TOO_MANY_ARGUMENT':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Too many arguments')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Too many arguments')
                .addField('Received Command',message.content,false)
                .addField('Example','/join [URL] [1~9]',false)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;   
        }   
        case 'JOIN_SUCCESS':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Connection established to voice channel')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_green)
                .setAuthor(commandUser)
                .setTitle('Connection established to voice channel')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'LEAVE_NO_CONNECTION_FOUND':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('no connection instance found')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('[-.-] I am not inside a voice channel')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }   
        case 'LEAVE_SUCCESS':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Disconnected from voice channel')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_green)
                .setAuthor(commandUser)
                .setTitle('Disconnected from voice channel')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'PLAY_NOT_ENOUGH_ARGUMENT':
        {
            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Not enough arguments')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Not enough arguments')
                .addField('Received Command',message.content,false)
                .addField('Example','/play [URL] [VOLUME]',false)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'PLAY_GET_INFO_FAILED':
        {
            devLog
                .setColor(AXC.html_red)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Failed to get video info using API (High level error)')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Failed to retrieve video data')
                .addField('Received Command',message.content,false)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'PLAY_RECEIVED_DATA_NULL':
        {
            devLog
                .setColor(AXC.html_red)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Data retrieve using API returned null (High level error)')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Retrieved data is null')
                .addField('Received Command',message.content,false)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'PLAY_TOO_MANY_ARGUMENT':
        {
            devLog
                .setColor(AXC.html_red)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Too many arguments')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_green)
                .setAuthor(commandUser)
                .setTitle('Too many arguments')
                .addField('Received Command',message.content,false)
                .addField('Example','/play [URL] [VOLUME]',false)
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        case 'PLAY_ADDED_REQUEST_TO_QUEUE':
        {
            let idx = guildData.TB.queue.length-1;
            const trackData = guildData.TB.queue[idx];

            devLog
                .setColor(AXC.html_green)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('Added track to queue')
                .addField('Received Command',message.content,true)
                .addField(JSON.stringify(trackData))
                .setTimestamp();
            usrLog
                .setColor(AXC.html_green)
                .setAuthor(commandUser)
                .setTitle(`[No.${idx}] Added track to queue`)
                .addFields(
                    { name: 'Title',  value: trackData.title,                       inline: false },
                    { name: 'URL',    value: trackData.video_url,                   inline: false },
                    { name: 'Length', value: AXC.getSecondFormat(trackData.length), inline: true },
                    { name: 'Volume', value: trackData.volume,                      inline: true },
                    
                )  
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }   
        case 'PLAY_TB_PLAY_ERROR':
        {
            let idx = guildData.TB.queue.length-1;
            const trackData = guildData.TB.queue[idx];

            devLog
                .setColor(AXC.html_red)
                .setAuthor(`user: ${commandUser}`)
                .setTitle(logType)
                .setDescription('TB_Play returned error')
                .addField('Received Command',message.content,true)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setAuthor(commandUser)
                .setTitle('Error trying to play track')
                .addField('Received Command',message.content,false)  
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` received_command:\"${message.content}\"`);
            break;
        }
        default:
        {
            consoleLogText = consoleLogText.concat(' undefined log type');
        }
    }

    if( (guildData!=null) && (devLog!=null) ) {
        guildData.systemChannel.send(devLog);
    }
    if( (guildData!=null) && (usrLog!=null) ) {
        message.channel.send(usrLog);
    }
    log_console(consoleLogText);
}
module.exports.log_command = log_command;


function log_TB(logType,guildData)
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
                .setColor(AXC.html_red)
                .setTitle(logType)
                .setDescription('Stream disconnection error has occured, restarting current track')
                .setTimestamp();
            usrLog
                .setColor(AXC.html_red)
                .setTitle('Error trying to play track')
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` disconnected from data stream`);
            break;
        }
        case 'PLAY_SUCCESS':
        {
            const idx = guildData.TB.index;
            const trackData = guildData.TB.queue[idx];

            devLog
                .setColor(AXC.html_green)
                .setTitle(logType)
                .setDescription(`playing:{${JSON.stringify(trackData)}`)
                .setTimestamp();
            usrLog
                .setColor(AXC.html_spring_green)
                .setTitle(`\"${AXC.stringCut(trackData.title,43)}\"`)
                .setDescription('[~.~] Playing track, so lets duck, truck, and smash?')
                .addFields(
                    { name: 'Index',  value: idx,                                   inline: true },
                    { name: 'Length', value: AXC.getSecondFormat(trackData.length), inline: true },
                    { name: 'Volume', value: trackData.volume,                      inline: true },
                    { name: 'URL',    value: trackData.video_url,                   inline: false },
                )  
                .setTimestamp();
            consoleLogText = consoleLogText.concat(` playing:{${JSON.stringify(trackData)}}`);
            break;
        }
        default:
        {
            consoleLogText = consoleLogText.concat(' unknown log type');
            devLog = null;
            usrLog = null;
        }
    }
 
    log_console(consoleLogText);

    if( (guildData!=null) && (devLog!=null) ) {
        guildData.systemChannel.send(devLog);
    }
    if( (guildData!=null) && (usrLog!=null) ) {
        guildData.TB.textChannel.send(usrLog);
    }
}
module.exports.log_TB = log_TB;
