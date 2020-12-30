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
    requiredPermissions: 'KICK_MEMBERS',

    execute(bot, message, args) {
        let statName = args.pop();
        statName = statName.toLowerCase();

        if (!statNames.includes(statName)) {
            throw 'Invalid stat name.';
        }

        let pointsToAdd = parseFloat(args.pop());
        if (pointsToAdd <= 0) {
            throw 'Points cannot be negative.';
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

            const embed = new Discord.MessageEmbed()
            .setColor(Colors.GOLD)
            .setTitle(`Manually Awarded ${statName}`)
            .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
            .setThumbnail(message.member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`${util.fixNameFormat(message.member.displayName)}${message.author.bot ? " (bot)" : ""} manually awarded ${util.fixNameFormat(target.displayName)} ${util.addCommas(pointsToAdd)} ${statName}!`)
            .addField('Additional Info', `${util.capitalizeFirstLetter(statName)}: ${util.addCommas(result.oldPoints)} » ${util.addCommas(result.newPoints)}`)
            .setTimestamp();

            util.sendMessage(util.getLogChannel(message), embed);
            util.sendMessage(message.channel, "Done.");
            util.sendTimedMessage(message.channel, embed.setFooter(`This messsage will automatically be deleted in ${config.longer_delete_delay / 1000} seconds.`), config.longer_delete_delay);
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}

function getAllowedInputs() {
    return statNames.toString().replace(/,/g, '/');
}