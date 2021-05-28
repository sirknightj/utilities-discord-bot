const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ['leaderboards', 'leaderboard', 'scoreboard', 'pointtotals', 'lb', 'l', 'lbs'],
    description: 'Gives the full list of points.',
    usage: `(optional: ${getAllowedInputs()})`,

    async execute(bot, message, args) {
        util.safeDelete(message);

        try {
            let LeaderboardEmbed = new Discord.MessageEmbed()
                .setColor("#ffb236")

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
            let isVC = false;
            if (args[1]) {
                args[0] = args.join('_');
            }
            if (args[0]) {
                args[0] = args[0].toLowerCase()
                if (args[0] === 'vc') {
                    keyword = 'time_spent_in_vc';
                } else if (args[0] === 'messages' || args[0] === 'msgs' || args[0] === 'msg') {
                    keyword = 'participating_messages';
                } else if (args[0] === 'streaks') {
                    keyword = 'daily_rewards_streak';
                } else if (args[0] === 'ticket') {
                    keyword = 'tickets';
                } else if (args[0] === 'in_vc' || args[0] === 'vc_session') {
                    keyword = 'vc_session_started';
                    isVC = true;
                } else {
                    keyword = args[0];
                }
            } else {
                keyword = 'points';
            }

            sortedArray.sort((o1, o2) => (guildStats[o2][keyword] || 0) - (guildStats[o1][keyword] || 0));

            let myPosition = -1;
            let position = 1; // the current position of the leaderboard
            let previousPoints = -1; // if there is a tie, this is the value of the tie
            let previousPosition = 0; // if there is a tie, how many people have the same ranking
            let isTime = keyword === 'time_spent_in_vc';
            let isDate = keyword === 'daily_reward_last_claimed' || keyword === 'vc_session_started';
            let wantTotal = keyword === 'tickets';
            wantTotal = true;
            let total = 0;
            let toDisplay = [];
            let myDisplayedPosition = -1;

            for (userIDs of sortedArray) {
                let pointBoard = ""; // the leaderboard to print
                let guildMember = message.guild.members.cache.get(userIDs);
                if (guildMember) {
                    if ((guildStats[userIDs][keyword] || 0) !== 0) {
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
                    if ((guildStats[userIDs][keyword] || 0) !== 0 || userIDs == message.author.id) {
                        if (isTime) {
                            pointBoard += `${util.fixNameFormat(guildMember.displayName)}: ${util.toFormattedTime((guildStats[userIDs][keyword] || 0))}`;
                        } else if (isVC) {
                            if ((guildStats[userIDs][keyword] || 0) !== 0) {
                                pointBoard += `${util.fixNameFormat(guildMember.displayName)}: ${util.toFormattedTime(Date.now() - guildStats[userIDs][keyword])}`;
                            } else {
                                // The user is not in VC.
                                pointBoard += `${util.fixNameFormat(guildMember.displayName)}: ${util.toFormattedTime(0)}`;
                            }
                        } else if (isDate) {
                            if ((guildStats[userIDs][keyword] || 0) !== 0) {
                                pointBoard += `${util.fixNameFormat(guildMember.displayName)}: ${(new Date(guildStats[userIDs][keyword]))}`;
                            } else {
                                // The user has a 0 date.
                                pointBoard += `${util.fixNameFormat(guildMember.displayName)}: n/a`;
                            }
                        } else {
                            pointBoard += `${util.fixNameFormat(guildMember.displayName)}: ${util.addCommas(guildStats[userIDs][keyword] || 0)}`;
                        }
                        if (wantTotal) {
                            total += guildStats[userIDs][keyword] || 0;
                        }
                    }
                    if (userIDs === message.author.id) {
                        pointBoard += '**';
                        if ((guildStats[userIDs][keyword] || 0) !== 0) {
                            myDisplayedPosition = position - previousPosition;
                            myPosition = toDisplay.length + 1;
                        }
                    }
                    if ((guildStats[userIDs][keyword] || 0) !== 0 || userIDs == message.author.id) {
                        position++;
                        toDisplay.push(pointBoard);
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
            if (total) {
                if (isTime) {
                    total = util.toFormattedTime(total);
                } else if (isDate) {
                    total = 0
                } else {
                    total = util.addCommas(Math.round(total * 100) / 100);
                }
            }

            let currentPage = 1;
            let lastPage = Math.ceil(toDisplay.length / PAGE_SIZE);

            let descriptionStart = `${wantTotal && total ? `${total} total ${util.fixNameFormat(keyword)}\n` : ''}\n`;
            let footerEnd = `/${util.addCommas(lastPage)} • You are ${myDisplayedPosition === -1 ? 'unranked' : `position ${util.addCommas(myDisplayedPosition)}`}.\nThis message will be automatically deleted after ${config.longest_delete_delay / 1000} seconds of inactivity.`;

            let startingPage = 1
            if (myPosition !== -1) {
                startingPage = Math.ceil(myPosition / PAGE_SIZE);
            }

            LeaderboardEmbed.setDescription(`${descriptionStart}${getPage(toDisplay, startingPage).join('\n')}`)
            .setAuthor(message.member.displayName, message.author.displayAvatarURL({ dynamic: true }))
            .setFooter(`Page ${util.addCommas(currentPage)}${footerEnd}`);

            if (currentPage === lastPage) { // there is only 1 page
                util.sendTimedMessage(message.channel, LeaderboardEmbed, config.longest_delete_delay);
                return;
            }

            util.sendMessage(message.channel, LeaderboardEmbed)
                .then((msg) => {
                    msg.react('⏪')
                    .then(() => {
                        msg.react('⬅️');
                    })
                    .then(() => {
                        msg.react('➡️');
                    })
                    .then(() => {
                        msg.react('⏩');
                    })
                    .then(() => {
                        const collector = msg.createReactionCollector((reaction, user) => {
                            if (reaction.emoji.name === '⏪' || reaction.emoji.name === '⬅️' || reaction.emoji.name === '➡️' || reaction.emoji.name === '⏩') {
                                return user.id === message.member.id;
                            }
                            return false;
                        }, {idle: TIMEOUT, dispose: true});

                        collector.on('collect', (reaction, user) => {
                            reaction.users.remove(reaction.users.cache.filter(user => user.id !== msg.author.id).first().id)
                            switch (reaction.emoji.name) {
                                case '⏪':
                                    currentPage = 1;
                                    break;
                                case '⬅️':
                                    if (currentPage > 1) {
                                        currentPage--;
                                    }
                                    break;
                                case '➡️':
                                    if (currentPage < lastPage) {
                                        currentPage++;
                                    }
                                    break;
                                case '⏩':
                                    currentPage = lastPage;
                                    break;
                                default:
                                    return;
                            }
                            msg.edit(LeaderboardEmbed
                                .setDescription(`${descriptionStart}${getPage(toDisplay, currentPage).join('\n')}`)
                                .setFooter(`Page ${util.addCommas(currentPage)}${footerEnd}`)
                            );
                        });

                        collector.on('end', () => {
                            msg.delete();
                        });
                    });
                });

        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
};

const PAGE_SIZE = 30; // number of entries to put on one page
const TIMEOUT = util.longest_delete_delay;

function getPage(array, page) {
    return array.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

function getAllowedInputs() {
    let output = "points/vc/messages";
    if (config.point_earnings) {
        output += "/";
    }
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