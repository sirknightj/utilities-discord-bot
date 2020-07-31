module.exports = {
    name: ['hello', 'hi'],
    description: 'says hello',
    usage: ``,
    execute(bot, message, args) {
        message.channel.send(`Hi ${message.author.username}!`)
            .then(msg => msg.delete({ timeout: 5000 })
                .catch(error => message.reply(`Error: ${error}`)));
    }
}