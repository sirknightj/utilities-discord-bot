const config = require('../config.json');

module.exports = {
    name: 'purge',
    description: 'Purges a specified number of messages from a specified channel. Only available to users with Administrator permission.',
    usage: `purge <channel-name> <number of messages, 1-${config.purge_limit}>`,

    execute(bot, message, args) {
        if(isNaN(args[0]) || args[0] > config.purge_limit) {
            message.channel.send(`Invalid usage: ${this.usage}`);
        }

        message.channel.send(`work in progress.`);
    }
}