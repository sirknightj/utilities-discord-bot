const discord = require("discord.js");
const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: 'announce',
    description: 'Says a message in a specified channel.',
    usage: `announce <channel-name> <message>`,

    execute(bot, message, args, userFromMention) {
        var lookingFor = args.shift();

        if (!lookingFor) {
            message.channel.send(`Invalid usage: ${config.prefix}${this.usage}`);
            return;
        }

        sendingChannel = util.getChannelFromMention(bot, lookingFor);
        if (!sendingChannel) {
            message.channel.send(`Invalid channel: ${lookingFor}`);
            return;
        }

        if (args.length < 1) {
            message.channel.send(`Invalid usage: ${config.prefix}${this.usage}`);
            return;
        }

        sendingChannel.send(args.join(" ")).catch(error => message.channel.send(`Error: ${error.message}`));
    }
}