const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Discord = require("discord.js");
const Colors = require('../resources/colors.json')

module.exports = {
    name: ['stats', 'points', 'mypoints', 'mystats', 'balance', 'checkbalance', 'coins', 'profile', 'bal'],
    description: 'Tells you how many points you have.',
    usage: `(optional: user)`,

    execute(bot, message, args, channel) {
        var target;
        if (args.length != 0) {
            target = util.getUserFromMention(message, args.join(' '));
        } else {
            target = message.member;
        }

        util.safeDelete(message);
        if (!target) {
            util.sendTimedMessage(channel || message.channel, `Error: Cannot find user ${args.join(' ')}`);
            return;
        }

        try {
            var allStats = {};
            const fileLocation = `${config.resources_folder_file_path}stats.json`;

            if (fs.existsSync(fileLocation)) {
                allStats = jsonFile.readFileSync(fileLocation);
            } else {
                util.sendTimedMessage(channel || message.channel, "stats.json has not been properly configured.");
                return;
            }

            const userStats = (allStats[message.guild.id])[target.user.id];

            if (!userStats) {
                util.sendTimedMessage(channel || message.channel, `${target.displayName} has 0 points.`);
                return;
            }

            let info = [];
            let properties = Object.keys(userStats);
            for (var i = 0; i < properties.length; i++) {
                if (properties[i] !== 'last_message' && properties[i] !== 'vc_session_started') {
                    if (properties[i] === 'time_spent_in_vc') {
                        info.push(`${properties[i]}: ${util.toFormattedTime(userStats[properties[i]])}`);
                    } else if (properties[i] === 'daily_reward_last_claimed') {
                        info.push(`${properties[i]}: ${new Date(userStats[properties[i]])}`);
                     }else {
                        info.push(`${properties[i]}: ${util.addCommas(userStats[properties[i]])}`);
                    }
                }
            }

            util.sendTimedMessage(message.channel, new Discord.MessageEmbed()
                .setColor(Colors.YELLOW)
                .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                .addField('Point Insights', info)
                .setFooter(`This message will be automatically deleted in ${config.longer_delete_delay / 1000} seconds.`), config.longer_delete_delay);
        } catch (err) {
            util.sendTimedMessage(channel || message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}