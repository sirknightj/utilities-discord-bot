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
    usage: ``,

    execute(bot, message, args) {
        util.safeDelete(message);

        try {
            let LeaderboardEmbed = new Discord.MessageEmbed()
                .setColor("#ffb236")
                .setTitle("Points Leaderboard")
                .setFooter(`This message will be automatically deleted in ${config.userinfo_and_myperms_delete_delay / 1000} seconds.`);

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
                if (userIDs === message.author.id) {
                    pointBoard += '**';
                }
                pointBoard += `${message.guild.members.cache.get(userIDs).displayName}: ${guildStats[userIDs].points} points`;
                if (userIDs === message.author.id) {
                    pointBoard += '**';
                }
                pointBoard += '\n';

                // let logChannel = util.getLogChannel(message);
                // let target = message.guild.members.cache.get(userIDs);

                // if (guildStats[userIDs].vc_session_started > 0) {
                //     let now = Date.now();
                //     let secondsSpent = Math.floor((now - guildStats[userIDs].vc_session_started) / 1000);
                //     let minutesSpent = Math.floor(secondsSpent / 60);
                //     let pointsToAdd = Math.floor(secondsSpent / 3) / 100; // 1 point per 5 minutes. Equivalent is 0.01 pts per 3 seconds.
                //     let beforePoints = guildStats[userIDs].points;
                //     guildStats[userIDs].points += pointsToAdd;
                //     guildStats[userIDs].points = Math.round(guildStats[userIDs].points * 100) / 100; // Rounds to the nearest 0.01 because of floating-point errors.
        
                //     util.sendMessage(logChannel, new Discord.MessageEmbed()
                //         .setColor(Colors.YELLOW)
                //         .setTitle("Earned Points")
                //         .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                //         .setDescription(`Awarded ${target.displayName} ${pointsToAdd} points for being in a VC for ${Math.floor(minutesSpent / 60)}h ${minutesSpent % 60}m ${secondsSpent % 60}s.`)
                //         .addField('Timestamps', [
                //             `Joined: ${new Date(guildStats[userIDs].vc_session_started)}`,
                //             `Left: ${new Date(now)}`,
                //             `Before: ${beforePoints} points`,
                //             `Now: ${guildStats[userIDs].points} points`
                //         ]));
                //         guildStats[userIDs].vc_session_started = 0;
                // }
            }

            // jsonFile.writeFileSync(fileLocation, allStats);

            LeaderboardEmbed.setDescription(`${pointBoard}`)
            util.sendTimedMessage(message.channel, LeaderboardEmbed, config.longer_delete_delay);
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}