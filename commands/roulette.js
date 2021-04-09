const Discord = require('discord.js');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const util = require('../utilities');
const config = require('../config.json');

const ROULETTE_COLORS = [":green_circle:", ":red_circle:", ":black_circle:"];
const GREEN_MULTIPLIER = 17;
const BETS = ["even", "odd", "low", "high", "red", "black", "green", "column1", "column2", "column3", "dozen1", "dozen2", "dozen3"];

module.exports = {
    name: ["roulette", "r"],
    description: "Spins the roulette wheel. Or shows roulette stats.",
    usage: `<coins/half/all> <${BETS.join('/')}> OR <stats> (optional: user)`,
    requiresArgs: true,

    execute(bot, message, args) {
        let lookingFor = args[1];
        let SelectedCoins = -1;

        if (args[0].toLowerCase() === 'stats') {
            let target = message.member;
            if (args[1]) {
                target = util.getUserFromMention(message, args[1]);
            }
            if (!target) {
                throw `Could not find user ${args[1]}!`;
            }

            let stats = util.getMemberStats(message, target);
            if (!stats.roulette_played) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `${util.fixNameFormat(target.displayName)} has not played roulette yet! Tell them to give it a go!`);
                return;
            }
            util.sendTimedMessage(message.channel, new Discord.MessageEmbed()
                .setTitle(`${util.fixNameFormat(target.displayName)}'s Roulette Stats`)
                .addField('Roulette Earnings',
                    [`Total Coins Bet: ${util.addCommas(stats.coins_bet_in_roulette)}`,
                    `Total Coins Earned: ${util.addCommas(stats.coins_earned_in_roulette)}`,
                    `Total Coins Lost: ${util.addCommas(stats.coins_lost_in_roulette)}`,
                    `Net Earnings: ${util.addCommas(stats.net_roulette_earnings)}`
                    ])
                .addField('Roulette Winrate',
                    [`Total Plays: ${util.addCommas(stats.roulette_played)}`,
                    `Wins: ${util.addCommas(stats.roulette_wins)}`,
                    `Losses: ${util.addCommas(stats.roulette_losses)}`,
                    `Win rate: ${Math.round(stats.roulette_wins / stats.roulette_played * 100 * 100) / 100}%`
                    ])
                .addField('Streaks',
                    [`Current ${stats.roulette_winning_streak > stats.roulette_losing_streak ? "Winning" : "Losing"} Streak: ${util.addCommas(Math.max(stats.roulette_winning_streak, stats.roulette_losing_streak))}`,
                    `Longest Win Streak: ${util.addCommas(stats.roulette_longest_win_streak)}`,
                    `Longest Losing Streak: ${util.addCommas(stats.roulette_longest_losing_streak)}`
                    ])
                .setColor(Colors.GOLD)
                .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                .setFooter(`This message will be automatically deleted in ${config.longer_delete_delay / 1000} seconds.`), config.longer_delete_delay);
            util.safeDelete(message);
            return;
        } else if (args[0].toLowerCase() === 'all') {
            SelectedCoins = util.getStats(message, message.member, 'coins');
            if (!SelectedCoins) {
                util.sendMessage(message.channel, 'You have no coins.');
                return;
            }
        } else if (args[0].toLowerCase() === 'half') {
            SelectedCoins = util.getStats(message, message.member, 'coins');
            if (!SelectedCoins) {
                util.sendMessage(message.channel, 'You have no coins.');
                return;
            }
            SelectedCoins /= 2;
            SelectedCoins = Math.floor(SelectedCoins * 100) / 100;
        } else {
            SelectedCoins = util.convertNumber(args[0]);
            SelectedCoins = Math.floor(SelectedCoins * 100) / 100;
        }

        if (!lookingFor) {
            throw 'No bet (guess) entered.';
        }
        if (SelectedCoins < 0) {
            throw 'Coins cannot be negative.';
        }

        const RANDOM_NUMBER = Math.floor(Math.random() * 38); // 0 - 37, where 37 is 00.

        try {
            if (SelectedCoins === 0) {
                throw 'You may not play with 0 coins. You can, however, play with partial coins, rounded down to the nearest hundredth.';
            }

            if (util.getStats(message, message.member, "coins") >= SelectedCoins) {
                let winner = isWin(lookingFor, RANDOM_NUMBER);
                if (winner) {
                    awardPoints(message, RANDOM_NUMBER, lookingFor, SelectedCoins, SelectedCoins * winner);
                } else {
                    removePoints(message, RANDOM_NUMBER, lookingFor, SelectedCoins);
                }
            } else {
                util.sendTimedMessage(message.channel, `You do not have enough coins. You have ${util.getStats(message, message.member, "coins")} coins.`, config.longer_delete_delay);
            }
        } catch (err) {
            util.sendMessage(message.channel, `Error: ${err}`);
            console.log(err);
        }
    }
};

/**
 * Returns the winning payout multiplier (e.g. 1-to-1 --> 1) if they win. 
 * guess: String - the guess to be checked
 * randNumb: Number - the winning number
 */
isWin = (guess, randNumb) => {
    guess = guess.toLowerCase();
    switch (guess) {
        case "green":
            return (randNumb === 0 || randNumb === 37) ? GREEN_MULTIPLIER : 0; // 0 or 00
        case "even":
            return (randNumb % 2 === 0 && randNumb !== 0) ? 1 : 0; // 0 is neither even or odd.
        case "odd":
            return (randNumb % 2 === 1 && randNumb !== 0 && randNumb !== 37) ? 1 : 0; // 0 is neither even or odd
        case "high":
            return (randNumb >= 19 && randNumb !== 37) ? 1 : 0; // 19-36
        case "low":
            return (randNumb <= 18 && randNumb !== 0) ? 1 : 0; // 1-18
        case "red":
            return (getRouletteColor(randNumb) === ROULETTE_COLORS[1]) ? 1 : 0;
        case "black":
            return (getRouletteColor(randNumb) === ROULETTE_COLORS[2]) ? 1 : 0;
        case "column1":
            return (((randNumb - 1) % 3) === 0) ? 2 : 0; // 1, 4, 7, ..., 31, 34
        case "column2":
            return (((randNumb - 2) % 3) === 0) ? 2 : 0; // 2, 5, 8, ..., 32, 35
        case "column3":
            return ((randNumb % 3) === 0) ? 2 : 0; // 3, 6, 9, ..., 33, 36
        case "dozen1":
            return (1 <= randNumb && randNumb <= 12) ? 2 : 0; // 1-12
        case "dozen2":
            return (13 <= randNumb && randNumb <= 24) ? 2 : 0; // 13-24
        case "dozen3":
            return (25 <= randNumb && randNumb <= 36) ? 2 : 0; // 25-36
        default:
            throw `Invalid bet!\nValid bets: \`${BETS.join('`/`')}\``;
    }
};

/**
 * Returns an embed representing this gambling session
 * message: Discord.Message() - any message sent in this guild
 * randNumb: Number - the winning number chosen
 * lookingFor: String - the player's guess
 * coinsToAdd: Number - the number of coins to remove from the player
 * Returns: Discord.messageEmbed() - the embed representing the game, and coins transaction
 */
makeEmbed = (message, randNumb, lookingFor, SelectedCoins, oldCoins, newCoins, streak, additionalMessage = "") => {
    return new Discord.MessageEmbed()
        .setTitle(`${message.member.displayName} has played roulette!`)
        .setDescription(`${util.addCommas(Math.abs(Math.round((newCoins - oldCoins) * 100) / 100))} coin${Math.abs(Math.round((newCoins - oldCoins) * 100) / 100) === 1 ? '' : 's'} ha${Math.abs(Math.round((newCoins - oldCoins) * 100) / 100) === 1 ? 's' : 've'} been ${oldCoins > newCoins ? 'taken away for losing.' : 'awarded for winning!'}\n${oldCoins > newCoins ? `Losing Streak: ${streak}` : `Winning Streak: ${streak}`}${additionalMessage}`)
        .addField('Additional Info', [`Bet: ${util.addCommas(SelectedCoins)} coins`,
        `Guess: ${lookingFor} (${getDescription(lookingFor)})`,
        `Result: ${getRouletteColor(randNumb)} ${randNumb === 37 ? '00' : randNumb}`,
        `Coins: ${util.addCommas(oldCoins)} » ${util.addCommas(newCoins)}`
        ])
        .setColor(Colors.BLUE)
        .setTimestamp()
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }));
};

/**
 * Adds the specified number of coins, and also sends messages to the log, and to the user
 * message: Discord.Message() - any message sent in this guild
 * randNumb: Number - the winning number chosen
 * lookingFor: String - the player's guess
 * coinsToAdd: Number - the number of coins to add to the player
 */
awardPoints = (message, randNumb, lookingFor, SelectedCoins, coinsToAdd) => {
    let result = util.addStats(message, message.member, coinsToAdd, "coins");
    util.addStats(message, message.member, 1, "roulette_played");
    util.addStats(message, message.member, 1, "roulette_wins");
    util.addStats(message, message.member, SelectedCoins, "coins_bet_in_roulette");
    let won = util.addStats(message, message.member, coinsToAdd, "coins_earned_in_roulette");
    util.setStats(message, message.member, won.newPoints - util.getStats(message, message.member, "coins_lost_in_roulette"), "net_roulette_earnings");
    let streak = util.addStats(message, message.member, 1, "roulette_winning_streak").newPoints;
    let additionalMessage = "";
    if (streak > util.getStats(message, message.member, "roulette_longest_win_streak")) {
        util.setStats(message, message.member, streak, "roulette_longest_win_streak");
        additionalMessage = " (new personal best!)";
    }
    util.setStats(message, message.member, 0, "roulette_losing_streak");
    util.sendMessage(util.getLogChannel(message), makeEmbed(message, randNumb, lookingFor, SelectedCoins, result.oldPoints, result.newPoints, streak, additionalMessage));
    util.sendMessage(message.channel, makeEmbed(message, randNumb, lookingFor, SelectedCoins, result.oldPoints, result.newPoints, streak, additionalMessage));
};

/**
 * Removes the specified number of points, and also sends messages to the log, and to the user
 * message: Discord.Message() - any message sent in this guild
 * randNumb: Number - the winning number chosen
 * lookingFor: String - the player's guess
 * coinsToRemove: Number - the number of coins to remove from the player
 */
removePoints = (message, randNumb, lookingFor, coinsToRemove) => {
    let result = util.addStats(message, message.member, -coinsToRemove, "coins");
    util.addStats(message, message.member, 1, "roulette_played");
    util.addStats(message, message.member, 1, "roulette_losses");
    util.addStats(message, message.member, coinsToRemove, "coins_bet_in_roulette");
    let lost = util.addStats(message, message.member, coinsToRemove, "coins_lost_in_roulette");
    util.setStats(message, message.member, util.getStats(message, message.member, "coins_earned_in_roulette") - lost.newPoints, "net_roulette_earnings");
    let streak = util.addStats(message, message.member, 1, "roulette_losing_streak").newPoints;
    let additionalMessage = "";
    if (streak > util.getStats(message, message.member, "roulette_longest_losing_streak")) {
        util.setStats(message, message.member, streak, "roulette_longest_losing_streak");
        additionalMessage = " (new personal best!)";
    }
    util.setStats(message, message.member, 0, "roulette_winning_streak");
    util.sendMessage(util.getLogChannel(message), makeEmbed(message, randNumb, lookingFor, coinsToRemove, result.oldPoints, result.newPoints, streak, additionalMessage));
    util.sendMessage(message.channel, makeEmbed(message, randNumb, lookingFor, coinsToRemove, result.oldPoints, result.newPoints, streak, additionalMessage));
};

/**
 * Returns the roulette color for the number
 * randNumb: Number - the number whose color to be returned
 */
getRouletteColor = (randNumb) => {
    if (randNumb === 0 || randNumb === 37) { // green when 0 or 00
        return ROULETTE_COLORS[0];
    } else if ((randNumb >= 1 && randNumb <= 10) || (randNumb >= 19 && randNumb <= 28)) { // between 1-10 and 19-28, odd is red, and even is black
        if (isEven(randNumb)) {
            return ROULETTE_COLORS[2];
        } else {
            return ROULETTE_COLORS[1];
        }
    } else { // between 11-18 and 29-36, odd is black, and even is red
        if (isEven(randNumb)) {
            return ROULETTE_COLORS[1];
        } else {
            return ROULETTE_COLORS[2];
        }
    }
};

/**
 * Returns true if the number is even
 * number: Number - the number to be checked
 */
isEven = (number) => {
    return number % 2 === 0;
};

getDescription = (lookingFor) => {
    lookingFor = lookingFor.toLowerCase();
    switch (lookingFor) {
        case "green":
            return "0 or 00";
        case "even":
            return "2, 4, 6, ..., 34, 36. 0 and 00 are not even nor odd.";
        case "odd":
            return "1, 3, 5, ..., 33, 35. 0 and 00 are not even nor odd.";
        case "high":
            return "19-36";
        case "low":
            return "1-18";
        case "red":
            return "1-10 and 19-28, odd is red. 11-18 and 29-36, even is red"
        case "black":
            return "1-10 and 19-28, even is black. 11-18 and 29-36, odd is black.";
        case "column1":
            return "1, 4, 7, ..., 31, 34";
        case "column2":
            return "2, 5, 8, ..., 32, 35";
        case "column3":
            return "3, 6, 9, ..., 33, 36";
        case "dozen1":
            return "1-12";
        case "dozen2":
            return "13-24";
        case "dozen3":
            return "25-36";
        default:
            throw `Invalid bet!\nValid bets: \`${BETS.join('`/`')}\``;
    }
}