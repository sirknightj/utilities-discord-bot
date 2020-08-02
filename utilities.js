const Discord = require('discord.js');
const config = require('./config.json');

module.exports = {
    /**
    * Returns the user that is mentioned. Returns null or undefined if the user is not found, or if the mention is incorrectly formatted.
    * @param {message} message the message object being sent.
    * @param {string} lookingFor the string to be checked for a member mention.
    */
    getUserFromMention: function (message, lookingFor) {
        if (!lookingFor) {
            return;
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
        if (!target && lookingFor) {
            target = message.guild.members.cache.find(member => {
                return (member.displayName.toLowerCase().includes(lookingFor) || member.user.tag.toLowerCase().includes(lookingFor)) && !member.user.bot;
            });
        }
        return target;
    },

    /**
     * Returns the channel. Returns null or undefined if the channel is not found.
     * @param {message} message the message object being sent.
     * @param {string} lookingFor the string to be checked for a channel mention.
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
            return message.guild.channels.cache.get(lookingFor);
        }

        return sendingChannel;
    },

    /**
     * Sends a message in the channel, and deletes after config.delete_delay milliseconds.
     * Catches any errors with the request, such as the bot not having permissions to speak in that channel.
     * @param {Discord.channel} channel the channel to send the message in. 
     * @param {string} content 
     */
    sendTimedMessage: function (channel, content) {
        channel.send(content)
            .then(msg => msg.delete({ timeout: config.delete_delay })
                .catch(error => channel.send(`Error: ${error}`)));
    },

    /**
     * Sends a message in the channel.
     * Catches any errors with the request, such as the bot not having permissions to speak in that channel.
     * @param {Discord.channel} channel the channel to send the message in. 
     * @param {string} content 
     */
    sendMessage: function (channel, content) {
        sendingChannel.send(args.join(" "))
            .catch(error => channel.send(`Error: ${error}`));
    }
}