const discord = require('discord.js');

/**
 * Returns the user that is mentioned. Returns null if the user is not found, or if the mention is incorrectly formatted.
 * @param {string} mention 
 */
function getUserFromMention(mention) {
    if (!mention) {
        return null;
    }
    // Checks if mention is formatted correctly.
    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        // Checks if the mentioned user has a nickname. If so, removes the beginning !.
        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }
        return bot.users.cache.get(mention);
    }
    return null;
}

/**
 * Returns the channel. Returns null if the channel is not found.
 * @param {Discord.Client()} bot
 * @param {string} check 
 */
function findChannel(bot, check) {
    if (!message) {
        return null;
    }
    return bot.channels.find('name', check);
}