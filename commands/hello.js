const config = require('../config.json');
const utilities = require('../utilities');

module.exports = {
    name: ['hello', 'hi'],
    description: 'says hello',
    usage: "",
    execute(bot, message, args) {
        utilities.sendMessage(message.channel,
            `${message.member.nickname || message.member.user.username}, ${config.greeting_messages_to_say[Math.floor(Math.random() * config.greeting_messages_to_say.length)]}`);
    }
}