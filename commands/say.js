const discord = require("discord.js");

module.exports = {
    name: 'say',
    description: 'Says a message in a specified channel, and deletes the message you sent.',
    usage: `say (optional: channel-name) <message>`,

    execute(bot, message, args, userFromMention) {
        if(args.length < 2) {
            message.channel.send(`Invalid usage: ${this.usage}`);
            return;
        }
        var lookingFor = args[0];
        var shifted = true;
        var sendingChannel = bot.channels.cache.find(channel => channel.name.toLowerCase() === lookingFor.toLowerCase());

        if(sendingChannel === null || sendingChannel === undefined) {
            sendingChannel = getChannelFromMention(bot, lookingFor);
        }

        if(sendingChannel === null || sendingChannel === undefined) {
            shifted = false;
            sendingChannel = message.channel;
        }

        if(shifted) {
            args.shift();
        }
        
        sendingChannel.send(args.join(" ")).then(() => message.delete()).catch(error => message.channel.send(`Error: ${error.message}`));
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