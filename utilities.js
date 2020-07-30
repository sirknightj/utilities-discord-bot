const discord = require('discord.js');

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

        // First, we search for an exact name.
        let target = message.guild.members.cache.get(lookingFor);

        // Next, we look for a mention.
        if (!target && lookingFor.startsWith('<@') && lookingFor.endsWith('>')) {
            lookingFor = lookingFor.slice(2, -1);

            // Checks if the mentioned user has a nickname. If so, removes the beginning !.
            if (lookingFor.startsWith('!')) {
                lookingFor = lookingFor.slice(1);
            }
            return message.guild.members.cache.get(lookingFor);
        }

        // Finally, we look for partial names. For example, if you want to ping @bobthebuilder and only type in bob, it will return 
        // the first user it finds that contains 'bob' in their name.
        if (!target && lookingFor) {
            target = message.guild.members.cache.find(member => {
                return member.displayName.toLowerCase().includes(lookingFor) || member.user.tag.toLowerCase().includes(lookingFor);
            });
        }
        return target;
    },

    /**
     * Returns the channel. Returns null or undefined if the channel is not found.
     * @param {Discord.Client()} bot the Discord client
     * @param {string} lookingFor the string to be checked for a channel mention.
     */
    getChannelFromMention: function (bot, lookingFor) {
        if (!lookingFor) {
            return;
        }

        // First, we have to make sure that the input is lowercase.
        lookingFor = lookingFor.toLowerCase();

        // Looks for the channel by name first.
        var sendingChannel = bot.channels.cache.find(channel => channel.name.toLowerCase() === lookingFor);

        if (sendingChannel === null || sendingChannel === undefined) {
            // If the name doesn't match, then it must be a mention. Looks for the channel id from a mention.
            if (lookingFor.startsWith('<#') && lookingFor.endsWith('>')) {
                lookingFor = lookingFor.slice(2, -1);
                return bot.channels.cache.get(lookingFor);
            }
        }
        return sendingChannel;
    }
}