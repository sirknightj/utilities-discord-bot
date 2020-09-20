const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json')

//Set up the embed for the leaderboard, as it looks cluttered without it.

module.exports = {
    name: ['warnings', 'warninglog', 'warnlist'],
    description: 'Lists everyone who has been warned.',
    usage: `(optional: user)`,
    requiredPermissions: 'KICK_MEMBERS',

    execute(bot, message, args) {
        util.safeDelete(message);

        try {
            let LeaderboardEmbed = new Discord.MessageEmbed()
                .setColor("#ffb236")
                .setFooter(`This message will be automatically deleted in ${config.longer_delete_delay / 1000} seconds.`);

            var allStats = {};
            const fileLocation = `${config.resources_folder_file_path}warnings.json`;

            if (fs.existsSync(fileLocation)) {
                allStats = jsonFile.readFileSync(fileLocation);
            } else {
                util.sendTimedMessage(message.channel, "warnings.json has not been properly configured.");
                return;
            }

            const guildStats = allStats[message.guild.id];

            if (args) { // Get one user's warning history.
                let target = util.getUserFromMention(args.join(' '));
                if (!target) {
                    util.sendTimedMessage(message.channel, `Error: could not find user ${args.join(' ')}`);
                    return;
                }

                if (Object.keys(guildStats).contains(target.user.id)) {
                    let warningHistory = "";
                    for (var dates of Object.keys(guildStats[target.user.id])) {
                        warningHistory += `${new Date(dates)}: ${guildStats[target.user.id][dates]}\n`;
                    }
                    LeaderboardEmbed.setTitle(`${target.displayName}'s Warning History`);
                    LeaderboardEmbed.setDescription(`${pointBoard.replace(/_/g, "\\_")}`);
                    util.sendTimedMessage(message.channel, LeaderboardEmbed, config.longer_delete_delay);
                } else {
                    util.sendTimedMessage(message.channel, `${target.displayname} has no warning history.`);
                }
                return;
            }

            let sortedArray = [];

            for (var userIDs of Object.keys(guildStats)) {
                sortedArray.push(userIDs);
            }

            sortedArray.sort((o1, o2) => (Object.keys(guildStats[o2]).length || 0) - (Object.keys(guildStats[o1]).length || 0));

            let pointBoard = ""; // the leaderboard to print

            for (userIDs of sortedArray) {
                let guildMember = message.guild.members.cache.get(userIDs);
                if (guildMember) {
                    if (userIDs === message.author.id) {
                        pointBoard += '**';
                    }
                    if (Object.keys(guildStats[userIDs]) || userIDs == message.author.id) {
                        pointBoard += `${guildMember.displayName}: ${util.addCommas(Object.keys(guildStats[userIDs]).length || 0)} warnings`;
                    }
                    if (userIDs === message.author.id) {
                        pointBoard += '**';
                    }
                    position++;
                    pointBoard += '\n';
                } else {
                    let warningsHad = guildStats[userIDs].points;
                    let warningHistory = "";
                    for (var dates of Object.keys(guildStats[target.user.id])) {
                        warningHistory += `${new Date(dates)}: ${guildStats[target.user.id][dates]}\n`;
                    }
                    util.sendMessage(util.getLogChannel(message), `${target.user.id}'s Warning History before leaving:\n${warningHistory}`);
                    delete guildStats[userIDs];
                    util.sendTimedMessage(message.channel, `warnings.json has been updated. User ID ${userIDs} is no longer in the discord, and so, they have been removed from the file. They had ${warningsHad} points.`);
                }
            }
            LeaderboardEmbed.setTitle('Warnings Issued');
            LeaderboardEmbed.setDescription(`${pointBoard.replace(/_/g, "\\_")}`);
            util.sendTimedMessage(message.channel, LeaderboardEmbed, config.longer_delete_delay);
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching warnings.json.")
            console.log(err);
        }
    }
};