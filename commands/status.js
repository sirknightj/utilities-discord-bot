const config = require('../config.json');
const util = require('../utilities');

const presence = ['online', 'idle', 'invisible', 'dnd'];

module.exports = {
    name: ['status', 'setstatus', 'updateStatus'],
    description: "Sets the bot's status.",
    usage: "<online/idle/invisible/dnd>",
    requiresArgs: true,
    execute(bot, message, args) {
        if (args.length > 1) {
            throw 'Too many arguments provided.';
        }
        // The presence must be set to one of the four options listed in the presence array above.
        if (!presence.includes(args[0].toLowerCase())) {
            throw `Invalid status. Please choose from one of the following: \`${presence.join('`/`')}\``;
        }
        util.safeDelete(message);
        bot.user.setStatus(args[0].toLowerCase())
            .then(util.sendTimedMessage(message.channel, `Status successfully updated to ${args[0].toLowerCase()}. Please give it a few moments to update.`))
            .catch(err => util.sendMessage(message.channel, `Error: ${err}`));
    }
}