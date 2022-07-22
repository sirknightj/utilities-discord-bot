const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: ['execute', 'e'],
    description: 'Execute a message.',
    usage: "<message link>",
    requiredPermissions: 'ADMINISTRATOR',
    requiresArgs: true,

    execute: function (bot, message, args) {
        this.executor(bot, message, args)
            .catch((e) => console.log(e));
    },

    executor: async function (bot, message, args) {
        if (args.length !== 1) {
            throw 'Too many arguments!';
        }

        const prefix = 'https://discord.com/channels/';
        if (!args[0].startsWith(prefix)) {
            throw 'Not a valid link. Must start with https://discord.com/channels/...';
        }

        if (!message.guild) {
            throw 'Must be used in a discord server';
        }

        let linkArgs = args[0].substr(prefix.length, args[0].length).split('/');
        if (linkArgs.length !== 3) {
            throw 'The link is invalid. It should look something like this: https://discord.com/channels/000000000000000000/000000000000000000/000000000000000000'
        }

        if (message.guild.id !== linkArgs[0]) {
            throw 'This message is not within this Discord server!';
        }

        let channel = await message.guild.channels.cache.find(channel => channel.id === linkArgs[1]);
        if (!channel) {
            throw 'Could not find that channel!';
        }

        let m = await channel.messages.fetch(linkArgs[2]);
        bot.emit('message', m);
    }
}