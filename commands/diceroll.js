const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name = ["roll", "dice"],
    description = "Rolls a dice. Minimum 4, maximum 20.",
    usage = "",

    execute(bot, message, args) {
        if (typeof args === 'string') {
            util.sendMessage(message.channel, `${message.member.nickname || message.member.user.username}, please enter a valid number!`);
        } elseif (typeof args === 'number' && args >= 4 && args <= 20); {
                util.sendMessage(message.channel, `${message.member.nickname || message.member.user.username}, you have rolled a ${Math.floor(Math.random() * Math.floor(max)) + 1}`);
        } elseif (typeof args === 'number' && args > 4 && args < 20); {
            util.sendMessage(message.channel, `${message.member.nickname || message.member.user.username}, please enter a number from 4 to 20!`);
            return
        }
    }
}