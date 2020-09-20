const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');
const { format } = require('path');

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
                if (args[0].toLowerCase() === 'vc') {
                    keyword = 'time_spent_in_vc';
                } else if (args[0].toLowerCase() === 'messages') {
                    keyword = 'participating_messages';
                } else {
                    keyword = args[0].toLowerCase();
                }
            } else {
                keyword = 'points';
            }

            sortedArray.sort((o1, o2) => (guildStats[o2][keyword] || 0) - (guildStats[o1][keyword] || 0));

            let pointBoard = ""; // the leaderboard to print
            let position = 1; // the current position of the leaderboard
            let previousPoints = -1; // if there is a tie, this is the value of the tie
            let previousPosition = 0; // if there is a tie, how many people have the same ranking
            let isTime = (keyword === 'time_spent_in_vc');

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
                        if (isTime) {
                            pointBoard += `${guildMember.displayName}: ${util.toFormattedTime((guildStats[userIDs][keyword] || 0))}`
                        } else {
                            pointBoard += `${guildMember.displayName}: ${(guildStats[userIDs][keyword] || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${(keyword === 'points' || keyword === 'participating_messages') ? (keyword === 'points' ? 'pts' : (guildStats[userIDs][keyword] === 1 ? 'msg' : 'msgs')) : keyword}`;
                        }
                    }
                    if (userIDs === message.author.id) {
                        pointBoard += '**';
                    }
                    if ((guildStats[userIDs][keyword] || 0) > 0 || userIDs == message.author.id) {
                        position++;
                        pointBoard += '\n';
                    }
                } else {
                    let pointsHad = guildStats[userIDs].points;
                    util.deleteEntryWithUserID(message, userIDs);
                    util.sendTimedMessage(message.channel, `stats.json has been updated. User ID ${userIDs} is no longer in the discord, and so, they have been removed from the file. They had ${pointsHad} points.`);
                }
            }
            let capitalizedWords = [];
            keyword.replace(/_/g, ' ').split(' ').forEach(word => {
                capitalizedWords.push(word.charAt(0).toUpperCase() + word.slice(1));
            });
            LeaderboardEmbed.setTitle(`${capitalizedWords.join(' ')} Leaderboard`);
            let formattedPrint = pointBoard.replace(/_/g, "\\_");
            let pos = 0, i = 0;
            while (pos < formattedPrint.length) {
                pos = Math.min(formattedPrint.length, getPositionOf(formattedPrint, '\n', 50 * (i + 1)));
                LeaderboardEmbed.setDescription(`${formattedPrint.slice(getPositionOf(formattedPrint, '\n', 50 * i), pos)}`);
                util.sendTimedMessage(message.channel, LeaderboardEmbed, config.longer_delete_delay);
                i++;
            }
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
};

function getAllowedInputs() {
    let output = "points/vc/";
    for (var i = 0; i < config.point_earnings.length; i++) {
        output += config.point_earnings[i][0];
        if (i !== config.point_earnings.length - 1) {
            output += "/";
        }
    }
    return output;
}

function getPositionOf(string, search, number) {
    if (number === 0) {
        return 0;
    }
    return string.split(search, number).join(search).length;
}