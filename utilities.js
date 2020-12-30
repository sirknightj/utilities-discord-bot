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

        // Next, we check if the input is a User ID.
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
        if (!message || !lookingFor) {
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
        if (!message || !lookingFor) {
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
     * 
     * @param {Discord.Message} message the message object being sent. 
     * @param {string} lookingFor the string to be checked for a role mention
     * @returns {Discord.Role} the role lookingFor represents. Null or undefined if not found, or invalid.
     */
    getRoleFromMention: function (message, lookingFor) {
        if (!message || !lookingFor) {
            return;
        }

        // First, we check if a role ID was directly inputted.
        let role = message.guild.roles.cache.get(lookingFor);

        // Next, we try to search for an exact match, including capitalization.
        if (!role) {
            role = message.guild.roles.cache.find(role => role.name === lookingFor);
        }

        // Next, we try to find a match, ignoring capitalization.
        if (!role) {
            role = message.guild.roles.cache.find(role => role.name.toLowerCase() === lookingFor.toLowerCase());
        }

        // Next, we try to search for an "includes", including capitalization
        if (!role) {
            role = message.guild.roles.cache.find(role => role.name.includes(lookingFor));
        }

        // Finally, we tru to search for an "includes", ignoring capitalization
        if (!role) {
            role = message.guild.roles.cache.find(role => role.name.toLowerCase().includes(lookingFor.toLowerCase()));
        }

        return role;
    },

    /**
     * Sends a message in the channel, and deletes after config.delete_delay milliseconds.
     * Catches any errors with the request, such as the bot not having permissions to speak in that channel.
     * @param {Discord.TextChannel} channel the channel to send the message in. 
     * @param {string} content the message to send.
     * @param {number} millis_before_delete how many milliseconds before deletion.
     * @returns {Promise<Message>} The sent message.
     */
    sendTimedMessage: function (channel, content, millis_before_delete) {
        if (!channel.id) {
            console.log(`Error! util.sendTimedMessage was not used correctly: Missing channel.`);
            return;
        }
        if (!millis_before_delete || millis_before_delete === 0) {
            millis_before_delete = config.delete_delay;
        }
        return channel.send(content)
            .then(msg => msg.delete({ timeout: (millis_before_delete) })
                .catch(error => channel.send(`Error: ${error}`)));
    },

    /**
     * Sends a message in the channel.
     * Catches any errors with the request, such as the bot not having permissions to speak in that channel.
     * @param {Discord.TextChannel} channel the channel to send the message in. 
     * @param {string} content the message to send.
     * @returns {Promise<Message>} The sent message.
     */
    sendMessage: function (channel, content, messageArgs) {
        if (!channel.id) {
            console.log(`Error! util.sendMessage was not used correctly: Missing channel.`);
            return;
        }
        return channel.send(content, messageArgs)
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
     * @typedef {Object} StatTransaction
     * @property {number} oldPoints the points before the transaction 
     * @property {number} newPoints the points after the transaction
     */

    /**
     * Adds points to the target's point total.
     * @param {Discord.GuildMember} target the target whose points need updating.
     * @param {number} number the number of points to award.
     * @param {string} reason optional, the property to increase by 1 when a point is added.
     * @returns {StatTransaction} this transaction.
     */
    addPoints: function (message, target, number, reason) {
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
            guildStats[target.user.id] = { // Sets all of the normal stats to 0.
                id: target.user.id,
                points: 0,
                coins: 0,
                last_message: 0,
                vc_session_started: 0,
                time_spent_in_vc: 0,
                participating_messages: 0
            };
        } else {
            oldStats = guildStats[target.user.id].points;
            guildStats[target.user.id].points += number;
            guildStats[target.user.id].points = Math.round(guildStats[target.user.id].points * 100) / 100;

            if (guildStats[target.user.id].points < 0) {
                guildStats[target.user.id].points = 0;
            }

            if (reason) {
                if (!guildStats[target.user.id][reason]) {
                    guildStats[target.user.id][reason] = 0;
                }
                guildStats[target.user.id][reason]++;
            }
        }

        jsonFile.writeFileSync(fileLocation, allStats);
        message.channel.send(`Updated ${target.displayName}'s points from ${oldStats} to ${guildStats[target.user.id].points}.`)
            .then(msg => msg.delete({ timeout: (config.delete_delay) })
                .catch(error => channel.send(`Error: ${error}`)));
        if (reason) {
            return {
                oldPoints: Math.round(oldStats * 100) / 100,
                newPoints: Math.round(guildStats[target.user.id].points * 100) / 100,
                oldReason: Math.round((guildStats[target.user.id][reason] - 1) * 100) / 100,
                newReason: Math.round(guildStats[target.user.id][reason])
            };
        } else {
            return {
                oldPoints: Math.round(oldStats * 100) / 100,
                newPoints: Math.round(guildStats[target.user.id].points * 100) / 100
            }
        }
    },

    /**
     * Retrieves the value of one of the stats. Returns 0 if the stat name is invalid, or if the stat does not exist.
     * @param {Discord.Message} message any message sent in the guild.
     * @param {Discord.GuildMember} target the target who you want to retrieve the stats of.
     * @param {string} stat the property name you want to retrieve.
     * @returns {number} the stat number.
     */
    getStats: function (message, target, stat) {
        if (!target) {
            throw new InvalidUsageException('Missing target.');
        }
        if (!stat) {
            throw new InvalidUsageException('Missing stat.');
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

        return allStats[message.guild.id][target.user.id][stat] ? allStats[message.guild.id][target.user.id][stat] : 0;
    },

    /**
     * Adds points to the target's point total.
     * @param {Discord.Message} message any message sent in the guild.
     * @param {Discord.GuildMember} target the target whose points need updating.
     * @param {number} number the stat number to award.
     * @param {string} stat the property the number is awarded to.
     * @returns {StatTransaction} this transaction.
     */
    addStats: function (message, target, number, stat) {
        if (!target) {
            throw new InvalidUsageException('Missing target.');
        }
        if (!number) {
            // throw new InvalidUsageException('Missing number of points.');
        }
        if (!stat) {
            throw new InvalidUsageException('Missing stat.')
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

        if (!(target.user.id in guildStats)) {
            guildStats[target.user.id] = { // Sets all of the normal stats to 0.
                id: target.user.id,
                points: 0,
                coins: 0,
                last_message: 0,
                vc_session_started: 0,
                time_spent_in_vc: 0,
                participating_messages: 0
            };
        }
        guildStats[target.user.id][stat] = guildStats[target.user.id][stat] ? guildStats[target.user.id][stat] : 0;
        let previousStat = guildStats[target.user.id][stat];
        guildStats[target.user.id][stat] = Math.round((guildStats[target.user.id][stat] + number) * 100) / 100;
        jsonFile.writeFileSync(fileLocation, allStats);
        return {
            oldPoints: previousStat,
            newPoints: guildStats[target.user.id][stat]
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
     * Capitalizes the first letter of the word.
     * @param {string} word the word whose first letter needs capitalizing.
     * @returns {string} the word with a capitalized first letter.
     */
    capitalizeFirstLetter: function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    },

    /**
     * Removes the member's entry on the leaderboards.
     * Mainly to be used in case someone leaves, because then they won't have a displayName.
     * @param {Discord.Message} message the message containing the command used to initiate this.
     * @param {Discord.GuildMember} memberToDelete the member to be deleted
     */
    deleteEntry: function (message, memberToDelete) {
        console.log("utilities.js called. " + memberToDelete);
        if (!message) {
            console.log(`utilities.js .deleteEntry: Error: no message.`);
            return;
        }
        if (!memberToDelete) {
            console.log(`utilities.js .deleteEntry: Error: no member.`);
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
        if (guildStats[memberToDelete.id]) {
            delete guildStats[memberToDelete.id];
            if (logChannel) {
                this.sendMessage(logChannel, `Debug: "User ID: ${memberToDelete.id} has been removed from the leaderboards."`)
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
    },

    /**
     * Returns the time in '__d __h __m __s' format.
     * @param {number} milliseconds 
     */
    toFormattedTime: function (milliseconds) {
        if (!milliseconds || isNaN(milliseconds)) {
            return '0s'
        }
        let secondsSpent = Math.floor(milliseconds / 1000);
        let minutesSpent = Math.floor(secondsSpent / 60);
        let hoursSpent = Math.floor(minutesSpent / 60);
        let daysSpent = Math.floor(hoursSpent / 24);
        let timeString = '';
        if (daysSpent > 0) {
            timeString += `${this.addCommas(daysSpent)}d `;
        }
        if (hoursSpent > 0) {
            timeString += `${hoursSpent % 24}h `;
        }
        if (minutesSpent > 0) {
            timeString += `${minutesSpent % 60}m `;
        }
        if (secondsSpent > 0) {
            timeString += `${secondsSpent % 60}s`;
        }
        return timeString.trim();
    },

    /**
     * Adds commas to a number. For example: 100000.0001 becomes 100,000.0001
     * @param {number} number the number to be formatted.
     * @returns {string} the properly-formatted number. 0 if not a number.
     */
    addCommas: function (number) {
        if (!number) {
            return "0";
        }
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    /**
     * Adds the escape character before characters which indicate formatting.
     * Ex. all '_' with '\_'. Formatting codes included are '`', '*', and '_'. 
     * @param {string} name the name(s) to be formatted.
     * @returns {string}
     */
    fixNameFormat: function (name) {
        if (typeof (name) === 'string') {
            let charsToReplace = { '_': "\\_", "`": "\\`", "*": "\\*" }
            return name.replace(/[_`*]/g, char => charsToReplace[char]);
        }
        return name;
    },
}

/**
 * Returns the channel to send logs to.
 * @param {Discord.Guild} guild the guild the Log Channel is in. 
 * @returns the Log Channel. Undefined if not found.
 */
function getLogChannel(guild) {
    return guild.channels.cache.get(config.log_channel_id);
}