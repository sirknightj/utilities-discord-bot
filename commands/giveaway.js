const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const Discord = require('discord.js');

module.exports = {
    name: ['giveaway'],
    description: "Randomly selects some unique winners from everyone who has tickets. Default: 3 winners.",
    usage: [`(optional: number of winners)`, `<number of winners> <number of times> <user>`],
    // requiredPermissions: 'MANAGE_GUILD',

    execute(bot, message, args) {
        if (args.length === 0 || args.length === 1) {
            this.giveaway(bot, message, args);
        } else {
            this.giveawayStats(bot, message, args);
        }
    },

    giveaway(bot, message, args, stats, getWinners = false) {
        let numberOfWinners = 3;
        if (args[0]) {
            numberOfWinners = util.convertNumber(args[0]);
            if (!numberOfWinners || numberOfWinners < 0 || Math.floor(numberOfWinners) !== numberOfWinners) {
                throw `Invalid quantity: \`${args[0]}\``;
            }
        }
        var allStats = {};
        const fileLocation = `${config.resources_folder_file_path}stats.json`;

        if (stats) {
            allStats = stats;
        } else {
            if (fs.existsSync(fileLocation)) {
                allStats = jsonFile.readFileSync(fileLocation);
            } else {
                util.sendTimedMessage(message.channel, "stats.json has not been properly configured.");
                return;
            }
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

        if (getWinners) {
            return winners;
        }

        let winnerDescription = [];

        for (let i = 1; i <= winners.length; i++) {
            winnerDescription.push(`${ordinalSuffix(i)} Place: ${util.fixNameFormat(util.getUserFromMention(message, winners[i - 1]).displayName)}`);
        }

        util.sendMessage(message.channel, new Discord.MessageEmbed()
            .setColor(Colors.DARK_GREEN)
            .setTitle('And the winner is...')
            .setDescription(winnerDescription)
            .addField(`Participants (${total - 1} total tickets):`, participants)
            .setFooter(`Held on ${new Date(Date.now())}`)
        );
    },

    giveawayStats(bot, message, args) {
        if (args.length !== 3) {
            throw 'Incorrect number of arguments!';
        }

        let numberOfWinners = util.convertNumber(args[0]);
        if (!numberOfWinners || numberOfWinners < 0 || Math.floor(numberOfWinners) !== numberOfWinners) {
            throw `Invalid number of winners: \`${args[0]}\``;
        }

        let numberOfTimes = util.convertNumber(args[1]);
        if (!numberOfTimes || numberOfTimes < 0 || Math.floor(numberOfTimes) !== numberOfTimes) {
            throw `Invalid number of times: \`${args[1]}\``;
        }

        if (numberOfTimes > 100001) {
            throw 'That is too many times.';
        }

        let target = util.getUserFromMention(message, args[2]);
        if (!target) {
            throw `Invalid user: \`${args[2]}\``;
        }

        let allStats;
        const fileLocation = `${config.resources_folder_file_path}stats.json`;

        if (fs.existsSync(fileLocation)) {
            allStats = jsonFile.readFileSync(fileLocation);
        } else {
            util.sendTimedMessage(message.channel, "stats.json has not been properly configured.");
            return;
        }

        util.sendMessage(message.channel, 'Performing simulations...');

        let winnerMap = new Map();
        for (let i = 0; i < numberOfTimes; i++) {
            let winners = this.giveaway(bot, message, [args[0]], allStats, true);
            let position = winners.indexOf(target.id);

            if (winnerMap[position]) {
                winnerMap[position]++;
            } else {
                winnerMap[position] = 1;
            }
        }

        let outputArr = [];

        for (let i = -1; i < numberOfWinners; i++) {
            outputArr.push(`${i === -1 ? 'Did not win' : `${ordinalSuffix(i + 1)} place`}: ${util.addCommas(winnerMap[i])}`);
        }

        util.sendMessage(message.channel, new Discord.MessageEmbed()
            .setTitle('Giveaway Statistics!')
            .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`Simulated \`${config.prefix}giveaway ${args[0]}\` ${args[1]} time${args[1] === 1 ? '' : 's'} for user ${util.fixNameFormat(target.displayName)}.`)
            .addField('Results', outputArr)
            .setColor(Colors.MEDIUM_GREEN)
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