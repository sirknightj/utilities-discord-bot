const discord = require('discord.js');
const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: ['ghostping', 'gp', 'ghostp'],
    description: 'Pings the specified user then deletes the message. Also deletes your command.',
    usage: `<user> (optional: number-of-pings) <channel>`,
    hiddenFromHelp: true,
    async execute(bot, message, args, userFromMention) {

        // If a random user tries to use this command, it will return the unknown command message.
        // This way, the command remains a secret.
        if (!message.member.hasPermission('ADMINISTRATOR')) {
            util.sendMessage(message.channel, config.unknown_command_message);
            return;
        }

        let targetChannelName = args.pop();
        var sendingChannel = util.getChannelFromMention(message, targetChannelName);
        if (!sendingChannel) {
            util.sendTimedMessage(message.channel, `Error: Cannot find ${targetChannelName}`);
            return;
        }

        let numberOfPings = 1;
        if (!isNaN(args[args.length - 1])) {
            numberOfPings = parseInt(args.pop());
        }

        if (numberOfPings < 1) {
            throw new InvalidUsageException();
        }

        if (numberOfPings > config.ghost_ping_limit) {
            util.sendTimedMessage(message.channel, `Error: Too many times. Limit: ${config.ghost_ping_limit}.`);
            return;
        }

        var target = util.getUserFromMention(message, args.join(' '));
        if (!target) {
            util.sendTimedMessage(message.channel, `Error: Cannot find ${args.join(' ')}`);
            return;
        }

        if (numberOfPings > 10) {
            util.sendTimedMessage(message.channel, `Requested ${numberOfPings}.\nEstimated time to finish: ${numberOfPings * 1.2} seconds.`);
        }

        util.safeDelete(message);
        for (var i = 0; i < numberOfPings; i++) {
            await sendingChannel.send(`<@${target.user.id}>`)
                .then(msg => msg.delete())
                .catch(error => message.reply(`Error: ${error}`));
        }
    }
}