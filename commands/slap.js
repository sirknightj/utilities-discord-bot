const util = require('../utilities');
const config = require('../config.json');
const resources_folder_file_path = config.resources_folder_file_path;
const Discord = require('discord.js');

module.exports = {
    name: ['slap', 'punch', 'smack', 'squish', 'hug', 'scam', 'jumpscare', 'scare', 'spank', 'frame', 'pat'],
    description: 'Says that you slapped the target.',
    usage: `(optional: user slapping) <user target being slapped> (optional: channel-name)`,
    requiresTarget: true,

    execute(bot, message, args, user) {
        let action = message.content.substring(config.prefix.length, message.content.indexOf(' ')).toLowerCase();
        const headpats = ['https://media.discordapp.net/attachments/737795688473165895/833843926968303646/headpat.gif', 
        'https://tenor.com/view/anime-good-girl-pet-pat-gif-9200932', 
        'https://tenor.com/view/kanna-kamui-pat-head-pat-gif-12018819', 
        'https://tenor.com/view/anime-head-pat-anime-head-rub-neko-anime-love-anime-gif-16121044', 
        'https://tenor.com/view/nagi-no-asukara-manaka-mukaido-head-pat-petting-blush-gif-8841561', 
        'https://tenor.com/view/anime-anime-headrub-anime-headpat-loli-kawaii-gif-16085284', 
        'https://tenor.com/view/charlotte-pat-blush-embarrassed-shy-gif-5081286', 
        'https://tenor.com/view/pet-cute-anime-head-pat-good-job-gif-16919214',
        'https://tenor.com/view/korone-inugami-korone-f%C4%B1t%C4%B1t%C4%B1-headpat-anime-gif-18455155'
    ]

        if (args.length != 0) {
            if (args.length > 2) {
                throw 'Too many arguments provided.';
            }
            let slapper;
            let target = util.getUserFromMention(message, args[0]);
            if (target) {
                slapper = user;
                args.shift();
            } else {
                slapper = message.member;
                target = user;
            }

            if (target.user.id === message.author.id || slapper.id === target.id) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `${slapper} cannot ${action} themselves!`);
                return;
            }

            let sendingChannel = util.getChannelFromMention(message, args[0]);
            if (sendingChannel) {
                args.shift();
            } else {
                sendingChannel = message.channel;
            }

            if (!message.member.permissionsIn(sendingChannel).has('SEND_MESSAGES', true) || !message.member.permissionsIn(sendingChannel).has('VIEW_CHANNEL', true)) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, 'Sorry, you do not have permission to send messages in that channel.', config.longer_delete_delay);
                return;
            }

            if (!slapper.permissionsIn(sendingChannel).has('SEND_MESSAGES', true) || !slapper.permissionsIn(sendingChannel).has('VIEW_CHANNEL', true)) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `Sorry, ${util.fixNameFormat(slapper.displayName)} does not have permission to send messages in that channel.`, config.longer_delete_delay);
                return;
            }

            if (action === 'slap') {
                action = 'slapp';
            } else if (action === 'hug') {
                action = 'hugg';
            } else if (action === 'scam') {
                action = 'scamm';
            } else if (action === 'jumpscare') {
                action = 'jumpscar';
            } else if (action === 'scare') {
                action = 'scar';
            } else if (action === 'frame') {
                action = 'fram';
            } else if (action === 'pat') {
                util.safeDelete(message);
                util.sendMessage(sendingChannel, `${slapper.displayName} pats <@${target.id}>! ***pat pat***\n${headpats[Math.floor(Math.random() * headpats.length)]}`);
                return;
            }
            util.sendMessage(sendingChannel, `<@${target.id}>, ${slapper.displayName} ${action}ed you!`);
            playNoiseInVoiceChannel(target.voice.channel, message);
        } else {
            // Prevents the user from slapping themselves.
            if (user.user.id === message.author.id) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `You cannot ${action} yourself.`);
                return;
            }

            if (!message.member.permissionsIn(message.channel).has('SEND_MESSAGES', true) || !message.member.permissionsIn(message.channel).has('VIEW_CHANNEL', true)) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, 'Sorry, you do not have permission to send messages in that channel.', config.longer_delete_delay);
                return;
            }

            if (action === 'slap') {
                action = 'slapp';
            } else if (action === 'hug') {
                action = 'hugg';
            } else if (action === 'scam') {
                action = 'scamm';
            } else if (action === 'jumpscare') {
                action = 'jumpscar';
            } else if (action === 'scare') {
                action = 'scar';
            } else if (action === 'frame') {
                action = 'fram';
            } else if (action === 'pat') {
                util.safeDelete(message);
                util.sendMessage(message.channel, `${message.member.displayName} pats <@${user.id}>! ***pat pat***\n${headpats[Math.floor(Math.random() * headpats.length)]}`)
                return;
            }

            playNoiseInVoiceChannel(user.voice.channel, message);
            util.sendMessage(message.channel, `<@${user.id}>, ${message.member.displayName} ${action}ed you!`);
        }
        util.safeDelete(message);

    }
}

function playNoiseInVoiceChannel(voiceChannel, message) {
    if (!voiceChannel) {
        return;
    }
    try {
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
    } catch (error) {
        console.log(error);
    }
}

