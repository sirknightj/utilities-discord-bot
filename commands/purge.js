const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: ['purge', 'nuke', 'clear', 'delete'],
    description: 'Deletes a specified number of messages from a specified channel, in addition to the commmand you entered to purge. Only available to users with MANAGE_MESSAGES permission.',
    usage: `(optional: channel-name) <number-of-messages>`,
    requiredPermissions: ['MANAGE_MESSAGES'],

    execute(bot, message, args) {
        message.delete();
        if (!args[0] || args.length > 2) {
            throw new InvalidUsageException();
        }

        const logChannel = message.guild.channels.cache.get(`${config.log_channel_identifier}`);

        var targetChannel;
        if (isNaN(args[0])) {
            // Then it means that the optional purge was mentioned.
            var lookingFor = args.shift();

            targetChannel = util.getChannelFromMention(message, lookingFor);
            if (!targetChannel) {
                throw new InvalidUsageException();
            }
        }

        if (parseInt(args[0]) <= 0 || parseInt(args[0]) > config.purge_limit) {
            throw new InvalidUsageException();
        }

        if (!targetChannel) {
            targetChannel = message.channel;
        }

        if (targetChannel.id === logChannel.id) {
            message.channel.send(`You cannot purge the logs!`)
                .then(msg => msg.delete({ timeout: config.delete_delay })
                    .catch(error => message.channel.send(`Error: ${error}`)));
            return;
        }

        targetChannel.bulkDelete(parseInt(args[0]));
        message.channel.send(`Deleted ${args[0]} messages in ${targetChannel.name}.`)
            .then(msg => msg.delete({ timeout: config.delete_delay })
                .catch(error => message.channel.send(`Error: ${error}`)));

        if (config.log_channel_identifier) {
            logChannel.send(`${message.author.username} deleted ${args[0]} messages in ${targetChannel.name}!`);
        }
    }
}