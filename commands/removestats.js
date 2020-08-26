const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const Discord = require('discord.js');

module.exports = {
    name: ['removestats', 'removepoints', 'subtractpoints', 'minus'],
    description: "Removes a set number of a user's points. Only available to users with the ADMINISTRATOR permission.",
    usage: `<user> <points-to-subtract>`,
    requiredPermissions: 'ADMINISTRATOR',
    hiddenFromHelp: true,

    execute(bot, message, args) {
        let pointsToSub = parseFloat(args.pop());
        if (pointsToSub < 0) {
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
            let result = util.addPoints(message, target, -pointsToSub);

            util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
                .setColor(Colors.GOLD)
                .setTitle("Manually Revoked Points")
                .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`${message.member.displayName} manually took away ${pointsToSub} points from ${target.displayName}!`)
                .addField('Additional Info', [
                    `Before: ${result.oldPoints} points`,
                    `After: ${result.newPoints} points`,
                    `Date Removed: ${new Date(Date.now())}`
                ]));
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}