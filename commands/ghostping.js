const discord = require("discord.js");
const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: ['ghostping', 'gp', 'ghostp'],
    description: 'Pings the specified user then deletes the message. Also deletes your command.',
    usage: `<user> <channel>`,
    hiddenFromHelp: true,
    execute(bot, message, args, userFromMention) {

        if (!message.member.hasPermission('ADMINISTRATOR')) {
            message.channel.send(`i dont have that command programmed in yet`);
            return;
        }

        message.delete();
        if (args.length !== 2) {
            throw new InvalidUsageException();
        }

        var sendingChannel = util.getChannelFromMention(message, args[1]);
        if (!sendingChannel) {
            message.channel.send(`Error: Cannot find ${args[1]}!`);
        }

        var target = util.getUserFromMention(message, args[0]);
        if (!target) {
            message.channel.send(`Error: Cannot find ${args[0]}`);
        }

        sendingChannel.send(`<@${target.user.id}>`).then(msg => msg.delete())
            .then(msg => msg.delete({ timeout: 5000 })
                .catch(error => message.reply(`Error: ${error}`)));
    }
}