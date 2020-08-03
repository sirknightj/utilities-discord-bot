const discord = require("discord.js");
const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: 'ping',
    description: 'Pings the user.',
    usage: `<user> (optional: channel-name) (optional: message)`,
    requiresTarget: true,

    execute(bot, message, args, user) {
        message.delete();
        var sendingChannel;

        if (args.length !== 0) {
            // Attempts to resolve the first argument into a channel name.
            sendingChannel = util.getChannelFromMention(message, args[0]);
        }

        // If a channel is found, then remove it from the arguments.
        if (sendingChannel) {
            args.shift();

        // Otherwise, default to the channel this message was sent in.
        } else {
            sendingChannel = message.channel;
        }

        if (args.length !== 0) {
            util.sendMessage(sendingChannel, `${user} ${message.author.username} says ${args.join(" ").trim()}`);
        } else {
            util.sendMessage(sendingChannel, `${user} ${message.author.username} pinged you!`);
        }
    }
}