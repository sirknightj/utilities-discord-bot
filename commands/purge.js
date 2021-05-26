const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: ['purge', 'nuke', 'clear', 'delete'],
    description: 'Deletes a specified number of messages from a specified channel, in addition to the commmand you entered to purge.',
    usage: '(optional: channel-name) <number>',
    requiresArgs: true,
    requiredPermissions: 'MANAGE_MESSAGES',

    execute(bot, message, args) {
        const logChannel = message.guild.channels.cache.get(`${config.log_channel_id}`);
        if (!logChannel) {
            util.sendTimedMessage(message.channel, "Your config file's log_channel_id is not set up correctly.");
            return;
        }

        if (!args[0] || args.length > 2) {
            throw 'Too many arguments are provided.';
        }

        var targetChannel;
        if (isNaN(args[0])) {
            // Then it means that the (optional: channel-name) was mentioned.
            var lookingFor = args.shift();

            targetChannel = util.getChannelFromMention(message, lookingFor);
            if (!targetChannel) {
                throw `Cannot find channel: ${lookingFor}.`;
            }
        }

        // Turns the user input into a number.
        const numberToDelete = parseInt(args[0]);

        // Checks for a valid number input, and makes sure that it's below the purge limit.
        if (numberToDelete <= 0 || numberToDelete > config.purge_limit) {
            throw 'Invalid input number.';
        }
        util.safeDelete(message);

        // Defaults to this channel, if no target channel is specified.
        if (!targetChannel) {
            targetChannel = message.channel;
        }

        // Does not allow purging of the logs.
        if (targetChannel.id === logChannel.id) {
            util.sendTimedMessage(message.channel, "You can't purge the logs!");
            return;
        }

        // Delete the messages. This will appear in the audit logs.
        targetChannel.bulkDelete(numberToDelete).catch(error => util.sendMessage(message.channel, `Error: ${error.message}`));

        // Tells the user that the deleting went well.
        // util.sendTimedMessage(message.channel, `Successfully deleted ${numberToDelete} messages in ${targetChannel.name}.`)
        
        // Logs the action of who used this command.
        util.sendMessage(logChannel, `${message.author.username} has deleted ${numberToDelete} messages in ${targetChannel.name}!`);
    }
}