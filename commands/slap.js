const discord = require("discord.js");
const util = require('../utilities');
const config = require('../config.json');
const resources_folder_file_path = config.resources_folder_file_path;

module.exports = {
    name: ['slap', 'punch', 'smack', 'squish'],
    description: 'Says that you slapped the target.',
    usage: `(optional: user slapping) <user target being slapped> (optional: channel-name)`,
    requiresTarget: true,

    execute(bot, message, args, user) {
        var action = message.content.substring(config.prefix.length, message.content.indexOf(' ')).toLowerCase();

        try {
            if (args.length != 0) {
                if (args.length > 2) {
                    throw 'Too many arguments provided.';
                }
                var slapper;
                var target = util.getUserFromMention(message, args[0]);
                if (target) {
                    slapper = user.displayName;
                    args.shift();
                } else {
                    slapper = message.member.displayName;
                    target = user;
                }

                if (target.user.id === message.author.id || slapper.id === target.id) {
                     util.safeDelete(message);
                     util.sendTimedMessage(message.channel, `${slapper} cannot ${action} themselves!`);
                     return;
                 }

                var sendingChannel = util.getChannelFromMention(message, args[0]);
                if (sendingChannel) {
                    args.shift();
                } else {
                    sendingChannel = message.channel;
                }

                if (action === 'slap') {
                    action = 'slapp';
                }
                util.sendMessage(sendingChannel, `<@${target.id}>, ${slapper} ${action}ed you!`);
                playNoiseInVoiceChannel(target.voice.channel, message);
            } else {
                // Prevents the user from slapping themselves.
                if (user.user.id === message.author.id) {
                    util.safeDelete(message);
                    util.sendTimedMessage(message.channel, `You cannot ${action} yourself.`);
                    return;
                }
                if (action === 'slap') {
                    action = 'slapp';
                }
                playNoiseInVoiceChannel(user.voice.channel, message);
                util.sendMessage(message.channel, `<@${user.id}>, ${message.member.displayName} ${action}ed you!`);
            }
            util.safeDelete(message);
        } catch (err) {
            console.log(err.stack);
        }
    }
}

function playNoiseInVoiceChannel(voiceChannel, message) {
    if (!voiceChannel) {
        return;
    }
    voiceChannel.join()
        .then(connection => {
            const dispatcher = connection.play(`${resources_folder_file_path}slap_sound_effect.mp3`);
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

