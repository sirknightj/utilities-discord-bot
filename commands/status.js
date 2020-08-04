const config = require('../config.json');
const util = require('../utilities');

const presence = ['online', 'idle', 'invisible', 'dnd'];

module.exports = {
    name: ['status', 'setstatus', 'updateStatus'],
    description: "Sets the bot's status.",
    usage: "<online/idle/invisible/dnd>",
    requiresArgs: true,
    execute(bot, message, args) {

        message.delete();
        if (args.length > 1) {
            throw new InvalidUsageError();
        }

        // The presence must be set to one of the four optionsm listed in the presence array above.
        if (!presence.includes(args[0].toLowerCase())) {
            throw new InvalidUsageError();
        }

        bot.user.setStatus(args[0].toLowerCase()).catch(err => util.sendMessage(message.channel, `Error: ${err}`));
        util.sendTimedMessage(message.channel, `Status successfully updated to ${args[0].toLowerCase()}. Please give it a few moments to update.`);
    }
}