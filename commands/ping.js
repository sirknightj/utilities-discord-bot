const discord = require("discord.js");
const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: 'ping',
    description: 'Pings the user.',
    usage: `<user> (optional: channel-name) (optional: message)`,
    requiresTarget: true,

    execute(bot, message, args, user) {
        if (args.length != 0) {
            message.delete();
            var sendingChannel = util.getChannelFromMention(message, args[0]);
            if (sendingChannel) {
                args.shift();
            } else {
                sendingChannel = message.channel;
            }

            var messageToBeSent = ` ${args.join(" ")}`;
            sendingChannel.send(`${user} ${message.author.username} says ${messageToBeSent.trim()}`).catch(error => message.channel.send(`Error: I am ${error.message}`));
        } else {
            message.delete();
            message.channel.send(`${user} ${message.author.username} pinged you!`).catch(error => message.channel.send(`Error: I am ${error.message}`));
        }
    }
}