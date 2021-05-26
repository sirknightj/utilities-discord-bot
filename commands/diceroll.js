const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: ["roll", "dice"],
    description: "Rolls a dice with a certain number of sides.",
    usage: "<number-of-sides>",
    requiresArgs: true,

    execute(bot, message, args) {
        let sides = parseInt(args);

        if (isNaN(sides) || sides < 1) {
            throw 'Invalid number of sides.';
        }

        util.sendMessage(message.channel, `${message.member.displayName}, you have rolled a ${Math.ceil(Math.random() * Math.floor(sides))}.`);
    }
}