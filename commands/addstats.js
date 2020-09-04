const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const Discord = require('discord.js');

module.exports = {
    name: ['addstats', 'addpoints'],
    description: "Adds to a user's points. Requires ADMINISTRATOR.",
    usage: `<user> <points-to-add>`,
    requiredPermissions: 'ADMINISTRATOR',

    execute(bot, message, args) {
        let pointsToAdd = parseFloat(args.pop());
        if (pointsToAdd < 0) {
            throw new InvalidUsageException('Points cannot be negative.');
        }

        var target;
        if (args.length != 0) {
            target = util.getUserFromMention(message, args.join(' '));
        } else {
            target = message.member;
        }

        if (!target) {
            util.sendTimedMessage(message.channel, `Error: Cannot find user ${args.join(' ')}`);
            return;
        }

        try {
            let result = util.addPoints(message, target, pointsToAdd);

            util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
                .setColor(Colors.GOLD)
                .setTitle("Manually Awarded Points")
                .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`${message.member.displayName}${message.author.bot ? " (bot)" : ""} manually awarded ${target.displayName} ${pointsToAdd} points!`)
                .addField('Additional Info', [
                    `Before: ${result.oldPoints} points`,
                    `After: ${result.newPoints} points`,
                    `Date Awarded: ${new Date(Date.now())}`
                ]));

        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}