module.exports = {
    name: 'warn',
    description: 'Warns the user.',
    usage: `warn <@user> (optional: message)`,
    requiresTarget: true,
    execute(bot, message, args, user) {
        if(args.length != 0) {
            var messageToBeSent = args.join(" ");
            message.channel.send(`${user} This is a warning. ${messageToBeSent}`)
            message.delete();
        } else {
            message.channel.send(`${user} This is a warning.`)
            message.delete();
        }
    }
}