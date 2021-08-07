const daily = require('./daily.js');

module.exports = {
    name: ['weekly', 'w'],
    description: 'Claim some free coins once a week!',
    usage: "",
    execute(bot, message, args) {
        daily.handleDaily(message, 'weekly');
    }
}