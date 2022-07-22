const config = require('../config.json');
const util = require('../utilities');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');
const parse = require('parse-duration')
const daily = require('./daily');

let validTypes = ['daily', 'weekly', 'monthly', 'yearly'];

module.exports = {
    name: ['claimdaily', 'forceclaimdaily'],
    description: 'Claims daily for someone. Duration units must be space-seperated (for example, "1d 12h")',
    usage: "<user> <daily> <duration ago>",
    requiredPermissions: 'MANAGE_MESSAGES',
    requiresArgs: true,

    execute(bot, message, args) {
        if (args.length < 3) {
            throw 'Not enough arguments!';
        }
        let target = util.getUserFromMention(message, args[0]);
        if (!target) {
            throw 'Invalid target: `' + args[0] + '`';
        }

        let daily_type = args[1].toLowerCase();
        if (!validTypes.includes(daily_type)) {
            throw 'Invalid daily type: `' + args[1] + '`. Valid options include ' + validTypes.join(', ') + '.';
        }

        let duration = args.slice(2, args.length).join(' ');
        let durationMillis = parse(duration);
        if (!durationMillis) {
            throw 'Invalid duration: `' + duration + '`.';
        }

        this.confirm(bot, message, args, target, Date.now() - durationMillis, daily_type)
    },

    async confirm(bot, message, args, target, time, daily_type) {
        let confirm = await util.askUser(message.channel, message.member, new Discord.MessageEmbed()
            .setTitle('Confirmation')
            .setColor(Colors.RED)
            .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`You are executing the command \`${config.prefix}${daily_type}\` as if ${target} used it at <t:${Math.round(time / 1000)}:F>`)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp(), config.longest_delete_delay);
        if (confirm) {
            daily.handleDaily(message, daily_type, target, false, time);
        } else {
            util.sendMessage(message.channel, 'Cancelled!');
        }
    }
};