const Discord = require('discord.js');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const util = require('../utilities');
const config = require('../config.json');
const { toLowerCase } = require('ffmpeg-static');

module.exports = {
    name: ["roulette"],
    description: "Spins the roulette wheel.",
    usage: "<coins> <even/odd/green>",
    requiresArgs: true,

    execute(bot, message, args) {
        try {
            var lookingFor = args[1]
            let SelectedCoins = parseFloat(args[0]);
            SelectedCoins = Math.floor(SelectedCoins * 100) / 100;
            var NewCoins
            if (!lookingFor) {
                throw new InvalidUseException();
            }
            if (SelectedCoins < 0) {
                throw new InvalidUsageException('Coins cannot be negative.');
            }

            let RouletteColors = [":green_circle:", ":red_circle:", ":black_circle:"]
            let RouletteNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]
            let EvenNumbers = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36]
            let OddNumbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35]
            let GreenMultiplier = 7
            let randNumb = Math.floor(Math.random() * RouletteNumbers.length);
            let winner = false

            function getRouletteColor(randNumb) {
                if (randNumb == 0) {
                    return RouletteColors[0]
                } else if (randNumb % 2 == 0) {
                    return RouletteColors[2]
                } else if (randNumb % 2 != 0) {
                    return RouletteColors[1]
                }
            }

            function convertArgs(lookingFor) {
                if (lookingFor.toLowerCase() == "green") {
                    return 0;
                } else if (lookingFor.toLowerCase() == "even") {
                    return EvenNumbers;
                } else if (lookingFor.toLowerCase() == "odd") {
                    return OddNumbers;
                } else {
                    util.sendTimedMessage(message.channel, `You have entered an invalid bet!`);
                    return;
                }
            }

            function makeEmbed(oldCoins, newCoins) {
                return new Discord.MessageEmbed()
                    .setTitle(`${message.member.displayName} has played roulette!`)
                    .setDescription(`${util.addCommas(Math.abs(Math.round((newCoins - oldCoins) * 100) / 100))} coin${Math.abs(Math.round((newCoins - oldCoins) * 100) / 100) === 1 ? '' : 's'} ha${Math.abs(Math.round((newCoins - oldCoins) * 100) / 100) === 1 ? 's' : 've'} been ${oldCoins > newCoins ? 'taken away for losing.' : 'awarded for winning!'}`)
                    .addField('Additional Info',`Bet: ${util.addCommas(SelectedCoins)} coins\nGuess: ${lookingFor}\nResult: ${getRouletteColor(randNumb)} Number rolled: ${randNumb}\nPrevious coins: ${util.addCommas(oldCoins)}\nNew coins: ${util.addCommas(newCoins)}`)
                    .setColor(Colors.BLUE)
                    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }));
            }

            function awardPoints(NewCoins) {
                let result = util.addStats(message, message.member, NewCoins, "coins");
                util.sendMessage(util.getLogChannel(message), makeEmbed(result.oldPoints, result.newPoints));
                util.sendMessage(message.channel, makeEmbed(result.oldPoints, result.newPoints));
                return;
            }

            function removePoints(NewCoins) {
                let result = util.addStats(message, message.member, (-1 * NewCoins), "coins");
                util.sendMessage(util.getLogChannel(message), makeEmbed(result.oldPoints, result.newPoints));
                util.sendMessage(message.channel, makeEmbed(result.oldPoints, result.newPoints));
                return;
            }

            if (util.getStats(message, message.member, "coins") >= SelectedCoins) {
                if (randNumb === 0) {
                    // console.log(`${getRouletteColor(randNumb)} ${randNumb} Rolled 0. Player Guessed ${lookingFor}.`);
                    if (convertArgs(lookingFor) == 0) {
                        NewCoins = SelectedCoins * GreenMultiplier
                        awardPoints(NewCoins);
                        // util.sendMessage(message.channel, `${getRouletteColor(randNumb)} You've won! Number Rolled: ${randNumb}.`);
                    } else {
                        NewCoins = SelectedCoins
                        removePoints(NewCoins)
                        // util.sendMessage(message.channel, `${getRouletteColor(randNumb)} You've lost! Number Rolled: ${randNumb}.`);
                    }
                } else if (randNumb % 2 != 0) { //odd
                    // console.log(`${getRouletteColor(randNumb)} ${randNumb} Rolled Odd. Player Guessed ${lookingFor}.`);
                    if (convertArgs(lookingFor).toString().indexOf(`${randNumb}`) != -1) {
                        NewCoins = SelectedCoins
                        awardPoints(NewCoins);
                        // util.sendMessage(message.channel, `${getRouletteColor(randNumb)} You've won! Number Rolled: ${randNumb}.`);
                    } else {
                        NewCoins = SelectedCoins
                        removePoints(NewCoins)
                        // util.sendMessage(message.channel, `${getRouletteColor(randNumb)} You've lost! Number Rolled: ${randNumb}.`);
                    }
                } else if (randNumb % 2 == 0) { //even
                    // console.log(`${getRouletteColor(randNumb)} ${randNumb} Rolled Even. Player Guessed ${lookingFor}.`);
                    if (convertArgs(lookingFor).toString().indexOf(`${randNumb}`) != -1) {
                        NewCoins = SelectedCoins
                        awardPoints(NewCoins);
                        // util.sendMessage(message.channel, `${getRouletteColor(randNumb)} You've won! Number Rolled: ${randNumb}.`);
                    } else {
                        NewCoins = SelectedCoins
                        removePoints(NewCoins)
                        // util.sendMessage(message.channel, `${getRouletteColor(randNumb)} You've lost! Number Rolled: ${randNumb}.`);
                    }
                }
            } else {
                util.sendTimedMessage(message.channel, `You do not have enough coins than the amount you specified. You have ${util.getStats(message, message.member, "coins")} coins.`, config.longer_delete_delay);
                return;
            }
        } catch (err) {
            console.log(err);
        }
    }
}