const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const Discord = require('discord.js');

module.exports = {
    name: ['giveaway'],
    description: "Randomly selects some unique winners from everyone who has tickets. Default: 3 winners.",
    usage: `(optional: number of winners)`,
    requiredPermissions: 'MANAGE_GUILD',

    execute(bot, message, args) {
        let numberOfWinners = 3;
        if (args[0]) {
            if (/^-?\d+$/.test(args[0])) {
                numberOfWinners = parseInt(args[0]);
            } else {
                throw 'Invalid quantity';
            }
        }
        var allStats = {};
        const fileLocation = `${config.resources_folder_file_path}stats.json`;

        if (fs.existsSync(fileLocation)) {
            allStats = jsonFile.readFileSync(fileLocation);
        } else {
            util.sendTimedMessage(message.channel, "stats.json has not been properly configured.");
            return;
        }

        const guildStats = allStats[message.guild.id];
        let winners = [];
        let participants = "";
        let participantCounter = 0;
        let toDo = true;
        let total = 0;

        let guildMemberIDs = Object.keys(guildStats);
        guildMemberIDs.sort((o1, o2) => {
            return (guildStats[o2].tickets || 0) - (guildStats[o1].tickets || 0)
        });

        try {
            for (let i = 0; i < numberOfWinners; i++) {
                let totalTickets = 1;
                for (var userIDs of guildMemberIDs) {
                    if (!winners || !winners.includes(userIDs)) {
                        totalTickets += (guildStats[userIDs].tickets || 0);
                    }

                    if (toDo && guildStats[userIDs].tickets) {
                        participantCounter++;
                        participants += `${util.fixNameFormat(util.getUserFromMention(message, userIDs).displayName)}: ${guildStats[userIDs].tickets}\n`
                    }
                }

                if (participantCounter < numberOfWinners) {
                    util.sendMessage(message.channel, new Discord.MessageEmbed()
                    .setTitle('Unfortunately...')
                    .setDescription(`There are not enough participants to run the giveaway. There are only ${participantCounter} participants, but ${numberOfWinners} are required.\nHere is the participant list:\n${participants ? util.fixNameFormat(participants) : '_There are no participants._'}`)
                    .setTimestamp());
                    return;
                }
                if (toDo) {
                    toDo = false;
                    total = totalTickets;
                }

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

        let winnerDescription = [];

        for (let i = 1; i <= winners.length; i++) {
            winnerDescription.push(`${ordinalSuffix(i)} Place: ${util.fixNameFormat(util.getUserFromMention(message, winners[i - 1]).displayName)}`);
        }
        
        util.sendMessage(message.channel, new Discord.MessageEmbed()
            .setColor(Colors.DARK_GREEN)
            .setTitle('And the winner is...')
            .setDescription(winnerDescription)
            .addField(`Participants (${total} total tickets):`, participants)
            .setFooter(`Held on ${new Date(Date.now())}`)
        );
    }
}

/**
 * Appends the ordinal suffix to the number.
 * @param {number} number the number whose suffix you want.
 * @returns {string} the number with the ordinal suffix attached. 
 */
function ordinalSuffix(number) {
    let ones = number % 10;
    let exceptions = number % 100;
    if (ones == 1 && exceptions != 11) {
        return number + 'st';
    } else if (ones == 2 && exceptions != 12) {
        return number + 'nd';
    } else if (ones == 3 && exceptions != 13) {
        return number + 'rd';
    } else {
        return number + 'th';
    }
}