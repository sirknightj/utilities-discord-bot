const daily = require('./daily.js');

module.exports = {
    name: ['yearly', 'y'],
    description: 'Claim some free coins once a year!',
    usage: "",
    execute(bot, message, args) {
        daily.handleDaily(message, 'yearly');
    }
}