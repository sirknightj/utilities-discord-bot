const util = require('../utilities');
const config = require('../config.json');
const avatar = require('./avatar');

const speeds = new Map([
    ['slow', 1000],
    ['normal', 400],
    ['fast', 100],
    ['instant', 0]]);

module.exports = {
    name: ['annoy', 'bother'],
    description: "Repeatedly joins and leaves the specified voice channel.",
    usage: '(optional: user or "voice channel name") (optional: number-of-times) (optional: slow/normal/fast/instant)',

    execute(bot, message, args) {
        var voiceChannel, speed;
        var times = config.default_bother_amount;

        let lookingFor = args[args.length - 1];
        if (!lookingFor || !speeds.has(lookingFor.toLowerCase())) {
            speed = speeds.get('normal');
        } else {
            speed = speeds.get(lookingFor.toLowerCase());
            args.pop();
        }

        lookingFor = args[args.length - 1];
        if (!isNaN(lookingFor)) {
            times = parseInt(lookingFor);
            args.pop();
        }

        if (times > config.bother_amount_limit) {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "I'm too lazy to bother that many times. Try a smaller number.");
            return;
        }

        // If no argumemnts are left, then that means the user wants the bot to join their voice channel.
        if (!args[0]) {
            voiceChannel = message.member.voice.channel;
            if (!voiceChannel) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `${message.member.displayName}, You must either specify a voice channel, or be in one to use this command.\n${util.getUsage(this, message)}`);
                return;
            }
            // If arguments were passed in, then that means the user wants the bot to join the specified voice channel.
        } else {
            voiceChannel = util.getVoiceChannelFromMention(message, args.join(' ').replace(/['"]+/g, ''));
        }

        if (!voiceChannel) {
            let target = util.getUserFromMention(message, args.join(' '));
            if (!target) {
                throw new InvalidUsageException('Invalid optional: user or "voice channel name" argument.');
            }

            voiceChannel = target.voice.channel;
            if (!voiceChannel) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `${target.displayName} is not in any voice channels right now. Tell them to get in one!`);
                return;
            }
        }

        util.safeDelete(message);
        if (speed > 500) {
            util.sendTimedMessage(message.channel, `${message.content.substring(config.prefix.length, message.content.indexOf(' ')).toLowerCase()}ing ${voiceChannel.name} ${times} times...`);
        }
        try {
            var interval = setInterval(() => {
                try {
                    voiceChannel.join().then(
                        setTimeout(() => {
                            voiceChannel.leave()
                        }, speed));
                } catch (err) {
                    console.log(err.message);
                }
            }, 2.1 * speed);

            setTimeout(() => clearInterval(interval), speed * (2.1 * times + 0.9));
        } catch (err) {
            console.log(err.stack);
        }
    }
}