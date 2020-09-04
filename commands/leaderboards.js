const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json')

//Set up the embed for the leaderboard, as it looks cluttered without it.

module.exports = {
    name: ['leaderboards', 'leaderboard', 'pointtotals'],
    description: 'Gives the full list of points.',
    usage: `(optional: ${getAllowedInputs()})`,

    execute(bot, message, args) {
        util.safeDelete(message);

        try {
            let LeaderboardEmbed = new Discord.MessageEmbed()
                .setColor("#ffb236")
                .setFooter(`This message will be automatically deleted in ${config.longer_delete_delay / 1000} seconds.`);

            var allStats = {};
            const fileLocation = `${config.resources_folder_file_path}stats.json`;

            if (fs.existsSync(fileLocation)) {
                allStats = jsonFile.readFileSync(fileLocation);
            } else {
                util.sendTimedMessage(message.channel, "stats.json has not been properly configured.");
                return;
            }

            const guildStats = allStats[message.guild.id];
            let sortedArray = [];

            for (var userIDs of Object.keys(guildStats)) {
                sortedArray.push(userIDs);
            }

            let keyword;
            if (args[0]) {
                keyword = args[0];
            } else {
                keyword = 'points';
            }

            sortedArray.sort((o1, o2) => (guildStats[o2][keyword] || 0) - (guildStats[o1][keyword] || 0));

            let pointBoard = ""; // the leaderboard to print
            let position = 1; // the current position of the leaderboard
            let previousPoints = -1; // if there is a tie, this is the value of the tie
            let previousPosition = 0; // if there is a tie, how many people have the same ranking

            for (userIDs of sortedArray) {
                let guildMember = message.guild.members.cache.get(userIDs);
                if (guildMember) {
                    if ((guildStats[userIDs][keyword] || 0) > 0) {
                        if (previousPoints === guildStats[userIDs][keyword]) {
                            previousPosition++;
                        } else {
                            previousPosition = 0;
                            previousPoints = guildStats[userIDs][keyword];
                        }
                        pointBoard += `${position - previousPosition}. `;
                    }
                    if (userIDs === message.author.id) {
                        pointBoard += '**';
                    }
                    if ((guildStats[userIDs][keyword] || 0) > 0 || userIDs == message.author.id) {
                        pointBoard += `${guildMember.displayName}: ${guildStats[userIDs][keyword] || 0} ${(keyword === 'points') ? 'pts' : keyword}`;
                    }
                    if (userIDs === message.author.id) {
                        pointBoard += '**';
                    }
                    position++;
                    pointBoard += '\n';
                } else {
                    let pointsHad = guildStats[userIDs].points;
                    util.deleteEntryWithUserID(message, userIDs);
                    util.sendTimedMessage(message.channel, `stats.json has been updated. User ID ${userIDs} is no longer in the discord, and so, they have been removed from the file. They had ${pointsHad} points.`);
                }
            }
            LeaderboardEmbed.setTitle(`${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Leaderboard`);
            LeaderboardEmbed.setDescription(`${pointBoard.replace(/_/g, "\\_")}`);
            util.sendTimedMessage(message.channel, LeaderboardEmbed, config.longer_delete_delay);
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
};

function getAllowedInputs() {
    let output = "points/";
    for (var i = 0; i < config.point_earnings.length; i++) {
        output += config.point_earnings[i][0];
        if (i !== config.point_earnings.length - 1) {
            output += "/";
        }
    }
    return output;
}