const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: ['coinflip', 'headstails', 'flipacoin'],
    description: 'Randomly flips heads or tails',
    usage: '',

    execute(bot, message, args) {
       util.sendMessage(message.channel, `I flipped ${Math.floor(Math.random() * 2) === 1 ? 'heads' : 'tails'}!`);
    }
}