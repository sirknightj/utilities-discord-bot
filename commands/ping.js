const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: ['ping', 'bing', 'pingpong', 'bingbong'],
    description: 'Replies with pong. And also gives you the response time.',
    usage: '',

    execute(bot, message, args) {
        message.channel.send(`${message.content.charAt(1)}inging...`)
            .then(msg => {
                util.sendMessage(message.channel, `${message.content.charAt(1)}ong.\nPing is ${msg.createdTimestamp - message.createdTimestamp} ms.`)
                util.safeDelete(msg);
            })
            .catch(error => message.reply(`Error: ${error.message}`));
    }
}