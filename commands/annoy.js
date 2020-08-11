const util = require('../utilities');

module.exports = {
    name: ['annoy', 'bother'],
    description: "Joins, then immediately leaves the voice channel you're in, or the specified channel.",
    usage: '(optional: voice-channel-name)',

    execute(bot, message, args) {
        var voiceChannel;

        // If no argumemnts are passed in, then that means the user wants the bot to join their voice channel.
        if (args.length === 0) {
            voiceChannel = message.member.voice.channel;
            if (!voiceChannel) {
                util.sendTimedMessage(message.channel, `${message.member.displayName}, You must either specify a voice channel, or be in one to use this command.`);
                return;
            }
            // If arguments were passed in, then that means the user wants the bot to join the specified voice channel.
        } else {
            voiceChannel = util.getVoiceChannelFromMention(message, args.join(' '));
        }

        if (!voiceChannel) {
            util.sendMessage(message.channel, `${message.member.displayName}, I can't find that voice channel!`);
            return;
        }

        util.safeDelete(message);
        voiceChannel.join()
            .then(voiceChannel.leave())
            .catch(err => {
                util.safeDelete(message)
                util.sendTimedMessage(message.channel, `Error: ${err.message}`)
            });
    }
}