const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: ['coinflip', 'headsortails', 'flipacoin'],
    description: 'Randomly flips heads or tails',
    usage: '',

    execute(bot, message, args) {
       util.sendMessage(message.channel, `I flipped ${Math.random() < 0.5 ? 'heads' : 'tails'}!`);
    }
}