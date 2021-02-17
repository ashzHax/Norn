# Norn  
A expandable Discord.js project for a audit/moderation bot.  
My first NodeJS and JavaScript project.  
By the way, I usually code with C language. First time trying out a scripting language.  
Will love to hear some advice on how to improve on my code! (Critical raging will be accepted. I teach by yelling as well.)  
Thanks in advance!  

## Prerequisites  
### System  
* Requires latest node.js (Development platform was _Ubuntu 20.04 LTS_)  

### Guild (Discord Server)  
* Create 2 roles inside your guild, *Administrator* and *Bot*  

## Commands  
> All commands starts with **.**(_period_).  
> Volume range is 1 to 9.  
> "{" means it's a required custom input from user.  
> "{{" means it's a optional custom input from user.  
> "[" means it's a required fixed input from user.  
> "[[" means it's a optional fixed input from user.  

| Command  | Arguments                                  | Description                                                                                          | Availabilty | Permission    |  
| :---     | :----                                      | :----                                                                                                | :----       | :---          |  
| help     | -                                          | Shows a list of commands.                                                                            | -           | Bot           |  
| setting  | volume { Volume }                          | Default volume for appended tracks without specified volume.                                         | Not Created | Administrator |  
| syscall  | { ? }                                      | Specialized commands for administrators.                                                             | WIP         | Administrator |  
| join     | -                                          | Norn joins your current voice channel.                                                               | -           | Bot           |  
| leave    | -                                          | Norn disconnects from it's current voice channel.                                                    | -           | Bot           |  
| play     | { URL } {{ Volume }}                       | Immediately starts playing URL's audio at specified volume.                                          | -           | Bot           |  
| start    | -                                          | Starts playing current track.                                                                        | -           | Bot           |  
| stop     | -                                          | Stops current track.                                                                                 | -           | Bot           |  
| resume   | -                                          | Resumes paused track.                                                                                | -           | Bot           |  
| pause    | -                                          | Pauses playing track.                                                                                | -           | Bot           |  
| status   | -                                          | Shows Norn's current audit status.                                                                   | Not Created | Bot           |  
| list     | -                                          | Shows queued track list.                                                                             | -           | Bot           |  
| add      | { URL } {{ Volume }}                       | Append URL data to track queue.                                                                      | -           | Bot           |  
| remove   | { Index }                                  | Removes track with the specified index from queue.                                                   | -           | Bot           |  
| clear    | -                                          | Clears all track from queue except currently playing track.                                          | -           | Bot           |  
| next     | {{ Count }}                                | Plays the next track or the specified count track in queue clockwise from current track.             | -           | Bot           |  
| previous | {{ Count }}                                | Plays the previous track or the specified count track in queue counter-clockwise from current track. | WIP         | Bot           |  
| loop     | single [[ on / off ]]                      | Toggle/Edit single track loop setting.                                                               | -           | Bot           |  
| -        | queue [[ on / off ]]                       | Toggle/Edit queue loop setting.                                                                      | -           | Bot           |  
| playlist | list                                       | Shows all playlists.                                                                                 | -           | Bot           |  
| -        | queue { Playlist Name }                    | Appened playlist to the current queue.                                                               | -           | Bot           |  
| -        | show { Playlist Name }                     | Shows all tracks inside playlist.                                                                    | -           | Bot           |  
| -        | create { Playlist Name }                   | Create a new playlist.                                                                               | -           | Bot           |  
| -        | delete { Playlist Name }                   | Delete a existing playlist.                                                                          | -           | Bot           |  
| -        | add { Playlist Name } { URL } {{ Volume }} | Adds track to a existing playlist.                                                                   | -           | Bot           |  
| -        | remove { Playlist Name } { Index }         | Removes track of index from existing playlist.                                                       | -           | Bot           |  

## Thanks To The Amazing People Here  
Thanks to the following authors of these guides that I was able to create this.  
(Sorry to those I forgot. Coding in JavaScript makes you skim over several hundreds websites.)  

[NodeJS module: ytdl-core](https://www.npmjs.com/package/ytdl-core)  
> Also thank you to the Github issue discussion posts for the ytdl-core project, constantly reporting frequent bugs and requesting functionality upgrades.  

[NodeJS module: opusscript](https://www.npmjs.com/package/opusscript)  
[Writing a music command for your discord.js bot](https://dev.to/galnir/how-to-write-a-music-command-using-the-discord-js-library-462f)  
[Make your own Discord bot](https://www.youtube.com/watch?v=q0lsD7U0JSI)  
  
