const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json')

// Map: symbol -> {[payout[1], payout[2], ... payout[5]]}, where payout[x] is the payout if you have x in that line
const SYMBOLS = new Map([
    [':cherries:', { payout: [0, 0, 5, 20, 50], weight: 10 }],
    [':lemon:', { payout: [0, 0, 5, 20, 50], weight: 10 }],
    [':tangerine:', { payout: [0, 0, 10, 40, 100], weight: 8 }],
    [':grapes:', { payout: [0, 0, 10, 40, 100], weight: 8 }],
    [':pineapple:', { payout: [0, 0, 15, 50, 200], weight: 5 }],
    [':watermelon:', { payout: [0, 0, 20, 60, 300], weight: 4 }],
    [':kiwi:', { payout: [1, 5, 25, 200, 2000], weight: 3 }],
    [':eggplant:', { payout: [2, 10, 50, 500, 5000], weight: 2 }],
    [':avocado:', { payout: [2, 20, 200, 2500, 25000], weight: 1 }]
]);

module.exports = {
    name: ["slots", 's', 'slot'],
    description: "Roll the slot machine!",
    usage: ['<bet-per-line> <number-of-lines: 1-9> (optional: showCalculation? false/true)', 'payout', 'lines', 'statwipe <user>', 'stats (optional: user)'],
    requiresArgs: true,

    execute(bot, message, args) {
        // Legacy Code
        // let slots = [":orange_circle:", ":green_circle:", ":blue_circle:", ":red_circle:"]
        // let result1 = Math.floor((Math.random() * slots.length));
        // let result2 = Math.floor((Math.random() * slots.length));
        // let result3 = Math.floor((Math.random() * slots.length));
        // try {
        //     if (slots[result1] === slots[result2] && slots[result1] === slots[result3]) {
        //         let embed = new Discord.MessageEmbed()
        //             .setFooter('yaaay', message.author.displayAvatarURL)
        //             .setTitle('Cool, I guess.')
        //             .addField('Result:', slots[result1] + " : " + slots[result2] + " : " + slots[result3], true)
        //             .setColor(0x59c957)
        //         util.sendMessage(message.channel, embed);
        //     } else {
        //         let embed2 = new Discord.MessageEmbed()
        //             .setFooter(`you are bad`, message.author.displayAvatarURL)
        //             .setTitle('Wow, what a loser, amirite?')
        //             .addField('Result:', slots[result1] + " : " + slots[result2] + " : " + slots[result3], true)
        //             .setColor(0xcc271f)
        //         util.sendMessage(message.channel, embed2);
        //     }
        // } catch (err) {
        //     console.log(err.stack)
        // }

        if (args.length > 3) {
            throw 'Too many arguments!';
        }
        
        if (args[0].toLowerCase() === 'payout') {
            let payout = '__**Number of a symbols in a line vs. Number of Coins Earned**__\nNum:\`1     2     3     4     5     \`\n';
            for (const symbol of SYMBOLS.keys()) {
                payout += `${symbol}\t\`${SYMBOLS.get(symbol).payout.map((num) => `${num}${' '.repeat(6 - num.toString().length)}`).join('')}\`\n`;
            }
            util.sendMessage(message.channel, payout)
            return;
        } else if (args[0].toLowerCase() === 'lines') {
            let line1 = [[':black_circle:', ':black_circle:', ':black_circle:', ':black_circle:', ':black_circle:'],
            [':red_circle:', ':red_circle:', ':red_circle:', ':red_circle:', ':red_circle:'],
            [':black_circle:', ':black_circle:', ':black_circle:', ':black_circle:', ':black_circle:']];

            let line23 = [[':red_circle:', ':red_circle:', ':red_circle:', ':red_circle:', ':red_circle:'],
            [':black_circle:', ':black_circle:', ':black_circle:', ':black_circle:', ':black_circle:'],
            [':blue_circle:', ':blue_circle:', ':blue_circle:', ':blue_circle:', ':blue_circle:']];

            let line45 = [[':red_circle:', ':black_circle:', ':blue_circle:', ':black_circle:', ':red_circle:'],
            [':black_circle:', ':purple_circle:', ':black_circle:', ':purple_circle:', ':black_circle:'],
            [':blue_circle:', ':black_circle:', ':red_circle:', ':black_circle:', ':blue_circle:']];

            let line67 = [[':red_circle:', ':red_circle:', ':black_circle:', ':blue_circle:', ':blue_circle:'],
            [':black_circle:', ':black_circle:', ':purple_circle:', ':black_circle:', ':black_circle:'],
            [':blue_circle:', ':blue_circle:', ':black_circle:', ':red_circle:', ':red_circle:']];

            let line89 = [[':black_circle:', ':blue_circle:', ':black_circle:', ':red_circle:', ':black_circle:'],
            [':purple_circle:', ':black_circle:', ':purple_circle:', ':black_circle:', ':purple_circle:'],
            [':black_circle:', ':red_circle:', ':black_circle:', ':blue_circle:', ':black_circle:']];

            util.sendMessage(message.channel, new Discord.MessageEmbed()
                .setTitle('Here are the lines:')
                .addField('Line 1:', slots_array_to_string(line1))
                .addField('Line 2 and 3:', slots_array_to_string(line23))
                .addField('Line 4 and 5:', slots_array_to_string(line45))
                .addField('Line 6 and 7:', slots_array_to_string(line67))
                .addField('Line 8 and 9', slots_array_to_string(line89))
            );
            return;
        } else if (args[0].toLowerCase() === 'stats') {
            let target = message.member;
            if (args[1]) {
                args.shift();
                target = util.getUserFromMention(message, args.join(' '));
            }
            if (!target) {
                throw `Couldn't find user ${args.join(' ')}`;
            }
            
            let stats = util.getMemberStats(message, target);
            if (!stats.slots_played) {
                util.sendMessage(message.channel, `${util.fixNameFormat(target.displayName)} has not played slots yet! Tell them to give it a go!`);
                return;
            }

            util.sendTimedMessage(message.channel, new Discord.MessageEmbed()
                .addField('Slots Earnings',
                    [`Total Coins Spent: ${util.addCommas(stats.coins_bet_in_slots)}`,
                    `Total Coins Earned: ${util.addCommas(stats.coins_earned_in_slots)}`,
                    `Net Earnings: ${util.addCommas(stats.slots_net_earnings)}`
                    ])
                .addField('Slots Winrate', [`Total Plays: ${util.addCommas(stats.slots_played)}`,
                `Times Won Money: ${util.addCommas(stats.slots_wins)}`,
                `Times Lost Money: ${util.addCommas(stats.slots_losses)}`,
                `Win Rate: ${stats.slots_wins ? Math.round(stats.slots_wins / stats.slots_played * 100 * 100) / 100 : 0}%`,
                `Times Broken Even: ${util.addCommas(stats.slots_broke_even)}`,
                `Break Even Rate: ${stats.slots_broke_even ? Math.round(stats.slots_broke_even / stats.slots_played * 100 * 100) / 100 : 0}%`
                ])
                .setColor(Colors.GOLD)
                .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                .setFooter(`This message will be automatically deleted in ${config.longest_delete_delay / 1000} seconds.`), config.longest_delete_delay);
            util.safeDelete(message, config.longest_delete_delay);
            return;
        } else if (args[0].toLowerCase() === 'statwipe') {
            util.sendMessage(message.channel, 'Not implemented yet!');
            return;
        }

        if (args.length < 2) {
            throw 'Missing either <bet-per-line> or <number-of-lines: 1-9>.';
        }

        let showCalcInfo = args[2] && args[2].toLowerCase() === 'true';

        let lines = util.convertNumber(args[1]);

        if (!lines) {
            if (args[1].toLowerCase === 'max' || args[1].toLowerCase() === 'all') {
                lines = 9;
            }
        }

        if (!lines || lines > 9) {
            throw 'Invalid number of lines, 1-9 only.';
        }

        let bet = util.convertNumber(args[0]);
        if (!bet) {
            if (args[0].toLowerCase() === 'max' || args[0].toLowerCase() === 'all') {
                bet = Math.floor(util.getStats(message, message.member, 'coins') * 100 / lines) / 100;
            }
        }

        if (bet * lines > util.getStats(message, message.member, 'coins')) {
            util.sendMessage(message.channel, `Sorry, you don't have enough coins. You bet ${util.addCommas(bet * lines)} coins, but you only have ${util.addCommas(util.getStats(message, message.member, 'coins'))}.`);
            return;
        }

        // Calculates the total weight of the slot machine
        let totalWeight = 0;
        for (const symbol of SYMBOLS.keys()) {
            totalWeight += SYMBOLS.get(symbol).weight;
        }

        // Populates the table of the weighted symbols, i.e. "spins" the slot machine
        let reels = Array.from(Array(3), () => new Array(5));
        for (let i = 0; i < reels.length; i++) {
            for (let j = 0; j < reels[i].length; j++) {
                let randNumb = Math.floor(Math.random() * totalWeight);
                let soFar = totalWeight;
                for (const symbol of SYMBOLS.keys()) {
                    soFar -= SYMBOLS.get(symbol).weight;
                    if (randNumb >= soFar) {
                        reels[i][j] = symbol;
                        break;
                    }
                }
            }
        }

        // Turns the reels table into string form.
        let reels_string = '';
        for (let i = 0; i < reels.length; i++) {
            for (let j = 0; j < reels[i].length; j++) {
                reels_string += reels[i][j];
                if (j !== reels[i].length - 1) {
                    reels_string += ' ';
                }
            }
            reels_string = reels_string.trim();
            if (i !== reels.length - 1) {
                reels_string += '\n';
            }
        }

        const SHOW_ADDITIONAL_INFO = true;

        let totalWinnings = 0;
        let info = [];

        // Evaluate the first line. The minimum bet is 1 line.
        let lineWinnings = slots_evaluate_line(reels[1]);
        totalWinnings += lineWinnings.winnings;
        info.push(`Line 1: ${util.addCommas(lineWinnings.winnings)}${SHOW_ADDITIONAL_INFO ? ' ' + JSON.stringify(lineWinnings.symbolCount) : ''}`);

        // Evaluate the second line, if applicable.
        if (lines >= 2) {
            let line_2_winnings = slots_evaluate_line(reels[0]);
            totalWinnings += line_2_winnings.winnings;
            info.push(`Line 2: ${util.addCommas(line_2_winnings.winnings)}${SHOW_ADDITIONAL_INFO ? ' ' + JSON.stringify(line_2_winnings.symbolCount) : ''}`);
        }

        // Evaluate the third line, if applicable.
        if (lines >= 3) {
            let line_3_winnings = slots_evaluate_line(reels[2]);
            totalWinnings += line_3_winnings.winnings;
            info.push(`Line 3: ${util.addCommas(line_3_winnings.winnings)}${SHOW_ADDITIONAL_INFO ? ' ' + JSON.stringify(line_3_winnings.symbolCount) : ''}`);
        }

        // Evaluate the fourth line, if applicable.
        if (lines >= 4) {
            let line_4_winnings = slots_evaluate_line([reels[0][0], reels[1][1], reels[2][2], reels[1][3], reels[0][4]]);
            totalWinnings += line_4_winnings.winnings;
            info.push(`Line 4: ${util.addCommas(line_4_winnings.winnings)}${SHOW_ADDITIONAL_INFO ? ' ' + JSON.stringify(line_4_winnings.symbolCount) : ''}`);
        }

        // Evaluate the fifth line, if applicable.
        if (lines >= 5) {
            let line_5_winnings = slots_evaluate_line([reels[2][0], reels[1][1], reels[0][2], reels[1][3], reels[2][4]]);
            totalWinnings += line_5_winnings.winnings;
            info.push(`Line 5: ${util.addCommas(line_5_winnings.winnings)}${SHOW_ADDITIONAL_INFO ? ' ' + JSON.stringify(line_5_winnings.symbolCount) : ''}`);
        }

        // Evaluate the sixth line, if applicable.
        if (lines >= 6) {
            let line_6_winnings = slots_evaluate_line([reels[0][0], reels[0][1], reels[1][2], reels[2][3], reels[2][4]]);
            totalWinnings += line_6_winnings.winnings;
            info.push(`Line 6: ${util.addCommas(line_6_winnings.winnings)}${SHOW_ADDITIONAL_INFO ? ' ' + JSON.stringify(line_6_winnings.symbolCount) : ''}`);
        }

        // Evaluate the seventh line, if applicable.
        if (lines >= 7) {
            let line_7_winnings = slots_evaluate_line([reels[2][0], reels[2][1], reels[1][2], reels[0][3], reels[0][4]]);
            totalWinnings += line_7_winnings.winnings;
            info.push(`Line 7: ${util.addCommas(line_7_winnings.winnings)}${SHOW_ADDITIONAL_INFO ? ' ' + JSON.stringify(line_7_winnings.symbolCount) : ''}`);
        }

        // Evaluate the eigth line, if applicable.
        if (lines >= 8) {
            let line_8_winnings = slots_evaluate_line([reels[1][0], reels[2][1], reels[1][2], reels[0][3], reels[1][4]]);
            totalWinnings += line_8_winnings.winnings;
            info.push(`Line 8: ${util.addCommas(line_8_winnings.winnings)}${SHOW_ADDITIONAL_INFO ? ' ' + JSON.stringify(line_8_winnings.symbolCount) : ''}`);
        }

        // Evaluate the ninth line, if applicable.
        if (lines >= 9) {
            let line_9_winnings = slots_evaluate_line([reels[1][0], reels[0][1], reels[1][2], reels[2][3], reels[1][4]]);
            totalWinnings += line_9_winnings.winnings;
            info.push(`Line 9: ${util.addCommas(line_9_winnings.winnings)}${SHOW_ADDITIONAL_INFO ? ' ' + JSON.stringify(line_9_winnings.symbolCount) : ''}`);
        }

        if (!showCalcInfo) {
            info = []
        }

        let earnings = Math.floor(bet * totalWinnings * 100 / 3) / 100;

        let totalBet = bet * lines;

        let transaction = util.addStats(message, message.member, earnings - totalBet, 'coins');
        util.addStats(message, message.member, 1, 'slots_played');

        let newPb = false;
        let streak = 0;
        if (earnings > totalBet) {
            util.addStats(message, message.member, 1, 'slots_wins');
            streak = util.addStats(message, message.member, 1, 'slots_win_streak').newPoints;
            util.setStats(message, message.member, 0, 'slots_losing_streak');
            if (streak > util.getStats(message, message.member, 'slots_longest_win_streak')) {
                newPb = true;
                util.setStats(message, message.member, streak, 'slots_longest_win_streak');
            }
        } else if (earnings < totalBet) {
            util.addStats(message, message.member, 1, 'slots_losses')
            streak = util.addStats(message, message.member, 1, 'slots_losing_streak').newPoints;
            util.setStats(message, message.member, 0, 'slots_win_streak');
            if (streak > util.getStats(message, message.member, 'slots_longest_losing_streak')) {
                newPb = true;
                util.setStats(message, message.member, streak, 'slots_longest_losing_streak');
            }
        } else {
            util.addStats(message, message.member, 1, 'slots_broke_even');
            util.setStats(message, message.member, 0, 'slots_win_streak');
            util.setStats(message, message.member, 0, 'slots_losing_streak');
        }

        let spent = util.addStats(message, message.member, totalBet, 'coins_bet_in_slots');
        let earned = util.addStats(message, message.member, earnings, 'coins_earned_in_slots');
        util.setStats(message, message.member, Math.round((earned.newPoints - spent.oldPoints) * 100) / 100, 'slots_net_earnings');

        info = [...info, `Total Score: ${util.addCommas(totalWinnings)}`, 
        `Bet per line: ${util.addCommas(bet)}`, 
        `Lines: ${util.addCommas(lines)}`, 
        `Total bet: ${util.addCommas(totalBet)}`, 
        `Winnings: ${util.addCommas(earnings)}`, 
        `Net Earnings: ${util.addCommas(Math.round(((earnings - totalBet) * 100)) / 100)}`, 
        `Coins: ${util.addCommas(transaction.oldPoints)} » ${util.addCommas(transaction.newPoints)}`];

        let embed = new Discord.MessageEmbed()
            .setTitle('Playing Slots')
            .setAuthor(message.member.displayName, message.author.displayAvatarURL({ dynamic: true }))
            .setDescription(`${reels_string}\n\n${earnings > totalBet ? `Congrats! You earned more than you bet!\nWinning Streak: ${util.addCommas(streak)}${newPb ? ' (new personal best!)' : ''}` : (earnings < totalBet ? `Ouch, you didn't earn as much as you spent.\nLosing Streak: ${util.addCommas(streak)}${newPb ? ' (new personal best!)' : ''}` : 'You broke even!')}`)
            .addField('Additional Info:', info)
            .setColor(earnings > totalBet ? Colors.MEDIUM_GREEN : (earnings < totalBet ? Colors.MEDIUM_RED : Colors.YELLOW));

        util.sendMessage(message.channel, embed);
    }
}

/**
 * Given a line, calculate how much it's worth.
 * 
 * @param {Array<number>} line the line to be evaluated
 * @returns an object containing the worth of the line, and a symbol count
 */
slots_evaluate_line = (line) => {
    let winnings = 0;
    let lineCounts = {};
    line.forEach(symbol => lineCounts[symbol] = 1 + (lineCounts[symbol] || 0));
    for (const symbol of Object.keys(lineCounts)) {
        if (SYMBOLS.get(symbol).payout[lineCounts[symbol] - 1] > 0) {
            winnings += SYMBOLS.get(symbol).payout[lineCounts[symbol] - 1];
        }
    }
    return { winnings: winnings, symbolCount: lineCounts };
}

/**
 * Takes a 2-d array of the reels, and turns it into string form.
 * 
 * @param {Array<Array<number>>} array the reels
 * @returns the reels in string form
 */
slots_array_to_string = (array) => {
    let result = '';
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array[i].length; j++) {
            result += array[i][j];
            if (j !== array[i].length - 1) {
                result += ' ';
            }
        }
        if (i !== array[i].length - 1) {
            result += '\n';
        }
    }
    return result;
}