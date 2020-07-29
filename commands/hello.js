module.exports = {
    name: 'hello',
    description: 'says hello',
    usage: `hello`,
    execute(bot, message, args) {
        message.channel.send(`Hi ${message.author.username}!`);
    }
}