const discord = require("discord.js");

module.exports = {
    name: 'announce',
    description: 'Announces a message in a specified channel.',
    usage: `announce <channel-name> <message>`,

    execute(bot, message, args, userFromMention) {
        if(args.length < 2) {
            message.channel.send(`Invalid usage: ${this.usage}`);
            return;
        }
        var lookingFor = args.shift();
        var sendingChannel = bot.channels.cache.find(channel => channel.name.toLowerCase() === lookingFor.toLowerCase());

        if(sendingChannel === null || sendingChannel === undefined) {
            sendingChannel = getChannelFromMention(bot, lookingFor);
        }

        if(sendingChannel === null || sendingChannel === undefined) {
            message.channel.send(`Invalid channel: ${lookingFor}`);
            return;
        }
        
        sendingChannel.send(args.join(" ")).catch(error => message.channel.send(`Error: ${error.message}`));
    }
}

/**
 * Returns the channel that was mentioned. Returns null if the channel is not found, or formatted incorrectly.
 * @param {Discord.Client()} bot
 * @param {string} mention 
 */
function getChannelFromMention(bot, mention) {
    if (!mention) {
        return null;
    }
    // Checks if mention is formatted correctly.
    if (mention.startsWith('<#') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        return bot.channels.cache.get(mention);
    }
    return null;
}