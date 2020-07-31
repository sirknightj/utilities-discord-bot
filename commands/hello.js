const config = require('../config.json');

module.exports = {
    name: ['hello', 'hi'],
    description: 'says hello',
    usage: ``,
    execute(bot, message, args) {
        message.reply(config.greeting_messages_to_say[Math.floor(Math.random() * config.greeting_messages_to_say.length)])
            .catch(error => message.reply(`Error: ${error}`));
    }
}