const discord = require("discord.js");
const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: 'warn',
    description: 'Warns the user.',
    usage: `warn <@user> (optional: channel) (optional: message)`,
    requiresTarget: true,
    execute(bot, message, args, user) {
        if (args.length != 0) {

            var sendingChannel = util.getChannelFromMention(bot, args[0]);
            if(sendingChannel) {
                args.shift();
            } else {
                sendingChannel = message.channel;
            }

            var messageToBeSent = ` ${args.join(" ")}`;
            sendingChannel.send(`${user} This is a warning.${messageToBeSent}`)
            message.delete();
        } else {
            message.channel.send(`${user} This is a warning.`)
            message.delete();
        }
    }
}