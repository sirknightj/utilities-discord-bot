const discord = require("discord.js");
const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: 'say',
    description: 'Says a message in a specified channel, and deletes the message you sent.',
    usage: `(optional: channel-name) <message>`,

    execute(bot, message, args, userFromMention) {
        message.delete();
        var lookingFor = args[0];
        var shifted = true;
        var sendingChannel = util.getChannelFromMention(message, args[0]);

        if (!lookingFor) {
            throw new InvalidUsageException();
        }

        if (!sendingChannel) {
            shifted = false;
            sendingChannel = message.channel;
        }

        if (shifted) {
            args.shift();
        }

        if (args.length < 1) {
            throw new InvalidUsageException();
        }

        sendingChannel.send(args.join(" "))
            .then(msg => msg.delete({ timeout: config.delete_delay })
                .catch(error => message.reply(`Error: ${error}`)));
    }
}