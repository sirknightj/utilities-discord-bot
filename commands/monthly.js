const daily = require('./daily.js');

module.exports = {
    name: ['monthly', 'm'],
    description: 'Claim some free coins once a month!',
    usage: "",
    execute(bot, message, args) {
        daily.handleDaily(message, 'monthly');
    }
}