const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const Discord = require('discord.js');

const statNames = ["points", "tickets", "coins"];

module.exports = {
    name: ['addstats', 'addpoints'],
    description: "Adds to a user's points. Requires ADMINISTRATOR.",
    usage: `<user> <points-to-add> <${getAllowedInputs()}>`,
    requiredPermissions: 'ADMINISTRATOR',

    execute(bot, message, args) {
        let statName = args.pop();
        statName = statName.toLowerCase();

        if (!statNames.includes(statName)) {
            throw new InvalidUsageException('Invalid stat name.');
        }

        let pointsToAdd = parseFloat(args.pop());
        if (pointsToAdd <= 0) {
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
            let result = util.addStats(message, target, pointsToAdd, statName);

            util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
                .setColor(Colors.GOLD)
                .setTitle(`Manually Awarded ${statName}`)
                .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`${message.member.displayName}${message.author.bot ? " (bot)" : ""} manually awarded ${target.displayName} ${pointsToAdd} ${statName}!`)
                .addField('Additional Info', [
                    `Before: ${result.oldPoints} ${statName}`,
                    `After: ${result.newPoints} ${statName}`,
                    `Date Awarded: ${new Date(Date.now())}`
                ]));
            util.sendMessage(message.channel, "Done.");
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}

function getAllowedInputs() {
    return statNames.toString().replace(/,/g, '/');
}