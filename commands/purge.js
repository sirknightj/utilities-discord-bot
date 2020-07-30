const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: 'purge',
    description: 'Purges a specified number of messages from a specified channel. Only available to users with Administrator permission.',
    usage: `purge (optional: channel-name) <number of messages, 2-${config.purge_limit}>`,

    execute(bot, message, args) {
        if (!args[0] || args.length > 1) {
            message.channel.send(`Invalid usage: ${config.prefix}${this.usage}`);
            return;
        }
        console.log('got here');

        console.log(args[0]);
        console.log(isNaN(args[0]));
        console.log(Number.isInteger(args[0]));

        var targetChannel;
        if (isNaN(args[0]) || !Number.isInteger(args[0])) {
            // Then it means that the optional purge was mentioned.
            var lookingFor = args.shift();
            console.log(lookingFor)
            targetChannel = util.getChannelFromMention(bot, lookingFor);
            if (!targetChannel) {
                message.channel.send(`Invalid usage: ${config.prefix}${this.usage}`);
                return;
            }
        }

        console.log('got here2');

        if (isNaN(args[0]) || !Number.isInteger(args[0]) || args[0] > config.purge_limit) {
            message.channel.send(`Invalid usage: ${config.prefix}${this.usage}`);
            return;
        }

        console.log('got here3');

        if(!targetChannel) {
            targetChannel = message.channel;
        }

        targetChannel.bulkDelete(args[0]);
        message.channel.send(`Deleted ${arg[0]} messages in ${targetChannel.name}.`).then(msg => msg.delete(3000));
    }
}