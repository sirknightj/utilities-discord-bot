const util = require('../utilities');

module.exports = {
    name: ['leave', 'disconnect'],
    description: "Leaves the voice channel it's currently in.",
    usage: '',

    execute(bot, message, args) {
        try {
            const voiceChannel = message.guild.me.voice.channel;
            if (!voiceChannel) {
                message.reply("I'm not in any voice channels!");
                return;
            }
            voiceChannel.leave();
            util.sendMessage(message.channel, `Ok, I'm leaving.`);
        } catch (err) {
            console.log(err)
        }
    }
}