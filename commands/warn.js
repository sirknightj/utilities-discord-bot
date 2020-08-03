const discord = require("discord.js");
const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: 'warn',
    description: 'Warns the user.',
    usage: `<user> (optional: channel-name) (optional: message)`,
    requiresTarget: true,
    requiredPermissions: 'KICK_MEMBERS',

    execute(bot, message, args, user) {
        message.delete();
        if (args.length != 0) {

            var sendingChannel = util.getChannelFromMention(message, args[0]);
            if (sendingChannel) {
                args.shift();
            } else {
                sendingChannel = message.channel;
            }

            var messageToBeSent = args.join(" ");
            util.sendMessage(sendingChannel, `${user} This is a warning. ${messageToBeSent}`);
        } else {
            util.sendMessage(message.channel, `${user} This is a warning.`);
        }
    }
}