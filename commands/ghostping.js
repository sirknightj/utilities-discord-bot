const discord = require("discord.js");
const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: 'ghostping',
    description: 'Pings the specified user then deletes the message. Also deletes your command.',
    usage: `ghostping <user> <channel>`,
    hiddenFromHelp: true,
    execute(bot, message, args, userFromMention) {
        message.delete();
        if (args.length !== 2) {
            message.channel.send(`Invalid usage: ${config.prefix}${this.usage}`);
            return;
        }

        var sendingChannel = util.getChannelFromMention(bot, args[1]);
        if (!sendingChannel) {
            message.channel.send(`Error: Cannot find ${args[1]}!`);
        }

        var target = util.getUserFromMention(message, args[0]);
        if (!target) {
            message.channel.send(`Error: Cannot find ${args[0]}`);
        }

        sendingChannel.send(`<@${target.user.id}>`).then(msg => msg.delete()).catch(error => message.channel.send(`Error: ${error.message}`));
    }
}