const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json')

const DEALER_MOVE_DELAY = 3000; // the time it takes the dealer to "think"

module.exports = {
    name: ['blackjack', 'bj'],
    description: 'Play backjack against the bot!',
    usage: ['<coins/half/all> (optional: dealerMovesInstantly? true/false)', 'stats (optional: user)', 'statwipe <user>'],
    requiresArgs: true,

    execute(bot, message, args) {
        let cards = [...Array(52).keys()];
        let playerHand = new Array();
        let computerHand = new Array();

        if (args[0].toLowerCase() === 'stats') {
            let target = message.member;
            if (args[1]) {
                args.shift();
                target = util.getUserFromMention(message, args.join(' '));
            }
            if (!target) {
                throw `Couldn't find user ${args.join(' ')}`;
            }

            let stats = util.getMemberStats(message, target);
            if (!stats.blackjack_played) {
                util.sendMessage(message.channel, `${util.fixNameFormat(target.displayName)} has not played blackjack yet! Tell them to give it a go!`);
                return;
            }

            util.sendTimedMessage(message.channel, new Discord.MessageEmbed()
                .setTitle(`${util.fixNameFormat(target.displayName)}'s Blackjack Stats`)
                .addField('Blackjack Earnings',
                    [`Total Coins Bet: ${util.addCommas(stats.coins_bet_in_blackjack)}`,
                    `Total Coins Earned: ${util.addCommas(stats.coins_earned_in_blackjack)}`,
                    `Total Coins Lost: ${util.addCommas(stats.coins_lost_in_blackjack)}`,
                    `Net Earnings: ${util.addCommas(stats.blackjack_net_earnings)}`
                    ])
                .addField('Blackjack Winrate',
                    [`Total Plays: ${util.addCommas(stats.blackjack_played)}`,
                    `Wins: ${util.addCommas(stats.blackjack_wins)}`,
                    `Losses: ${util.addCommas(stats.blackjack_losses)}`,
                    `Win Rate: ${stats.blackjack_wins ? Math.round(stats.blackjack_wins / stats.blackjack_played * 100 * 100) / 100 : 0}%`,
                    `Blackjacks: ${util.addCommas(stats.blackjack_blackjacks)}`,
                    `Blackjack Rate: ${stats.blackjack_blackjacks ? Math.round(stats.blackjack_blackjacks / stats.blackjack_played * 100 * 100) / 100 : 0}%`,
                    `Ties: ${util.addCommas(stats.blackjack_tied)}`,
                    `Tie Rate: ${stats.blackjack_tied ? Math.round(stats.blackjack_tied / stats.blackjack_played * 100 * 100) / 100 : 0}%`
                    ])
                .addField('Streaks',
                    [`Current ${stats.blackjack_winning_streak > stats.blackjack_losing_streak ? "Winning" : "Losing"} Streak: ${util.addCommas(Math.max(stats.blackjack_winning_streak, stats.blackjack_losing_streak))}`,
                    `Longest Win Streak: ${util.addCommas(stats.blackjack_longest_win_streak)}`,
                    `Longest Losing Streak: ${util.addCommas(stats.blackjack_longest_losing_streak)}`
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
                util.sendMessage(message.channel, `${util.fixNameFormat(target.displayName)} has not played blackjack yet! There are no stats to wipe!`);
            }
            
            let statEmbed = new Discord.MessageEmbed()
                .setTitle(`${util.fixNameFormat(message.member.displayName)} has wiped ${util.fixNameFormat(target.displayName)}'s Blackjack Stats!`)
                .setDescription(`${util.fixNameFormat(target.displayName)}'s Blackjack stats before wiping:`)
                .addField('Blackjack Earnings',
                    [`Total Coins Bet: ${util.addCommas(stats.coins_bet_in_blackjack)}`,
                    `Total Coins Earned: ${util.addCommas(stats.coins_earned_in_blackjack)}`,
                    `Total Coins Lost: ${util.addCommas(stats.coins_lost_in_blackjack)}`,
                    `Net Earnings: ${util.addCommas(stats.blackjack_net_earnings)}`
                    ])
                .addField('Blackjack Winrate',
                    [`Total Plays: ${util.addCommas(stats.blackjack_played)}`,
                    `Wins: ${util.addCommas(stats.blackjack_wins)}`,
                    `Losses: ${util.addCommas(stats.blackjack_losses)}`,
                    `Win Rate: ${stats.blackjack_wins ? Math.round(stats.blackjack_wins / stats.blackjack_played * 100 * 100) / 100 : 0}%`,
                    `Blackjacks: ${util.addCommas(stats.blackjack_blackjacks)}`,
                    `Blackjack Rate: ${stats.blackjack_blackjacks ? Math.round(stats.blackjack_blackjacks / stats.blackjack_played * 100 * 100) / 100 : 0}%`,
                    `Ties: ${util.addCommas(stats.blackjack_tied)}`,
                    `Tie Rate: ${stats.blackjack_tied ? Math.round(stats.blackjack_tied / stats.blackjack_played * 100 * 100) / 100 : 0}%`
                    ])
                .addField('Streaks',
                    [`Current ${stats.blackjack_winning_streak > stats.blackjack_losing_streak ? "Winning" : "Losing"} Streak: ${util.addCommas(Math.max(stats.blackjack_winning_streak, stats.blackjack_losing_streak))}`,
                    `Longest Win Streak: ${util.addCommas(stats.blackjack_longest_win_streak)}`,
                    `Longest Losing Streak: ${util.addCommas(stats.blackjack_longest_losing_streak)}`
                    ])
                .setColor(Colors.BRIGHT_RED)
                .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            util.sendMessage(message.channel, statEmbed);
            util.sendMessage(util.getLogChannel(message), statEmbed);

            let blackjackStatNames = ['blackjack_played', 'blackjack_wins', 'blackjack_blackjacks', 'blackjack_tied', 'blackjack_losses',
            'coins_bet_in_blackjack', 'coins_earned_in_blackjack', 'coins_lost_in_blackjack', 'blackjack_net_earnings',
            'blackjack_longest_win_streak', 'blackjack_longest_losing_streak', 'blackjack_winning_streak', 'blackjack_losing_streak'];
            blackjackStatNames.forEach((statName) => util.setStats(message, target, 0, statName));
            return;
        }

        const HIT_EMOJI = '⬆️';
        const STAND_EMOJI = '✅';
        const TIMEOUT = 60000;

        /**
         * Converts the cardValue into the card suit.
         * 
         * @param {number} cardNum the cardValue of the card
         * @returns the suit of the card with this cardNum
         */
        this.getCardSuit = (cardNum) => {
            switch (cardNum % 4) {
                case 0:
                    return ':clubs:';
                case 1:
                    return ':spades:';
                case 2:
                    return ':hearts:';
                case 3:
                    return ':diamonds:';
                default:
                    throw 'HUGE error!';
            }
        }

        /**
         * Converts the cardValue into the card type.
         * 
         * @param {number} cardNum the cardValue of the card
         * @returns the type of card (A, 2, 3..., J, Q, K)
         */
        this.getCardType = (cardNum) => {
            let value = Math.floor(cardNum / 4);
            switch (value) {
                case 0:
                    return 'A';
                case 10:
                    return 'J';
                case 11:
                    return 'Q';
                case 12:
                    return 'K'
                default:
                    return value + 1;
            }
        }

        /**
         * Returns a string representation of the card with this cardValue
         * 
         * @param {number} cardNum the cardValue of the card
         * @returns a string representation of the card with this cardValue
         */
        this.cardToString = (cardNum) => {
            return `${this.getCardSuit(cardNum)} ${this.getCardType(cardNum)}`;
        }

        /**
         * Returns a string representation of this hand
         * 
         * @param {array} cards the cards in this hand
         * @param {boolean} isDealer true if the second card should be hidden
         * @returns a string representation of this hand
         */
        this.handToString = (cards, isDealer = false) => {
            if (isDealer) {
                return `${this.cardToString(cards[0])} - ?`;
            }
            cards = cards.map(cardValue => this.cardToString(cardValue));
            return cards.join(' - ');
        }

        /**
         * Returns how much this card is worth (A is counted as 1)
         * 
         * @param {number} card the cardValue of the card
         * @returns how many points this card is worth
         */
        this.cardValue = (card) => {
            if (Math.floor(card / 4) === 0) {
                return 11;
            } else if (card / 4 < 10) {
                return Math.floor(card / 4) + 1;
            }
            return 10;
        }

        /**
         * @typedef {Object} HandValue
         * @property {number} value how much this hand is worth
         * @property {boolean} isSoft true if the hand is soft (has an ace that is counted as 11)
         */

        /**
         * Calculates the value of this hand.
         * 
         * @param {array} cards the cards in this hand
         * @param {boolean} isDealer true if only the value of the first card should be returned
         * @returns {HandValue} the values of this hand
         */
        this.computeValue = (cards, isDealer = false) => {
            if (isDealer) {
                return { value: this.cardValue(cards[0]), isSoft: false};
            }
            cards = [...cards].sort((a, b) => b - a);
            let sum = 0;
            let soft = false;
            for (let i = 0; i < cards.length; i++) {
                sum += this.cardValue(cards[i]);
                if (this.getCardType(cards[i]) === 'A') {
                    if (sum > 21) {
                        sum -= 10;
                    } else {
                        soft = true;
                    }   
                }
            }
            return {value: sum, isSoft: soft};
        }

        /**
         * Draws a random cardValue from the cards remaining. Takes the
         * cardValue out of the array, reducing the cardPile size by 1.
         * 
         * @param {array} cards the list of cards remaining
         * @returns a random card value from the array
         */
        this.drawRandomCard = (cards) => {
            return cards.splice(Math.floor(Math.random() * cards.length), 1).pop();
        }

        this.getBlackJackEmbed = (msg, playerHand, computerHand, isComputerHidden, description, bet, gameDone, isComputerThinking, player) => {
            let embed = new Discord.MessageEmbed()
                .setTitle('Playing BlackJack')
                .setAuthor(player.displayName, player.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`${description}\n${gameDone ? '' : `You bet ${util.addCommas(bet)} coins.`}`)
                .setTimestamp()
                .setColor(Colors.BLUE)
                .addField('Your Hand', `${this.handToString(playerHand)}\nis worth: ${this.computeValue(playerHand).value}`, true)
                .addField("Dealer's Hand", `${this.handToString(computerHand, isComputerHidden)}\nis worth: ${this.computeValue(computerHand, isComputerHidden).value}${isComputerHidden ? ' + ?' : ''}`, true)
            if (gameDone) {
                let isPlayerBlackJack = this.isBlackJack(playerHand);
                let isComputerBlackJack = this.isBlackJack(computerHand);
                let playerValue = this.computeValue(playerHand).value;
                let computerValue = this.computeValue(computerHand).value;
                if (playerValue === computerValue && (isPlayerBlackJack === isComputerBlackJack)) {
                    embed.setColor(Colors.YELLOW);
                    embed.addField('Additional Info', 'Tie!')
                    util.addStats(message, player, 1, 'blackjack_played');
                    util.addStats(message, player, 1, 'blackjack_tied');
                    util.addStats(message, player, 1, 'coins_bet_in_blackjack');
                    util.setStats(message, player, 0, 'blackjack_winning_streak');
                    util.setStats(message, player, 0, 'blackjack_losing_streak');
                } else if (isPlayerBlackJack) {
                    let winnings = Math.floor(1.5 * bet * 100) / 100;
                    let transaction = util.addStats(msg, player, winnings, 'coins');
                    let result = this.awardWinningStats(msg, player, winnings, bet);
                    util.addStats(message, player, 1, 'blackjack_blackjacks');
                    embed.setColor(Colors.GREEN);
                    embed.addField('Additional Info', [`Congrats! You got a blackjack. Your payout is 3:2.`, `Win Streak: ${util.addCommas(result.winStreak)}${result.newRecord ? ' (new personal best!)' : ''}`, `Your bet: ${util.addCommas(bet)}`, `Payout: ${util.addCommas(winnings)}`, `Coins: ${util.addCommas(transaction.oldPoints)} » ${util.addCommas(transaction.newPoints)}`]);
                } else if (isComputerBlackJack) {
                    let losings = bet;
                    let transaction = util.addStats(msg, player, -losings, 'coins');
                    let result = this.awardLosingStats(msg, player, losings, bet);
                    embed.setColor(Colors.MEDIUM_RED);
                    embed.addField('Additional Info', [`Sorry, you lose your bet. The dealer got a blackjack and won.`, `Losing Streak: ${util.addCommas(result.losingStreak)}${result.newRecord ? ' (new personal best!)' : ''}`, `Your bet: ${util.addCommas(bet)}`, `Coins: ${util.addCommas(transaction.oldPoints)} » ${util.addCommas(transaction.newPoints)}`]);
                } else if (playerValue > computerValue && playerValue <= 21) {
                    let winnings = bet;
                    let transaction = util.addStats(msg, player, winnings, 'coins');
                    let result = this.awardWinningStats(msg, player, winnings, bet);
                    embed.setColor(Colors.MEDIUM_GREEN);
                    embed.addField('Additional Info', [`Congrats! You beat the dealer. Your payout is 1:1.`, `Win Streak: ${util.addCommas(result.winStreak)}${result.newRecord ? ' (new personal best!)' : ''}`, `Your bet: ${util.addCommas(bet)}`, `Coins: ${util.addCommas(transaction.oldPoints)} » ${util.addCommas(transaction.newPoints)}`]);
                } else if (computerValue > 21) {
                    let winnings = bet;
                    let transaction = util.addStats(msg, player, winnings, 'coins');
                    let result = this.awardWinningStats(msg, player, winnings, bet);
                    embed.setColor(Colors.MEDIUM_GREEN);
                    embed.addField('Additional Info', [`Dealer busts! You win! Your payout is 1:1.`, `Win Streak: ${util.addCommas(result.winStreak)}${result.newRecord ? ' (new personal best!)' : ''}`, `Your bet: ${util.addCommas(bet)}`, `Coins: ${util.addCommas(transaction.oldPoints)} » ${util.addCommas(transaction.newPoints)}`]);
                } else {
                    let losings = bet;
                    let transaction = util.addStats(msg, player, -losings, 'coins');
                    let result = this.awardLosingStats(msg, player, losings, bet);
                    embed.setColor(Colors.MEDIUM_RED);
                    embed.addField('Additional Info', [`Sorry, you lose your bet. The dealer wins.`, `Losing Streak: ${util.addCommas(result.losingStreak)}${result.newRecord ? ' (new personal best!)' : ''}`, `Your bet: ${util.addCommas(bet)}`, `Coins: ${util.addCommas(transaction.oldPoints)} » ${util.addCommas(transaction.newPoints)}`]);
                }
                util.sendMessage(util.getLogChannel(msg), embed);
            } else if (!isComputerThinking) {
                embed.addField('React With', `${HIT_EMOJI} to hit\n${STAND_EMOJI} to stand`)
            } else {
                embed.addField(`${util.fixNameFormat(msg.guild.me.displayName)}`, 'Is thinking...');
            }
            return embed;
        }

        this.awardWinningStats = (message, player, winnings, bet) => {
            util.addStats(message, player, 1, 'blackjack_played');
            util.addStats(message, player, 1, 'blackjack_wins');
            let result = util.addStats(message, player, winnings, 'coins_earned_in_blackjack');
            util.addStats(message, player, bet, 'coins_bet_in_blackjack');
            util.setStats(message, player, result.newPoints - util.getStats(message, player, 'coins_lost_in_blackjack'), 'blackjack_net_earnings');
            util.setStats(message, player, 0, 'blackjack_losing_streak');
            let winStreak = util.addStats(message, player, 1, 'blackjack_winning_streak').newPoints;
            let newRecord = false;
            if (winStreak > util.getStats(message, player, 'blackjack_longest_win_streak')) {
                newRecord = true;
                util.setStats(message, player, winStreak, 'blackjack_longest_win_streak');
            }
            return {winStreak: winStreak, newRecord: newRecord};
        }

        this.awardLosingStats = (message, player, losings, bet) => {
            util.addStats(message, player, 1, 'blackjack_played');
            util.addStats(message, player, 1, 'blackjack_losses');
            let result = util.addStats(message, player, losings, 'coins_lost_in_blackjack');
            util.addStats(message, player, bet, 'coins_bet_in_blackjack');
            util.setStats(message, player, util.getStats(message, player, 'coins_earned_in_blackjack') - result.newPoints, 'blackjack_net_earnings');
            util.setStats(message, player, 0, 'blackjack_winning_streak');
            let losingStreak = util.addStats(message, player, 1, 'blackjack_losing_streak').newPoints;
            let newRecord = false;
            if (losingStreak > util.getStats(message, player, 'blackjack_longest_losing_streak')) {
                newRecord = true;
                util.setStats(message, player, losingStreak, 'blackjack_longest_losing_streak');
            }
            return {losingStreak: losingStreak, newRecord: newRecord};
        }

        /**
         * Checks if the hand is a blackjack.
         * 
         * @param {array} cards the hand you want to know
         * @returns {boolean} true if the hand is 21 points and only contains 2 cards
         */
        this.isBlackJack = (cards) => {
            return this.isTwentyOne(cards) && cards.length === 2;
        }

        /**
         * Checks if the hand is worth 21 points.
         * 
         * @param {array} cards the hand you want to know
         * @returns true if the cards are worth 21 points
         */
        this.isTwentyOne = (cards) => {
            return this.computeValue(cards).value === 21;
        }

        this.isBust = (cards) => {
            return this.computeValue(cards).value > 21;
        }

        this.dealerMove = (msg, message_, cards, playerHand, dealerHand, bet) => {
            let dealerValue = this.computeValue(dealerHand);
            if (this.computeValue(playerHand).value >= dealerValue.value && ((dealerValue.isSoft && dealerValue.value < 21) || (!dealerValue.isSoft && dealerValue.value < 17))) {
                // Dealer hits
                let randCard = this.drawRandomCard(cards);
                dealerHand.push(randCard);
                let dealerValue = this.computeValue(dealerHand);
                message_.edit(this.getBlackJackEmbed(message_, playerHand, computerHand, false, `The dealer is programmed to hit. They draw a ${this.cardToString(randCard)}.`, bet, false, true, msg.member));
                setTimeout(() => {
                    this.dealerMove(msg, message_, cards, playerHand, dealerHand, bet);
                }, this.skipDealer ? 0 : DEALER_MOVE_DELAY);
            } else if (this.computeValue(dealerHand).value > 21) {
                message_.edit(this.getBlackJackEmbed(message_, playerHand, computerHand, false, `Congratulations!`, bet, true, false, msg.member));
            } else {
                // Dealer chooses to stand.
                message_.edit(this.getBlackJackEmbed(message_, playerHand, computerHand, false, `The dealer is programmed to stand.`, bet, true, false, msg.member));
            }
        }

        if (args[2]) {
            throw 'Too many arguments!';    
        }

        let bet = 0;
        if (args[0].toLowerCase() === 'all') {
            bet = util.getStats(message, message.member, 'coins');
            if (!bet) {
                util.sendMessage(message.channel, 'You have no coins.');
                return;
            }
        } else if (args[0].toLowerCase() === 'half') {
            bet = util.getStats(message, message.member, 'coins');
            bet /= 2;
            bet = Math.floor(bet * 100) / 100;
            if (!bet) {
                util.sendMessage(message.channel, 'You have no coins.');
                return;
            }
        } else {
            bet = util.convertNumber(args[0]);
            bet = Math.floor(bet * 100) / 100;
        }

        if (bet <= 0) {
            throw 'Invalid bet!';
        }

        this.skipDealer = false;
        if (args[1]) {
            if (args[1].toLowerCase() === 'true') {
                this.skipDealer = true;
            }
        }

        let balance = util.getStats(message, message.member, 'coins');
        if (bet > balance) {
            util.sendTimedMessage(message.channel, `You do not have enough coins. You bet ${util.addCommas(bet)}, but you only have ${util.addCommas(balance)}.`, config.delete_delay);
            util.safeDelete(message, config.delete_delay);
            return;
        }

        // Draw 2 cards. Player, dealer, player, dealer
        playerHand.push(this.drawRandomCard(cards));
        computerHand.push(this.drawRandomCard(cards));
        playerHand.push(this.drawRandomCard(cards));
        computerHand.push(this.drawRandomCard(cards));

        // Case: Instant BlackJack
        let isPlayerBlackJack = this.isBlackJack(playerHand);
        if (isPlayerBlackJack) {
            let note = 'BLACKJACK!'
            if (this.isBlackJack(computerHand)) {
                note += " But the dealer also got a BlackJack. So it's a tie.";
            } else {
                // award points
            }
            util.sendMessage(message.channel, this.getBlackJackEmbed(message, playerHand, computerHand, false, note, bet, true, false, message.member));
            return;
        }
        util.sendMessage(message.channel, this.getBlackJackEmbed(message, playerHand, computerHand, true, "It's your turn.", bet, false, false, message.member))
            .then(msg => {
                msg.react(HIT_EMOJI).then(() => {
                    msg.react(STAND_EMOJI)
                })
                    .then(() => {
                        const collector = msg.createReactionCollector((reaction, user) => {
                            return user.id === message.member.id;
                        }, { idle: TIMEOUT })

                        collector.on('collect', reaction => {
                            if (reaction.emoji.name === STAND_EMOJI) {
                                let doesDealerHaveTurn = this.computeValue(playerHand).value <= 21;
                                msg.edit(this.getBlackJackEmbed(message, playerHand, computerHand, false, `You choose to stand.${doesDealerHaveTurn ? " It is the dealer's turn." : ''} ${this.computeValue(playerHand).value > 21 ? ` Bust!\nYou lost your bet of ${util.addCommas(bet)} coins.` : ''}`, bet, !doesDealerHaveTurn, doesDealerHaveTurn, message.member))
                                collector.stop();
                                if (doesDealerHaveTurn) {
                                    setTimeout(() => {
                                        this.dealerMove(message, msg, cards, playerHand, computerHand, bet)
                                    }, this.skipDealer ? 0 : DEALER_MOVE_DELAY)
                                }
                            } else if (reaction.emoji.name === HIT_EMOJI) {
                                let draw = this.drawRandomCard(cards);
                                playerHand.push(draw);
                                if (this.computeValue(playerHand).value >= 21) {
                                    let playerValue = this.computeValue(playerHand);
                                    let dealerValue = this.computeValue(computerHand);
                                    msg.edit(this.getBlackJackEmbed(msg, playerHand, computerHand, false, `You drew a ${this.cardToString(draw)}!${playerValue.value > 21 ? ` Bust!\nYou lost your bet of ${util.addCommas(bet)} coins.` : (playerValue.value >= 21 ? ` Your turn has automatically ended becuase your hand is worth 21.` : '')}`, bet, playerValue.value > 21 || !(playerValue.value > dealerValue.value && ((dealerValue.isSoft && dealerValue.value < 21) || (!dealerValue.isSoft && dealerValue.value <= 17)) && playerValue.value <= 21), playerValue.value <= 21, message.member))
                                    collector.stop();
                                    if (playerValue.value > dealerValue.value && ((dealerValue.isSoft && dealerValue.value < 21) || (!dealerValue.isSoft && dealerValue.value <= 17)) && playerValue.value <= 21) {
                                        setTimeout(() => {
                                            this.dealerMove(message, msg, cards, playerHand, computerHand, bet)
                                        }, this.skipDealer ? 0 : DEALER_MOVE_DELAY)
                                    } 
                                } else {
                                    msg.edit(this.getBlackJackEmbed(msg, playerHand, computerHand, true, `You drew a ${this.cardToString(draw)}!${this.computeValue(playerHand).value > 21 ? ` Bust!\nYou lost your bet of ${util.addCommas(bet)} coins.` : ''}`, bet, false, false, message.member))
                                    reaction.users.remove(reaction.users.cache.filter(user => user.id === message.member.id).first().id);
                                }
                            }
                        })

                        collector.on('end', collected => {
                            msg.reactions.removeAll();
                            if (collected.size === 0) {
                                util.sendMessage(message.channel, `Why didn't you click anything within ${TIMEOUT / 1000} seconds? You automatically stand.`);
                                let doesDealerHaveTurn = this.computeValue(playerHand).value <= 21;
                                msg.edit(this.getBlackJackEmbed(message, playerHand, computerHand, false, `You choose to stand.${doesDealerHaveTurn ? " It is the dealer's turn." : ''} ${this.computeValue(playerHand).value > 21 ? ` Bust!\nYou lost your bet of ${util.addCommas(bet)} coins.` : ''}`, bet, !doesDealerHaveTurn, doesDealerHaveTurn, message.member))
                                collector.stop();
                                if (doesDealerHaveTurn) {
                                    setTimeout(() => {
                                        this.dealerMove(message, msg, cards, playerHand, computerHand, bet)
                                    }, this.skipDealer ? 0 : DEALER_MOVE_DELAY)
                                }
                            }
                        })
                    })
            });
    }
}