const config = require('../config.json');
const util = require('../utilities');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

const DAILY_COIN_BONUS_PER_LEVEL = 0.05; // 5% per level

module.exports = {
    name: ['daily', 'd'],
    description: 'Claim some free coins every 23 hours!',
    usage: "",
    execute(bot, message, args) {
        this.handleDaily(message, 'daily');
    },
    /**
     * Handles when someone claims a daily.
     * 
     * @param {Discord.Message} message a message
     * @param {string} type type of daily 
     * @param {boolean} shouldDeleteOnTooSoon true if the 'too soon' message should be deleted 
     * @param {number} now milliseconds elapsed since January 1, 1970 of when the daily should be claimed
     * @returns 
     */
    async handleDaily(message, type, target, shouldDeleteOnTooSoon = false, now = message.createdTimestamp) {
        let validTypes = ['daily', 'weekly', 'monthly', 'yearly'];
        if (!validTypes.includes(type)) {
            console.log('Invalid type provided! See daily.js line 18.');
            return;
        }

        if (!config) {
            console.log("Cannot locate config.json.");
            return;
        }
        if (!config.greeting_messages_to_say) {
            console.log("Missing property greeting_messages_to_say in config.json.");
            return;
        }
        if (!config[`enable_${type}_rewards`]) {
            util.sendMessage(message.channel, `Sorry, ${type} rewards are currently disabled.`);
            return;
        }
        if (!config[`${type}_reward_coin_amount`]) {
            util.console.log(message.channel, `Missing property ${type}_reward_coin_amount in config.json.`);
            return;
        }
        
        if (!target) {
            target = message.member;
        }

        if (!target.user) {
            target = await message.guild.members.fetch(message.member.id);
        }

        let whenClaimed = util.getStats(message, target, [`${type}_reward_last_claimed`]);
        let difference = now - whenClaimed;

        let cooldown = Math.round(config[`${type}_reward_cooldown`] * (100 - 2 * util.getStats(message, target, 'upgrade_daily_reward_cooldown'))) / 100;
        let gracePeriod = Math.round(config[`${type}_reward_streak_grace_period`] * (1 + util.getStats(message, target, 'upgrade_daily_reward_extended_grace') * 0.25));
        let continueStreak = false;

        if (!whenClaimed || difference >= cooldown) {
            let streakResult;
            if (!whenClaimed || difference <= gracePeriod) {
                // Streak maintained. Increase by 1.
                streakResult = util.addStats(message, target, 1, `${type}_rewards_streak`); 
            } else {
                let currentStreak = util.getStats(message, target, `${type}_rewards_streak`);
                let myCoins = util.getStats(message, target, "coins");
                let myTickets = util.getStats(message, target, "tickets");
                if (currentStreak == 0) {
                    streakResult = util.setStats(message, target, 1, `${type}_rewards_streak`);
                } else {
                    let coinCost = Math.ceil(myCoins * 90) / 100;
                    let ticketCost = Math.ceil(myTickets * 90) / 100;
                    continueStreak = await util.askUser(message.channel, target.user, new Discord.MessageEmbed()
                        .setTitle("Oh no!")
                        .setDescription(`You were \`${util.toFormattedTime(now - gracePeriod - whenClaimed)}\`${util.getStats(message, target, 'upgrade_daily_reward_extended_grace') > 0 ? ` [lv ${util.addCommas(util.getStats(message, target, 'upgrade_daily_reward_extended_grace'))}]` : ''} too late.\n\nWould you like to maintain a ${type} streak of ${util.addCommas(currentStreak)} for ${util.addCommas(coinCost)} coin${coinCost === 1 ? '' : 's'} and ${util.addCommas(ticketCost)} ticket${ticketCost === 1 ? '' : 's'}?\nYou have **60s** to decide.`)
                        .setColor(Colors.RED)
                        .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                        .setFooter(`You have 💰 ${util.addCommas(myCoins)} coin${myCoins === 1 ? '' : 's'} and ${"🎟️"} ${util.addCommas(myTickets)} ticket${myTickets === 1 ? '' : 's'}.`)
                        .setTimestamp(), 60000);
                    if (continueStreak) {
                        let coint = { oldPoints: 0, newPoints: 0 };
                        if (myCoins) {
                            coint = util.addStats(message, target, -coinCost, "coins");
                        }
                        let tickett = { oldPoints: 0, newPoints: 0};
                        if (myTickets) {
                            tickett = util.addStats(message, target -ticketCost, "tickets");
                        }
                        let continueEmbed = new Discord.MessageEmbed()
                            .setTitle("Streak Restoration!")
                            .setDescription(`${util.fixNameFormat(target.displayName)} paid 💰 ${util.addCommas(coinCost)} coin${myCoins === 1 ? '' : 's'} and ${"🎟️"} ${util.addCommas(myTickets)} ticket${myTickets === 1 ? '' : 's'} to maintain a streak of ${util.addCommas(currentStreak)}.`)
                            .setColor(Colors.BLUE)
                            .addField('Additional Info', [
                                `Coins: ${util.addCommas(coint.oldPoints)} » ${util.addCommas(coint.newPoints)}`,
                                `Tickets: ${util.addCommas(tickett.oldPoints)} » ${util.addCommas(tickett.newPoints)}`
                            ])
                            .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                            .setTimestamp();
                        await util.sendMessage(message.channel, continueEmbed);
                        await util.sendMessage(util.getLogChannel(message), continueEmbed);
                        streakResult = util.addStats(message, target, 1, `${type}_rewards_streak`);
                    } else {
                        await util.sendMessage(message.channel, "Reset!");
                        streakResult = util.setStats(message, target, 1, `${type}_rewards_streak`);
                    }
                }
                
            }
            let coinsToAward;
            if (streakResult.newPoints > 11) { // Half the growth after 11 days (10 days in a row).
                coinsToAward = config[`${type}_reward_coin_amount`] + 10 * config[`${type}_reward_coin_increment_per_streak_day`] + config[`${type}_reward_coin_increment_per_streak_day`] * (streakResult.newPoints - 11) / 2;
            } else {
                coinsToAward = config[`${type}_reward_coin_amount`] + (streakResult.newPoints - 1) * config[`${type}_reward_coin_increment_per_streak_day`];
            }
            if (type === 'monthly') {
                coinsToAward += Math.log(util.getStats(message, target, 'points')) / Math.log(1.003);
            } 
            coinsToAward *= (1 + (util.getStats(message, target, 'upgrade_daily_reward_coin_bonus') * DAILY_COIN_BONUS_PER_LEVEL));
            coinsToAward = Math.round(coinsToAward * 100) / 100;
            let coinTransaction = util.addStats(message, target, coinsToAward, 'coins');

            let additionalInfo = [
                `Coins: ${util.addCommas(coinTransaction.oldPoints)} » ${util.addCommas(coinTransaction.newPoints)}`,
                `Streak: ${util.addCommas(streakResult.oldPoints)} » ${util.addCommas(streakResult.newPoints)}`
            ];

            if (streakResult.oldPoints !== 0) {
                additionalInfo.push(`Previously claimed: \`${util.toFormattedTime(difference)}\``, `At: <t:${Math.floor(whenClaimed / 1000)}:F>`);
                if (streakResult.newPoints > 1 && !continueStreak) {
                    additionalInfo.push(`You had \`${util.toFormattedTime(gracePeriod - difference)}\`${util.getStats(message, target, 'upgrade_daily_reward_extended_grace') > 0 ? ` [lv ${util.addCommas(util.getStats(message, target, 'upgrade_daily_reward_extended_grace'))}]` : ''} to spare`, `And _could_ have claimed it \`${util.toFormattedTime(Date.now() - cooldown - whenClaimed)}\`${util.getStats(message, target, 'upgrade_daily_reward_cooldown') > 0 ? ` [lv ${util.addCommas(util.getStats(message, target, 'upgrade_daily_reward_cooldown'))}]` : ''} sooner`);
                } else {
                    additionalInfo.push(`You were \`${util.toFormattedTime(now - gracePeriod - whenClaimed)}\`${util.getStats(message, target, 'upgrade_daily_reward_extended_grace') > 0 ? ` [lv ${util.addCommas(util.getStats(message, target, 'upgrade_daily_reward_extended_grace'))}]` : ''} too late${continueStreak ? ', but paid for restoration' : ""}.`)
                }
            }
           
            util.addStats(message, target, difference, `${type}_reward_last_claimed`);
            util.addStats(message, target, 1, `${type}_rewards_claimed`);
            let embed = new Discord.MessageEmbed()
                .setTitle(`${target.displayName} has claimed their ${type} reward!`)
                .setColor(Colors.YELLOW)
                .setDescription([`${target.displayName} has been awarded ${util.addCommas(coinsToAward)} coin${coinsToAward === 1 ? '' : 's'}${util.getStats(message, target, 'upgrade_daily_reward_coin_bonus') ? ` (+${DAILY_COIN_BONUS_PER_LEVEL * 100 * util.getStats(message, target, 'upgrade_daily_reward_coin_bonus')}% bonus!)` : '.'}${type === 'yearly' ? '\nWhat, you expected more?' : ''}`, 
                    `${streakResult.newPoints > streakResult.oldPoints ? (streakResult.oldPoints === 0 ? `Streak started!` : "Streak maintained!") : "Streak reset!"}\nYou can claim \`${config.prefix}${type}\` again in \`${util.toFormattedTime(cooldown)}\`${util.getStats(message, target, 'upgrade_daily_reward_cooldown') > 0 ? ` [lv ${util.addCommas(util.getStats(message, target, 'upgrade_daily_reward_cooldown'))}] ` : ''},\non <t:${Math.floor((cooldown + now) / 1000)}:F>.`])
                .addField('Additional Info', additionalInfo)
                .setTimestamp(now)
                .setThumbnail(target.user.displayAvatarURL({ dynamic: true }));

            // Says a randomized hello greeting specified in config.json.
            if (config.greeting_messages_to_say) {
                if (typeof config.greeting_messages_to_say === 'string') {
                    config.greeting_messages_to_say = [config.greeting_messages_to_say];
                }
                util.sendMessage(message.channel, `${target.displayName}, ${config.greeting_messages_to_say[Math.floor(Math.random() * config.greeting_messages_to_say.length)]}`);
            }

            // Sends the coin transaction to this channel.
            util.sendMessage(message.channel, embed);

            // Sends the coin transaction to the logs.
            if (config.log_channel_id) {
                util.sendMessage(util.getLogChannel(message), embed);
            }
        } else {
            let embed = new Discord.MessageEmbed()
            .setTitle('Not time yet')
            .setColor(Colors.GOLD)
            .setDescription([`Sorry, ${util.fixNameFormat(target.displayName)}, it hasn't been \`${util.toFormattedTime(cooldown)}\` ${util.getStats(message, target, 'upgrade_daily_reward_cooldown') > 0 ? `[lv ${util.addCommas(util.getStats(message, target, 'upgrade_daily_reward_cooldown'))}] ` : ''}yet since you last claimed your ${type} reward.`,
                `It's only been \`${util.toFormattedTime(now - whenClaimed)}\`.`,
                `You need to wait \`${util.toFormattedTime(whenClaimed + cooldown - now)}\`.`
                ])
            .addField('Additional Info', [`You last claimed it at <t:${Math.floor(whenClaimed / 1000)}:F>`,
            `You can claim it again on <t:${Math.floor((whenClaimed + cooldown) / 1000)}:F>`])
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            if (shouldDeleteOnTooSoon) {
                util.sendTimedMessage(message.channel, embed.setFooter(`This message will automatically be deleted in ${config.longer_delete_delay / 1000} seconds.`),
                    config.longer_delete_delay);
                util.safeDelete(message);
            } else {
                util.sendMessage(message.channel, embed.setTimestamp(now));
            }
        }
    }
}