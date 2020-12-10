const util = require('../utilities');

module.exports = {
    name: 'say',
    description: 'Says a message in a specified channel, and deletes the message you sent.',
    usage: `(optional: channel-name) <message>`,
    requiresArgs: true,
    requiredPermissions: 'MANAGE_MESSAGES',

    execute(bot, message, args, userFromMention) {
        var lookingFor = args[0];
        var shifted = true;
        var sendingChannel = util.getChannelFromMention(message, args[0]);

        if (!lookingFor) {
            throw 'Missing channel.';
        }

        if (!sendingChannel) {
            shifted = false;
            sendingChannel = message.channel;
        }

        if (shifted) {
            args.shift();
        }

        if (args.length < 1) {
            throw 'Cannot send an empty message.';
        }
        util.safeDelete(message);
        sendingChannel.send(args.join(" "))
            .catch(error => message.reply(`Error: ${error}`));
    }
}