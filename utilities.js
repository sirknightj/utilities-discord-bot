const Discord = require('discord.js');
const config = require('./config.json');
const fs = require('fs');
const jsonFile = require('jsonfile');

module.exports = {
    /**
    * Returns the user that is mentioned. Returns null or undefined if the user is not found, or if the mention is incorrectly formatted.
    * @param {Discord.Message} message the message object being sent.
    * @param {string} lookingFor the string to be checked for a member mention.
    * @returns {Discord.GuildMember} the guild member to be found. Null or undefined if not found.
    */
    getUserFromMention: function (message, lookingFor) {
        if (!lookingFor) {
            return;
        }

        // First, we check if the mention is an incomplete mention.
        if (lookingFor.startsWith('@')) {
            lookingfor = lookingFor.substr(1);
        }

        // First, we check if the input is a User ID.
        let target = message.guild.members.cache.get(lookingFor);

        // Next, we look for a mention.
        if (!target && lookingFor.startsWith('<@') && lookingFor.endsWith('>')) {
            lookingFor = lookingFor.slice(2, -1);

            // Checks if the mentioned user has a nickname. If so, removes the beginning '!'.
            if (lookingFor.startsWith('!')) {
                lookingFor = lookingFor.slice(1);
            }
            return message.guild.members.cache.get(lookingFor);
        }

        // Finally, we look for partial names. For example, if you want to ping @bobthebuilder and only type in bob, it will return 
        // the first user it finds that contains 'bob' in their name.
        // First case: checks for exact capitalization.
        if (!target && lookingFor) {
            target = message.guild.members.cache.find(member => {
                return (member.displayName.includes(lookingFor) || member.user.tag.includes(lookingFor)) && !member.user.bot;
            });
        }

        lookingFor = lookingFor.toLowerCase();

        // Then: checks for all lowercase.
        if (!target && lookingFor) {
            target = message.guild.members.cache.find(member => {
                return (member.displayName.toLowerCase().includes(lookingFor) || member.user.tag.toLowerCase().includes(lookingFor)) && !member.user.bot;
            });
        }
        return target;
    },

    /**
     * Returns the channel. Returns null or undefined if the channel is not found or invalid.
     * @param {Discord.Message} message the message object being sent.
     * @param {string} lookingFor the string to be checked for a channel mention.
     * @returns {Discord.TextChannel} the channel lookingFor represents. Null or undefined if not found.
     */
    getChannelFromMention: function (message, lookingFor) {
        if (!lookingFor) {
            return;
        }

        // First, we have to make sure that the input is lowercase.
        lookingFor = lookingFor.toLowerCase();

        // Next, we shall see if a channel ID was directly inputted.
        var sendingChannel = message.guild.channels.cache.get(lookingFor);

        // If not, then, we look for the channel by name.
        if (!sendingChannel) {
            sendingChannel = message.guild.channels.cache.find(channel => channel.name.toLowerCase() === lookingFor && channel.type === 'text');
        }

        // If the name doesn't match, then it must be a mention. Looks for the channel id from a mention.
        if (!sendingChannel && lookingFor.startsWith('<#') && lookingFor.endsWith('>')) {
            lookingFor = lookingFor.slice(2, -1);
            sendingChannel = message.guild.channels.cache.get(lookingFor);
        }

        if (sendingChannel) {
            if (sendingChannel.type !== 'text') {
                return;
            }
        }

        return sendingChannel;
    },

    /**
     * 
     * @param {Discord.Message} message the message object being sent.
     * @param {string} lookingFor the string to be checked for a channel mention
     * @returns {Discord.VoiceChannel} the channel lookingFor represents. Null or undefined if not found, or invalid.
     */
    getVoiceChannelFromMention: function (message, lookingFor) {
        if (!lookingFor) {
            return;
        }

        // First, we shall see if a channel ID was directly inputted.
        let voiceChannel = message.guild.channels.cache.get(lookingFor);

        // Next, we try to search for an exact match, including capitalization.
        if (!voiceChannel) {
            voiceChannel = message.guild.channels.cache.find(channel => channel.name === lookingFor && channel.type === 'voice');
        }

        // Next, we try to find a match, ignoring capitalization.
        if (!voiceChannel) {
            voiceChannel = message.guild.channels.cache.find(channel => channel.name.toLowerCase() === lookingFor.toLowerCase() && channel.type === 'voice');
        }

        // Next, we try to search for an "includes", including capitalization.
        if (!voiceChannel) {
            voiceChannel = message.guild.channels.cache.find(channel => channel.name.includes(lookingFor) && channel.type === 'voice');
        }

        // Finally, we try to search for an "includes", ignoring capitalization.
        if (!voiceChannel) {
            voiceChannel = message.guild.channels.cache.find(channel => channel.name.toLowerCase().includes(lookingFor.toLowerCase()) && channel.type === 'voice');
        }

        // Additionally, checks if the channel mentioned was a voice channel. If not, then returns null.
        if (voiceChannel) {
            if (voiceChannel.type !== 'voice') {
                return;
            }
        }

        return voiceChannel;
    },

    /**
     * Sends a message in the channel, and deletes after config.delete_delay milliseconds.
     * Catches any errors with the request, such as the bot not having permissions to speak in that channel.
     * @param {Discord.TextChannel} channel the channel to send the message in. 
     * @param {string} content the message to send.
     * @param {int} millis_before_delete how many milliseconds before deletion.
     */
    sendTimedMessage: function (channel, content, millis_before_delete) {
        if (!millis_before_delete || millis_before_delete === 0) {
            millis_before_delete = config.delete_delay;
        }
        channel.send(content)
            .then(msg => msg.delete({ timeout: (millis_before_delete) })
                .catch(error => channel.send(`Error: ${error}`)));
    },

    /**
     * Sends a message in the channel.
     * Catches any errors with the request, such as the bot not having permissions to speak in that channel.
     * @param {Discord.TextChannel} channel the channel to send the message in. 
     * @param {string} content the message to send.
     */
    sendMessage: function (channel, content, messageArgs) {
        channel.send(content, messageArgs)
            .catch(error => {
                console.log(error + " " + error.message);
                channel.send(`Error: ${error.message}`);
            });
    },

    /**
     * Deletes the message, catching any errors, such as lack of permissions, or if the message is already deleted.
     * @param {Discord.Message} message the message to be deleted
     */
    safeDelete: function (message) {
        if (message) {
            message.delete().catch(error => message.channel.send(`Error: ${error.message}`).then(msg => msg.delete({ timeout: config.delete_delay })));
        }
    },

    /**
     * Gets the fully-formatted command usage, including the prefix and command name.
     * @param {Command} fun a command that has a usage.
     * @param {Discord.Message} alias the alias you want displayed.
     * @returns {string} the fully-formatted of the command. 
     */
    getUsage: function (fun, message) {
        return `\`${message.content.substring(0, (`${message.content} `).indexOf(' '))} ${fun.usage}\``.trim();
    },

    /**
     * Adds points to the target's point total.
     * @param {Discord.GuildMember} target the target whose points need updating.
     * @param {int} number the number of points to award.
     */
    addPoints: function (message, target, number) {
        if (!target) {
            throw new InvalidUsageException('Missing target.');
        }
        if (!number) {
            throw new InvalidUsageException('Missing number of points.');
        }

        var allStats = {};
        const fileLocation = `${config.resources_folder_file_path}stats.json`;

        if (fs.existsSync(fileLocation)) {
            allStats = jsonFile.readFileSync(fileLocation);
        } else {
            message.channel.send("stats.json has not been properly configured.")
                .then(msg => msg.delete({ timeout: (config.delete_delay) })
                    .catch(error => channel.send(`Error: ${error}`)));
            return;
        }

        const guildStats = allStats[message.guild.id];
        let oldStats = 0;

        if (!(target.user.id in guildStats)) {
            guildStats[target.user.id] = {
                id: target.user.id,
                points: 0,
                last_message: 0,
                vc_session_started: 0
            };
        } else {
            oldStats = guildStats[target.user.id].points;
            guildStats[target.user.id].points += number;
            guildStats[target.user.id].points = Math.round(guildStats[target.user.id].points * 100) / 100;

            if (guildStats[target.user.id].points < 0) {
                guildStats[target.user.id].points = 0;
            }
        }

        jsonFile.writeFileSync(fileLocation, allStats);
        message.channel.send(`Updated ${target.displayName}'s points from ${oldStats} to ${guildStats[target.user.id].points}.`)
            .then(msg => msg.delete({ timeout: (config.delete_delay) })
                .catch(error => channel.send(`Error: ${error}`)));
        return {
            oldPoints: Math.round(oldStats * 100) / 100,
            newPoints: Math.round(guildStats[target.user.id].points * 100) / 100
        };
    },

    /**
     * Gets the channel to send the bot logs to.
     * @param {Discord.Message} message the message sent in the guild.
     * @returns {Discord.TextChannel} the log channel. Undefined if not found.
     */
    getLogChannel: function (message) {
        return getLogChannel(message.guild);
    },

    /**
     * Removes the member's entry on the leaderboards.
     * Mainly to be used in case someone leaves, because then they won't have a displayName.
     * @param {Discord.Message} message the message containing the command used to initiate this.
     * @param {Discord.GuildMember} memberToDelete the member to be deleted
     */
    deleteEntry: function (message, memberToDelete) {
        if (!message) {
            console.log(`Error: no message. Utilities.js line 260.`)
            return;
        }
        if (!memberToDelete) {
            console.log(`Error: no member. Utilities.js line 264.`)
            return;
        }
        const logChannel = this.getLogChannel(message);
        var allStats = {};
        const fileLocation = `${config.resources_folder_file_path}stats.json`;

        if (fs.existsSync(fileLocation)) {
            allStats = jsonFile.readFileSync(fileLocation);
        } else {
            this.sendTimedMessage(message.channel, "stats.json has not been properly configured.");
            return;
        }

        const guildStats = allStats[memberToDelete.guild.id];
        if (guildStats[memberToDelete.id]) {
            delete guildStats[memberToDelete.id];

            if (logChannel) {
                this.sendMessage(logChannel, `User ID: ${memberToDelete.id} has been removed from the leaderboards.`)
            }
            jsonFile.writeFileSync(fileLocation, allStats);
        } else {
            throw new InvalidArgumentException(`Member ${memberToDelete.id} does not exist.`);
        }
    },

        /**
     * Removes the member's entry on the leaderboards.
     * Mainly to be used in case someone leaves, because then they won't have a displayName.
     * @param {Discord.Message} message the message containing the command used to initiate this.
     * @param {number} memberToDeleteID the ID of the member to be deleted
     */
    deleteEntryWithUserID: function (message, memberToDeleteID) {
        if (!message) {
            console.log(`Error: no message. Utilities.js line 260.`)
            return;
        }
        if (!memberToDeleteID) {
            console.log(`Error: no member. Utilities.js line 264.`)
            return;
        }
        const logChannel = this.getLogChannel(message);
        var allStats = {};
        const fileLocation = `${config.resources_folder_file_path}stats.json`;

        if (fs.existsSync(fileLocation)) {
            allStats = jsonFile.readFileSync(fileLocation);
        } else {
            this.sendTimedMessage(message.channel, "stats.json has not been properly configured.");
            return;
        }

        const guildStats = allStats[message.guild.id];
        if (guildStats[memberToDeleteID]) {
            delete guildStats[memberToDeleteID];

            if (logChannel) {
                this.sendMessage(logChannel, `User ID: ${memberToDeleteID} has been removed from the leaderboards.`)
            }
            jsonFile.writeFileSync(fileLocation, allStats);
        } else {
            throw new InvalidArgumentException(`Member ${memberToDeleteID} does not exist.`);
        }
    }
}

/**
 * Returns the channel to send logs to.
 * @param {Discord.Guild} guild the guild the Log Channel is in. 
 * @returns the Log Channel. Undefined if not found.
 */
function getLogChannel(guild) {
    return guild.channels.cache.get(config.log_channel_id);
}