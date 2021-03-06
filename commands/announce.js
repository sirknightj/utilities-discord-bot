const discord = require("discord.js");
const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: 'announce',
    description: 'Says a message in a specified channel.',
    usage: `<channel-name> <message>`,
    requiresArgs: true,
    requiredPermissions: ['MANAGE_MESSAGES'],

    execute(bot, message, args, userFromMention) {
        var lookingFor = args.shift();

        if (!lookingFor) {
            throw 'Missing channel-name';
        }

        sendingChannel = util.getChannelFromMention(message, lookingFor);
        if (!sendingChannel) {
            message.channel.send(`Invalid channel: ${lookingFor}`);
            return;
        }

        if (args.length < 1) {
            throw 'Cannot send an empty message.';
        }

        util.sendMessage(sendingChannel, args.join(" "));
    }
}