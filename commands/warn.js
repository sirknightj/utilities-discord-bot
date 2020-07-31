const discord = require("discord.js");
const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: 'warn',
    description: 'Warns the user.',
    usage: `<user> (optional: channel-name) (optional: message)`,
    requiresTarget: true,
    requiredPermissions: ['KICK_MEMBERS'],

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
            sendingChannel.send(`${user} This is a warning.${messageToBeSent}`)
                .catch(error => message.reply(`Error: ${error}`));

        } else {
            message.delete();
            message.channel.send(`${user} This is a warning.`)
                .catch(error => message.reply(`Error: ${error}`));
        }
    }
}