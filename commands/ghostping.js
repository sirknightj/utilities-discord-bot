const discord = require("discord.js");
const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: ['ghostping', 'gp', 'ghostp'],
    description: 'Pings the specified user then deletes the message. Also deletes your command.',
    usage: `<user> <channel>`,
    hiddenFromHelp: true,
    execute(bot, message, args, userFromMention) {

        // If a random user tries to use this command, it will return the unknown command message.
        // This way, the command remains a secret.
        if (!message.member.hasPermission('ADMINISTRATOR')) {
            util.sendMessage(message.channel, config.unknown_command_message);
            return;
        }

        message.delete();
        if (args.length !== 2) {
            throw new InvalidUsageException();
        }

        var sendingChannel = util.getChannelFromMention(message, args[1]);
        if (!sendingChannel) {
            util.sendTimedMessage(message.channel, `Error: Cannot find ${args[1]}`);
            return;
        }

        var target = util.getUserFromMention(message, args[0]);
        if (!target) {
            util.sendTimedMessage(message.channel, `Error: Cannot find ${args[0]}`);
            return;
        }

        sendingChannel.send(`<@${target.user.id}>`)
            .then(msg => msg.delete())
            .catch(error => message.reply(`Error: ${error}`));
    }
}