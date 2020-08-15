const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: ["roll", "dice"],
    description: "Rolls a dice. Minimum 4, maximum 20.",
    usage: "<number-of-sides>",
    requiresArgs: true,

    execute(bot, message, args) {
        let sides = parseInt(args);

        if (sides < 4 || sides > 20) {
            throw new InvalidUsageError();
        }

        util.sendMessage(message.channel, `${message.member.displayName}, you have rolled a ${Math.floor(Math.random() * Math.floor(sides)) + 1}.`);
    }
}