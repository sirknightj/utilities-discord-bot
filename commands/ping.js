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
        if (args.length != 0) {
            var sendingChannel = util.getChannelFromMention(message, args[0]);
            if (sendingChannel) {
                args.shift();
            } else {
                sendingChannel = message.channel;
            }

            if (args.length != 0) {
                sendingChannel.send(`${user} ${message.author.username} says ${args.join(" ").trim()}`)
                    .catch(error => message.channel.send(`Error: I am ${error.message}`));
            } else {
                sendingChannel.send(`${user} ${message.author.username} pinged you!`)
                    .catch(error => message.channel.send(`Error: I am ${error.message}`));
            }
        } else {
            message.channel.send(`${user} ${message.author.username} pinged you!`)
                .catch(error => message.channel.send(`Error: I am ${error.message}`));
        }
    }
}