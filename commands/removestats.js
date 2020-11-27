const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const Discord = require('discord.js');

const statNames = ["points", "tickets", "coins"];

module.exports = {
    name: ['removestats', 'removepoints'],
    description: "Removes a user's points. Requires ADMINISTRATOR.",
    usage: `<user/everyone> <points-to-remove/all> <${getAllowedInputs()}> (optional: delete entry: true/false)`,
    requiredPermissions: 'ADMINISTRATOR',

    execute(bot, message, args) {
        let statName = args.pop();
        let deleteEntry = false;

        if (statName.toLowerCase() === 'true') {
            statName = args.pop();
            deleteEntry = true;
        }

        statName = statName.toLowerCase();

        if (!statNames.includes(statName)) {
            throw new InvalidUsageException('Invalid stat name.');
        }

        let everyone = false;
        let removeAllPoints = false;
        let arg2 = args.pop();
        let pointsToRemove;

        if (arg2) {
            if (arg2.toLowerCase() === 'all') {
                removeAllPoints = true;
            } else {
                pointsToRemove = parseFloat(arg2);
                if (pointsToRemove <= 0) {
                    throw new InvalidUsageException('Points cannot be negative.');
                }
            }
        } else {
            throw new InvalidUsageException('Not enough arguments.');
        }

        if (deleteEntry && !removeAllPoints) {
            util.sendMessage(message.channel, "If `delete entry` is true, then `points-to-remove` must be `all`.");
            return;
        }

        var allStats = {};
        const fileLocation = `${config.resources_folder_file_path}stats.json`;

        if (fs.existsSync(fileLocation)) {
            allStats = jsonFile.readFileSync(fileLocation);
        } else {
            util.sendTimedMessage(message.channel, "stats.json has not been properly configured.");
            return;
        }

        var target;
        if (args.length != 0) {
            if (args[0].toLowerCase() === 'everyone') {
                everyone = true;
            } else {
                target = util.getUserFromMention(message, args.join(' '));
            }
        } else {
            target = message.member;
        }

        const guildStats = allStats[message.guild.id];

        try {
            if (everyone) {
                let sortedArray = [];
                let counter = 0;
                let names = "";
                let logs = "";
                let logsAfter = ""
                let actionPerformed = false;
                const maxLogsPerMessage = 32;

                for (var userIDs of Object.keys(guildStats)) {
                    sortedArray.push(userIDs);
                }

                sortedArray.sort((o1, o2) => (guildStats[o2][statName] || 0) - (guildStats[o1][statName] || 0));

                for (userID of sortedArray) {
                    if (guildStats[userID][statName]) {
                        names += util.getUserFromMention(message, userID).displayName + "\n";
                        if (deleteEntry) {
                            logs += `${util.addCommas(guildStats[userID][statName])}\n`;
                            logsAfter += "Wiped\n";
                            delete guildStats[userID][statName];
                        } else if (removeAllPoints) {
                            logs += `${util.addCommas(guildStats[userID][statName])}\n`;
                            logsAfter = "0\n";
                            guildStats[userID][statName] = 0;
                        } else {
                            let newPoints = Math.round((guildStats[userID][statName] - pointsToRemove) * 100) / 100;
                            logs += `${util.addCommas(guildStats[userID][statName])}\n`;
                            logsAfter += `${newPoints < 0 ? 0 : util.addCommas(newPoints)}\n`
                            guildStats[userID][statName] = newPoints < 0 ? 0 : newPoints;
                        }
                        if (!actionPerformed) {
                            actionPerformed = true;
                        }
                        counter++;
                    }
                    if (counter >= maxLogsPerMessage) {
                        util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
                            .setTitle(`${statName.charAt(0).toUpperCase() + statName.slice(1)} Stats Modification`)
                            .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                            .setColor(Colors.RED_RED)
                            .setDescription(`${message.member.displayName} has ${deleteEntry ? "deleted" : "removed"} ${removeAllPoints ? "all" : util.addCommas(pointsToRemove)} ${statName} from everyone!`)
                            .addField('Name', names.replace(/_/g, '\\_'), true)
                            .addField(`Before`, logs, true)
                            .addField(`After`, logsAfter, true)
                            .setTimestamp());
                        counter = 0;
                        logs = "";
                        logsAfter = "";
                        names = "";
                    }
                }
                if (!actionPerformed) {
                    util.sendMessage(message.channel, `Since nobody has any ${statName}, the leaderboards were not modified.`);
                } else if (logs) {
                    util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
                        .setTitle(`${statName.charAt(0).toUpperCase() + statName.slice(1)} Stats Modification`)
                        .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                        .setColor(Colors.RED_RED)
                        .setDescription(`${message.member.displayName} has ${deleteEntry ? "deleted" : "removed"} ${removeAllPoints ? "all" : pointsToRemove} ${statName} from everyone!`)
                        .addField('Name', names.replace(/_/g, '\\_'), true)
                        .addField(`Before`, logs, true)
                        .addField(`After`, logsAfter, true)
                        .setTimestamp());
                    util.sendMessage(message.channel, "Done.");
                }
                jsonFile.writeFileSync(fileLocation, allStats);
            } else {
                if (!target) {
                    util.sendTimedMessage(message.channel, `Error: Cannot find user ${args.join(' ')}`);
                    return;
                }
                let result = util.addStats(message, target, -pointsToRemove, statName);
                util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
                    .setColor(Colors.GOLD)
                    .setTitle(`Manually Revoked ${statName}`)
                    .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`${message.member.displayName}${message.author.bot ? " (bot)" : ""} manually took away ${target.displayName} ${util.addCommas(pointsToRemove)} ${statName}!`)
                    .addField('Additional Info', [
                        `Before: ${result.oldPoints} ${statName}`,
                        `After: ${result.newPoints} ${statName}`,
                        `Date Revoked: ${new Date(Date.now())}`
                    ]));
                util.sendMessage(message.channel, "Done.");
            }
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}

function getAllowedInputs() {
    return statNames.toString().replace(/,/g, '/');
}