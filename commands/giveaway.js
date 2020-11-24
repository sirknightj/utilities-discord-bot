const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const Discord = require('discord.js');

module.exports = {
    name: ['giveaway'],
    description: "Randomly selects 3 unique winners from everyone who has tickets. Requires ADMINISTRATOR.",
    usage: ``,
    requiredPermissions: 'ADMINISTRATOR',

    execute(bot, message, args) {
        var allStats = {};
        const fileLocation = `${config.resources_folder_file_path}stats.json`;

        if (fs.existsSync(fileLocation)) {
            allStats = jsonFile.readFileSync(fileLocation);
        } else {
            util.sendTimedMessage(message.channel, "stats.json has not been properly configured.");
            return;
        }

        const guildStats = allStats[message.guild.id];
        var winners = [];
        var participants = "";
        var participantCounter = 0;
        let toDo = true;

        let guildMemberIDs = Object.keys(guildStats);
        guildMemberIDs.sort((o1, o2) => {
            return (guildStats[o2].tickets || 0) - (guildStats[o1].tickets || 0)
        });

        try {
            for (let i = 0; i < 3; i++) {
                let totalTickets = 1;
                for (var userIDs of guildMemberIDs) {
                    if (!winners || !winners.includes(userIDs)) {
                        totalTickets += (guildStats[userIDs].tickets || 0);
                    }

                    if (toDo && guildStats[userIDs].tickets) {
                        participantCounter++;
                        participants += `${util.getUserFromMention(message, userIDs).displayName}: ${guildStats[userIDs].tickets}\n`
                    }
                }

                if (participantCounter < 3) {
                    util.sendMessage(`There are not enough participants to run the giveaway.\nHere is the participant list:\n${participants}`);
                    return;
                }

                toDo = false;

                const winnerThreshold = Math.floor(Math.random() * totalTickets);

                let sum = 0;
                for (var userIDs of guildMemberIDs) {
                    if (!winners || !winners.includes(userIDs)) {
                        if (guildStats[userIDs].tickets) {
                            sum += (guildStats[userIDs].tickets || 0);
                            if (sum >= winnerThreshold) {
                                winners.push(userIDs);
                                break;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    
        let winner1 = util.getUserFromMention(message, winners[0]);
        let winner2 = util.getUserFromMention(message, winners[1]);
        let winner3 = util.getUserFromMention(message, winners[2]);
        
        util.sendMessage(message.channel, new Discord.MessageEmbed()
            .setColor(Colors.DARK_GREEN)
            .setTitle('And the winner is...')
            .setDescription(`1st Place: ${winner1.displayName}\n2nd Place: ${winner2.displayName}\n3rd Place: ${winner3.displayName}`)
            .addField('Participants:', participants)
            .setFooter(`Held on ${new Date(Date.now())}`)
        );
    }
}