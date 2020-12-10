const util = require('../utilities');
const config = require('../config.json');
const resources_folder_file_path = config.resources_folder_file_path;

module.exports = {
    name: 'afkcheck',
    description: 'Plays a "hi, how are ya?" noise in the voice channel the person is in.',
    usage: `<user or voice channel name>`,
    requiresTarget: false,

    execute(bot, message, args, user) {
        try {
        var action = message.content.substring(config.prefix.length, message.content.indexOf(' ')).toLowerCase();

        var target = util.getUserFromMention(message, args.join(' '));
        var voiceChannel;
        if (target) { // then the user inputted a voice channel.
            voiceChannel = target.voice.channel;
        } else { // then there is no target, and thus, a voice channel was inputted.
            voiceChannel = util.getVoiceChannelFromMention(message, args.join(' '));
        }

        util.safeDelete(message);
        if (!target && !voiceChannel) {
            throw 'Missing arguments.';
        }

        if (target && !voiceChannel) {
            util.sendTimedMessage(message.channel, `${target.displayName} isn't in a voice channel!`);
            return;
        }

        util.sendTimedMessage(message.channel, `I'm playing the afk checking noise in ${voiceChannel.name}`);
        playNoiseInVoiceChannel(voiceChannel, message);
    } catch (err) {
        console.log(err.stack)
    }
    }
}

function playNoiseInVoiceChannel(voiceChannel, message) {
    if (!voiceChannel) {
        return;
    }
    voiceChannel.join()
        .then(connection => {
            const dispatcher = connection.play(`${resources_folder_file_path}hi_how_are_ya.mp3`);
            dispatcher.setVolume(0.7);

            dispatcher.on('finish', finish => {
                connection.disconnect();
                voiceChannel.leave();
            });
        })
        .catch(err => {
            message.reply(err.message);
            console.log(err)
        });
}

