const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: ['hello', 'hi'],
    description: 'Says a randomized hello message.',
    usage: "",
    execute(bot, message, args) {
        util.sendMessage(message.channel,
            `${message.member.nickname || message.member.user.username}, ${config.greeting_messages_to_say[Math.floor(Math.random() * config.greeting_messages_to_say.length)]}`);
    }
}