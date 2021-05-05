const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const Discord = require('discord.js');

const statNames = ["points", "tickets", "coins", '...'];

module.exports = {
    name: ['removestats', 'removepoints'],
    description: "Removes a user's points.",
    usage: `<user/everyone> <number/all> <${getAllowedInputs()}> (optional: delete entry? true/false)`,
    requiresArgs: true,
    requiredPermissions: 'KICK_MEMBERS',

    execute(bot, message, args) {
        if (args.length < 3) {
            throw 'Not enough arguments.';
        }

        let statName = args.pop();
        let deleteEntry = false;

        if (statName.toLowerCase() === 'true') {
            statName = args.pop();
            deleteEntry = true;
        }

        statName = statName.toLowerCase();

        let everyone = false;
        let removeAllPoints = false;
        let arg2 = args.pop();
        let pointsToRemove;

        if (arg2) {
            if (arg2.toLowerCase() === 'all') {
                removeAllPoints = true;
            } else {
                pointsToRemove = util.convertNumber(arg2);
                if (pointsToRemove <= 0) {
                    throw `\`${arg2}\` is an invalid number!`;
                }
            }
        } else {
            throw 'Not enough arguments.';
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
                if (!statNames.includes(statName)) {
                    throw `\`${statName}\` is not a valid stat name.`;
                }

                let sortedArray = [];
                let counter = 0;
                let logs = "";
                let actionPerformed = false;
                const maxLogsPerMessage = 35;

                for (var userIDs of Object.keys(guildStats)) {
                    sortedArray.push(userIDs);
                }

                sortedArray.sort((o1, o2) => (guildStats[o2][statName] || 0) - (guildStats[o1][statName] || 0));

                for (userID of sortedArray) {
                    if (guildStats[userID][statName]) {
                        if (deleteEntry) {
                            logs += `${util.getUserFromMention(message, userID).displayName}: ${util.addCommas(guildStats[userID][statName])} » Wiped\n`;
                            delete guildStats[userID][statName];
                        } else if (removeAllPoints) {
                            logs += `${util.getUserFromMention(message, userID).displayName}: ${util.addCommas(guildStats[userID][statName])} » 0\n`;
                            guildStats[userID][statName] = 0;
                        } else {
                            let newPoints = Math.round((guildStats[userID][statName] - pointsToRemove) * 100) / 100;
                            logs += `${util.getUserFromMention(message, userID).displayName}: ${util.addCommas(guildStats[userID][statName])} » ${newPoints < 0 ? 0 : util.addCommas(newPoints)}\n`;
                            guildStats[userID][statName] = newPoints < 0 ? 0 : newPoints;
                        }
                        if (!actionPerformed) {
                            actionPerformed = true;
                        }
                        counter++;
                    }
                    if (counter >= maxLogsPerMessage) {
                        util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
                            .setTitle(`${util.capitalizeFirstLetter(statName)} Stats Modification`)
                            .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                            .setColor(Colors.RED_RED)
                            .setDescription(`${util.fixNameFormat(message.member.displayName)} has ${deleteEntry ? "deleted" : "removed"} ${removeAllPoints ? "all" : pointsToRemove} ${statName} from everyone!\n\n**${util.capitalizeFirstLetter(statName)} Transactions**\n${util.fixNameFormat(logs)}`)
                            .setTimestamp());
                        counter = 0;
                        logs = "";
                    }
                }
                if (!actionPerformed) {
                    util.sendMessage(message.channel, `Since nobody has any ${statName}, the leaderboards were not modified.`);
                } else if (logs) {
                    util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
                        .setTitle(`${statName.charAt(0).toUpperCase() + statName.slice(1)} Stats Modification`)
                        .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                        .setColor(Colors.RED_RED)
                        .setDescription(`${util.fixNameFormat(message.member.displayName)} has ${deleteEntry ? "deleted" : "removed"} ${removeAllPoints ? "all" : pointsToRemove} ${statName} from everyone!\n\n**${util.capitalizeFirstLetter(statName)} Transactions**\n${logs.replace(/_/g, '\\_')}`)
                        .setTimestamp());
                    util.sendMessage(message.channel, "Done.");
                }
            } else {
                if (!target) {
                    util.sendTimedMessage(message.channel, `Error: Cannot find user ${args.join(' ')}`);
                    return;
                }

                if (!util.getStats(message, target, statName) && !statNames.includes(statName)) {
                    throw "They don't have any of that stat.";
                }

                let oldPoints = guildStats[target.id][statName];
                let newPoints = 0;
                if (!removeAllPoints) {
                    newPoints = Math.round((guildStats[target.id][statName] - pointsToRemove) * 100) / 100;
                } else {
                    pointsToRemove = guildStats[target.id][statName];
                }
                guildStats[target.id][statName] = newPoints;

                if (deleteEntry) {
                    delete guildStats[target.id][statName];
                }

                additionalInfo = [`${util.capitalizeFirstLetter(statName)}: ${util.addCommas(oldPoints)} » ${util.addCommas(newPoints ? newPoints : 0)}`];

                let pointsAndCoinsToRemove = 0;
                for (let i = 0; i < config.point_earnings.length; i++) {
                    if (statName === config.point_earnings[i][0]) {
                        pointsAndCoinsToRemove = config.point_earnings[i][1];
                        break;
                    }
                }

                if (pointsAndCoinsToRemove) {
                    let prevPoints = guildStats[target.id]["points"];
                    guildStats[target.id]["points"] = Math.round((prevPoints - pointsAndCoinsToRemove * pointsToRemove) * 100) / 100;
                    let prevCoins = guildStats[target.id]["coins"];
                    guildStats[target.id]["coins"] = Math.round((prevCoins - pointsAndCoinsToRemove * pointsToRemove) * 100) / 100;
                    additionalInfo.push(`Points: ${util.addCommas(prevPoints)} » ${util.addCommas(guildStats[target.id]["points"])}`,
                                        `Coins: ${util.addCommas(prevCoins)} » ${util.addCommas(guildStats[target.id]["coins"])}`);
                }

                const embed = new Discord.MessageEmbed()
                    .setColor(Colors.GOLD)
                    .setTitle(`Manually Revoked ${util.capitalizeFirstLetter(statName)}`)
                    .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                    .setThumbnail(message.member.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`${util.fixNameFormat(message.member.displayName)}${message.author.bot ? " (bot)" : ""} manually took away ${removeAllPoints ? "all" : util.addCommas(pointsToRemove)} ${statName} from ${util.fixNameFormat(target.displayName)}!`)
                    .addField('Additional Info', additionalInfo)
                    .setTimestamp();

                util.sendMessage(util.getLogChannel(message), embed);
                util.sendMessage(message.channel, "Done.");
                util.sendTimedMessage(message.channel, embed.setFooter(`This message will automatically be deleted in ${config.longer_delete_delay / 1000} seconds.`), config.longer_delete_delay);
            }
            jsonFile.writeFileSync(fileLocation, allStats);
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}

function getAllowedInputs() {
    return statNames.toString().replace(/,/g, '/');
}