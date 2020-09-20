const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: ['hello', 'hi', 'hewwo'],
    description: 'Says a randomized hello message.',
    usage: "",
    execute(bot, message, args) {
        if (!config) {
            console.log("Cannot locate config.json.");
            return;
        }
        if (!config.greeting_messages_to_say) {
            console.log("Cannot locate greeting_messages_to_say in config.json.");
            return;
        }
        if (typeof config.greeting_messages_to_say === 'string') {
            config.greeting_messages_to_say = [config.greeting_messages_to_say];
        }
        util.sendMessage(message.channel,
            `${message.member.displayName}, ${config.greeting_messages_to_say[Math.floor(Math.random() * config.greeting_messages_to_say.length)]}`);
    }
}