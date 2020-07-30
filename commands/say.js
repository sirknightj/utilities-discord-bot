const discord = require("discord.js");
const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: 'say',
    description: 'Says a message in a specified channel, and deletes the message you sent.',
    usage: `say (optional: channel-name) <message>`,

    execute(bot, message, args, userFromMention) {
        var lookingFor = args[0];
        var shifted = true;
        var sendingChannel = util.getChannelFromMention(bot, args[0]);

        if (!lookingFor) {
            message.channel.send(`Invalid usage: ${config.prefix}${this.usage}`);
            return;
        }

        if (!sendingChannel) {
            shifted = false;
            sendingChannel = message.channel;
        }

        if (shifted) {
            args.shift();
        }

        if (args.length < 1) {
            message.channel.send(`Invalid usage: ${config.prefix}${this.usage}`);
            return;
        }

        sendingChannel.send(args.join(" ")).then(() => message.delete()).catch(error => message.channel.send(`Error: ${error.message}`));
    }
}