const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Discord = require('discord.js');
const LeaderboardEmbed = new Discord.MessageEmbed()

//Set up the embed for the leaderboard, as it looks cluttered without it.

LeaderboardEmbed.setColor("#ffb236")
LeaderboardEmbed.setTitle("Points Leaderboard")
LeaderboardEmbed.setAuthor("Leaderboard")
LeaderboardEmbed.setFooter(`This message will be automatically deleted in ${config.userinfo_and_myperms_delete_delay / 1000} seconds.`)

module.exports = {
    name: ['leaderboards', 'leaderboard', 'pointtotals'],
    description: 'Gives the full list of points.',
    usage: ``,

    execute(bot, message, args) {
        util.safeDelete(message);

        try {
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

            sortedArray.sort((o1, o2) => guildStats[o2].points - guildStats[o1].points);

            let pointBoard = "";

            for (userIDs of sortedArray) {
                pointBoard += `${message.guild.members.cache.get(userIDs).displayName}: ${guildStats[userIDs].points} points\n`;
            }

            LeaderboardEmbed.setDescription(`${pointBoard}`)
            //util.sendTimedMessage(message.channel, `${pointBoard}\nThis message will be automatically deleted in ${config.userinfo_and_myperms_delete_delay / 1000} seconds.`, config.userinfo_and_myperms_delete_delay);
            util.sendTimedMessage(message.channel, LeaderboardEmbed, config.userinfo_and_myperms_delete_delay);
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}