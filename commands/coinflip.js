const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ['coinflip', 'headsortails', 'flipacoin', 'cf'],
    description: 'Flips a coin. You can also challenge a friend!',
    usage: ['', '<user> <bet/all> <heads/tails>', 'stats (optional: user) (optional: dontDelete? false/true)', 'statwipe <user>'],

    execute(bot, message, args) {
        if (args.length === 0) {
            util.sendMessage(message.channel, `I flipped ${this.flip()}!`);
            return;
        }

        if (args[0].toLowerCase() === 'stats') {
            let target = message.member;
            if (args[1]) {
                args.shift();
                target = util.getUserFromMention(message, args.join(' '));
            }
            if (!target) {
                throw `Couldn't find user ${args.join(' ')}.`
            }

            let stats = util.getMemberStats(message, target);
            if (!stats.coinflip_played) {
                util.sendMessage(message.channel, `${util.fixNameFormat(target.displayName)} has not played coinflip yet! Tell them to give it a go!`);
                return;
            }

            util.sendTimedMessage(message.channel, new Discord.MessageEmbed()
                .setTitle(`${util.fixNameFormat(target.displayName)}'s Coinflip Stats`)
                .addField('Coinflip Earnings',
                    [`Total Coins Bet: ${util.addCommas(stats.coins_bet_in_coinflip)}`,
                    `Total Coins Earned: ${util.addCommas(stats.coins_earned_in_coinflip)}`,
                    `Total Coins Lost: ${util.addCommas(stats.coins_lost_in_coinflip)}`,
                    `Net Earnings: ${util.addCommas(stats.coinflip_net_earnings)}`
                    ])
                .addField('Coinflip Winrate',
                    [`Total Plays: ${util.addCommas(stats.coinflip_played)}`,
                    `Wins: ${util.addCommas(stats.coinflip_wins)}`,
                    `Losses: ${util.addCommas(stats.coinflip_losses)}`,
                    `Win rate: ${stats.coinflip_wins ? Math.round(stats.coinflip_wins / stats.coinflip_played * 100 * 100) / 100 : 0}%`
                    ])
                .addField('Streaks',
                    [`Current ${stats.coinflip_winning_streak > stats.coinflip_losing_streak ? "Winning" : "Losing"} Streak: ${util.addCommas(Math.max(stats.coinflip_winning_streak, stats.coinflip_losing_streak))}`,
                    `Longest Win Streak: ${util.addCommas(stats.coinflip_longest_win_streak)}`,
                    `Longest Losing Streak: ${util.addCommas(stats.coinflip_longest_losing_streak)}`
                    ])
                .setColor(Colors.GOLD)
                .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                .setFooter(`This message will be automatically deleted in ${config.longest_delete_delay / 1000} seconds.`), config.longest_delete_delay);
            util.safeDelete(message);
            return;
        } else if (args[0].toLowerCase() === 'statwipe') {
            if (!message.member.hasPermission('KICK_MEMBERS', { checkAdmin: true, checkOwner: true })) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, 'You do not have permission to use this command. It requires KICK_MEMBERS.', config.longer_delete_delay);
                return;
            }
            if (args[1]) {
                args.shift()
                target = util.getUserFromMention(message, args.join(' '));
            } else {
                throw 'Missing target!'
            }
            if (!target) {
                throw `Could not find user ${args[1]}!`;
            }

            let stats = util.getMemberStats(message, target);
            if (!stats.coinflip_played) {
                util.sendMessage(message.channel, `${util.fixNameFormat(target.displayName)} has not played roulette yet! There are no stats to wipe!`);
                return;
            }
            let statEmbed = new Discord.MessageEmbed()
                .setTitle(`${util.fixNameFormat(message.member.displayName)} has wiped ${util.fixNameFormat(target.displayName)}'s Coinflip Stats!`)
                .setDescription(`${util.fixNameFormat(target.displayName)}'s coinflip stats before wiping:`)
                .addField('Coinflip Earnings',
                    [`Total Coins Bet: ${util.addCommas(stats.coins_bet_in_coinflip)}`,
                    `Total Coins Earned: ${util.addCommas(stats.coins_earned_in_coinflip)}`,
                    `Total Coins Lost: ${util.addCommas(stats.coins_lost_in_coinflip)}`,
                    `Net Earnings: ${util.addCommas(stats.coinflip_net_earnings)}`
                    ])
                .addField('Coinflip Winrate',
                    [`Total Plays: ${util.addCommas(stats.coinflip_played)}`,
                    `Wins: ${util.addCommas(stats.coinflip_wins)}`,
                    `Losses: ${util.addCommas(stats.coinflip_losses)}`,
                    `Win rate: ${stats.coinflip_wins ? Math.round(stats.coinflip_wins / stats.coinflip_played * 100 * 100) / 100 : 0}%`
                    ])
                .addField('Streaks',
                    [`Current ${stats.coinflip_winning_streak > stats.coinflip_losing_streak ? "Winning" : "Losing"} Streak: ${util.addCommas(Math.max(stats.coinflip_winning_streak, stats.coinflip_losing_streak))}`,
                    `Longest Win Streak: ${util.addCommas(stats.coinflip_longest_win_streak)}`,
                    `Longest Losing Streak: ${util.addCommas(stats.coinflip_longest_losing_streak)}`
                    ])
                .setColor(Colors.BRIGHT_RED)
                .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            util.sendMessage(message.channel, statEmbed);
            util.sendMessage(util.getLogChannel(message), statEmbed);
            
            let coinflipStatNames = ['coinflip_played', 'coinflip_wins', 'coinflip_losses', 'coins_bet_in_coinflip', 'coins_earned_in_coinflip',
            'coins_lost_in_coinflip', 'coinflip_net_earnings', 'coinflip_longest_win_streak', 'coinflip_longest_losing_streak', 'coinflip_winning_streak',
            'coinflip_winning_streak', 'coinflip_losing_streak'];

            coinflipStatNames.forEach((statName) => util.setStats(message, target, 0, statName));
            return;
        }

        if (args.length < 3) {
            throw 'Not enough arguments!';
        }

        if (this.inGame) {
            util.sendMessage(message.channel, 'Sorry, I can only handle one coinflip at a time. Please wait until that finishes.');
            return;
        }
        this.inGame = true;

        let challenger = message.member;
        let lookingFor = args.slice(0, -2).join(' ');
        let opponent = util.getUserFromMention(message, lookingFor);

        if (!opponent) {
            this.inGame = false;
            throw `Could not find user: ${util.fixNameFormat(lookingFor)}. Perhaps you should use a mention?`;
        }

        if (challenger.id === opponent.id) {
            this.inGame = false;
            util.sendMessage(message.channel, 'You may not challenge yourself!');
            return;
        }

        let challengerBalanace = util.getStats(message, challenger, 'coins');
        let opponentBalance = util.getStats(message, opponent, 'coins');

        let bet = 0;
        args[args.length - 2] = args[args.length - 2].toLowerCase()
        if (args[args.length - 2] === 'all' || args[args.length - 2] === 'max') {
            bet = Math.max(challengerBalanace, opponentBalance);
        } else {
            bet = util.convertNumber(args[args.length - 2]);
        }
        bet = Math.floor(bet * 100) / 100;

        if (bet <= 0) {
            this.inGame = false;
            throw "Invalid bet!";
        }

        if (bet > challengerBalanace) {
            this.inGame = false;
            throw `You can't afford this! You have ${util.addCommas(challengerBalanace)} coin${challengerBalanace === 1 ? '' : 's'}.`
        }

        if (bet > opponentBalance) {
            this.inGame = false;
            throw `Your opponent (${util.fixNameFormat(opponent.displayName)}) can't afford this! They have ${util.addCommas(opponentBalance)} coin${opponentBalance === 1 ? '' : 's'}.`
        }

        let acceptableGuesssesHeads = ['heads', 'head', 'h'];
        let acceptableGuessesTails = ['tails', 'tail', 't'];
        let challengerGuess = args[args.length - 1].toLowerCase();
        if (!acceptableGuesssesHeads.includes(challengerGuess) && !acceptableGuessesTails.includes(challengerGuess)) {
            this.inGame = false;
            throw `Invalid guess: ${challengerGuess}.`;
        }
        let opponentGuess = acceptableGuesssesHeads.includes(challengerGuess) ? 'tails' : 'heads';
        challengerGuess = acceptableGuesssesHeads.includes(challengerGuess) ? 'heads' : 'tails';

        util.sendMessage(message.channel, `<@${opponent.id}>`);
        util.sendMessage(message.channel, new Discord.MessageEmbed().setTitle('Coinflip Challenge!')
            .setAuthor(challenger.displayName, challenger.user.displayAvatarURL({ dynamic: true }))
            .setThumbnail(opponent.user.displayAvatarURL({ dynamic: true }))
            .setColor(Colors.LIGHT_BLUE)
            .setDescription(`${opponent}, ${challenger} challenges you to a coinflip for ${util.addCommas(bet)} :moneybag: coin${bet === 1 ? '' : 's'}.\nYou are ${opponentGuess} and ${util.fixNameFormat(challenger.displayName)} is ${challengerGuess}.\nDo you accept?`)
            .addField(':moneybag: Coin Balances', [`${challenger}: ${util.addCommas(challengerBalanace)} coin${challengerBalanace === 1 ? '' : 's'}`, `${opponent}: ${util.addCommas(opponentBalance)} coin${opponentBalance === 1 ? '' : 's'}`])
        ).then(msg => {
            msg.react('✅')
                .then(() => {
                    this.msg = msg;
                    msg.react('❌');
                })
                .then(() => {
                    const collector = msg.createReactionCollector((reaction, user) => {
                        return user.id === opponent.id;
                    }, { time: 60000, max: 1 })

                    collector.on('collect', reaction => {
                        if (reaction.emoji.name === '✅') {
                            msg.delete();
                            let flipResult = this.flip();
                            let opponentTransaction, challengerTransaction;
                            if (flipResult === challengerGuess) {
                                // Challenger wins!
                                challengerTransaction = this.awardWinnerStats(challenger, bet);
                                opponentTransaction = this.awardLoserStats(opponent, bet);
                            } else {
                                // Opponent wins!
                                challengerTransaction = this.awardLoserStats(challenger, bet);
                                opponentTransaction = this.awardWinnerStats(opponent, bet);
                            }
                            let winner = flipResult === challengerGuess ? challenger : opponent;

                            let embed = new Discord.MessageEmbed()
                                .setAuthor(winner.displayName, winner.user.displayAvatarURL({ dynamic: true }))
                                .setTitle(`Coinflip: ${util.fixNameFormat(challenger.displayName)} (${challengerGuess}) vs ${util.fixNameFormat(opponent.displayName)} (${opponentGuess})`)
                                .setDescription(`:coin: Result: **${flipResult}**\nCongratulations to ${util.fixNameFormat(winner.displayName)} for winning the coinflip!`)
                                .addField('Additional Info', [
                                    `Bet: ${util.addCommas(bet)}`,
                                    `${util.fixNameFormat(challenger.displayName)}'s coins: ${util.addCommas(challengerTransaction.coinTransaction.oldPoints)} » ${util.addCommas(challengerTransaction.coinTransaction.newPoints)}`,
                                    `${util.fixNameFormat(challenger.displayName)}'s ${challengerTransaction.additionalMessage}`,
                                    `${util.fixNameFormat(opponent.displayName)}'s coins: ${util.addCommas(opponentTransaction.coinTransaction.oldPoints)} » ${util.addCommas(opponentTransaction.coinTransaction.newPoints)}`,
                                    `${util.fixNameFormat(opponent.displayName)}'s ${opponentTransaction.additionalMessage}`
                                ])
                                .setColor(Colors.LIGHT_BLUE)
                                .setTimestamp();
                            util.sendMessage(message.channel, embed);
                            if (config.log_channel_id) {
                                util.sendMessage(util.getLogChannel(message), embed);
                            }
                        } else {
                            util.sendMessage(message.channel, `${util.fixNameFormat(opponent.displayName)} has declined your challenge.`);
                            msg.reactions.removeAll();
                        }
                        this.inGame = false;
                    });
                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            util.sendMessage(message.channel, `${util.fixNameFormat(opponent.displayName)} did not respond within 60 seconds. The coinflip has been cancelled.`);
                            this.msg.reactions.removeAll();
                        }
                        this.inGame = false;
                    });
                });
        });

        this.flip = () => {
            return Math.random() < 0.5 ? 'heads' : 'tails';
        }

        this.awardWinnerStats = (winner, bet) => {
            util.addStats(message, winner, 1, 'coinflip_played');
            util.addStats(message, winner, 1, 'coinflip_wins');
            util.addStats(message, winner, bet, "coins_bet_in_coinflip");
            let won = util.addStats(message, winner, bet, "coins_earned_in_coinflip");
            util.setStats(message, winner, won.newPoints - util.getStats(message, winner, "coins_lost_in_coinflip"), "coinflip_net_earnings");
            let streak = util.addStats(message, winner, 1, "coinflip_winning_streak").newPoints;
            let additionalMessage = `Win Streak: ${util.addCommas(streak)}`;
            if (streak > util.getStats(message, winner, "coinflip_longest_win_streak")) {
                util.setStats(message, winner, streak, "coinflip_longest_win_streak");
                additionalMessage += " (new personal best!)";
            }
            util.setStats(message, winner, 0, "coinflip_losing_streak");
            return {
                coinTransaction: util.addStats(message, winner, bet, 'coins'),
                additionalMessage: additionalMessage
            }
        }

        this.awardLoserStats = (loser, bet) => {
            util.addStats(message, loser, 1, 'coinflip_played');
            util.addStats(message, loser, 1, 'coinflip_losses');
            util.addStats(message, loser, bet, "coins_bet_in_coinflip");
            let lost = util.addStats(message, loser, bet, "coins_lost_in_coinflip");
            util.setStats(message, loser, util.getStats(message, loser, "coins_earned_in_coinflip") - lost.newPoints, "coinflip_net_earnings");
            let streak = util.addStats(message, loser, 1, "coinflip_losing_streak").newPoints;
            let additionalMessage = `Losing Streak: ${util.addCommas(streak)}`;
            if (streak > util.getStats(message, loser, "coinflip_longest_losing_streak")) {
                util.setStats(message, loser, streak, "coinflip_longest_losing_streak");
                additionalMessage += " (new personal best!)";
            }
            util.setStats(message, loser, 0, "coinflip_winning_streak");
            return {
                coinTransaction: util.addStats(message, loser, -bet, 'coins'),
                additionalMessage: additionalMessage
            }
        }
    }
}