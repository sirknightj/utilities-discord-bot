const util = require('../utilities');
const { SystemChannelFlags } = require('discord.js');

module.exports = {
    name: ['leave', 'disconnect'],
    description: "Leaves the voice channel it's currently in.",
    usage: '',

    execute(bot, message, args) {
        const voiceChannel = bot.voice.connections.first();
        if (!voiceChannel) {
            message.reply("I'm not in any voice channels!");
            return;
        }
        voiceChannel.disconnect();
        util.sendMessage(message.channel, `Ok, I'm leaving.`);
    }
}