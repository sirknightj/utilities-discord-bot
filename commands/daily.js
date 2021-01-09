const config = require('../config.json');
const util = require('../utilities');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: 'daily',
    description: 'Claim some free coins every 23 hours!',
    usage: "",
    execute(bot, message, args) {
        if (!config) {
            console.log("Cannot locate config.json.");
            return;
        }
        if (!config.greeting_messages_to_say) {
            console.log("Missing property greeting_messages_to_say in config.json.");
            return;
        }
        if (!config.enable_daily_rewards) {
            util.sendMessage(message.channel, 'Sorry, daily rewards are currently disabled.');
            return;
        }
        if (!config.daily_reward_coin_amount) {
            util.console.log(message.channel, 'Missing property daily_reward_coin_amount in config.json.');
            return;
        }

        let whenClaimed = util.getStats(message, message.member, 'daily_reward_last_claimed');
        let now = Date.now();
        let difference = now - whenClaimed;

        if (!whenClaimed || difference >= 82800000) { // 23 hours = 82,800,000 ms
            let streakResult;
            if (!whenClaimed || difference <= 172800000) { // 48 hours = 172,800,000 ms
                // Streak maintained. Increase by 1.
                streakResult = util.addStats(message, message.member, 1, 'daily_rewards_streak'); 
            } else {
                // Streak broken. Set to 1.
                streakResult = util.addStats(message, message.member, -util.getStats(message, message.member, 'daily_rewards_streak') + 1, 'daily_rewards_streak');
            }
            let coinsToAward;
            if (streakResult.newPoints > 11) { // Half the growth after 11 days (10 days in a row).
                coinsToAward = config.daily_reward_coin_amount + 10 * config.daily_reward_coin_increment_per_streak_day + config.daily_reward_coin_increment_per_streak_day * (streakResult.newPoints - 11) / 2;
            } else {
                coinsToAward = config.daily_reward_coin_amount + (streakResult.newPoints - 1) * config.daily_reward_coin_increment_per_streak_day;
            }
            coinsToAward = Math.round(coinsToAward * 100) / 100;
            let coinTransaction = util.addStats(message, message.member, coinsToAward, 'coins');

            let additionalInfo = [
                `Coins: ${util.addCommas(coinTransaction.oldPoints)} » ${util.addCommas(coinTransaction.newPoints)}`,
                `Streak: ${util.addCommas(streakResult.oldPoints)} » ${util.addCommas(streakResult.newPoints)}`
            ];

            if (streakResult.newPoints === 1 && streakResult.oldPoints !== 0) {
                additionalInfo.push(`Previously claimed: ${util.toFormattedTime(difference)}`, `At: ${new Date(whenClaimed)}`);
            }
           
            util.addStats(message, message.member, difference, 'daily_reward_last_claimed');
            util.addStats(message, message.member, 1, 'daily_rewards_claimed');
            let embed = new Discord.MessageEmbed()
                .setTitle(`${message.member.displayName} has claimed their daily reward!`)
                .setColor(Colors.YELLOW)
                .setDescription([`${message.member.displayName} has been awarded ${coinsToAward} coin${coinsToAward === 1 ? '' : 's'}.`, 
                    `${streakResult.newPoints > streakResult.oldPoints ? (streakResult.oldPoints === 0 ? "Streak started!" : "Streak maintained!") : "Streak reset!"}`])
                .addField('Additional Info', additionalInfo)
                .setTimestamp(now)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

            // Says a randomized hello greeting specified in config.json.
            if (config.greeting_messages_to_say) {
                if (typeof config.greeting_messages_to_say === 'string') {
                    config.greeting_messages_to_say = [config.greeting_messages_to_say];
                }
                util.sendMessage(message.channel, `${message.member.displayName}, ${config.greeting_messages_to_say[Math.floor(Math.random() * config.greeting_messages_to_say.length)]}`);
            }

            // Sends the coin transaction to this channel.
            util.sendMessage(message.channel, embed);

            // Sends the coin transaction to the logs.
            if (config.log_channel_id) {
                util.sendMessage(util.getLogChannel(message), embed);
            }
        } else {
            util.sendTimedMessage(message.channel, new Discord.MessageEmbed()
                .setTitle('Not time yet')
                .setColor(Colors.GOLD)
                .setDescription([`Sorry, ${util.fixNameFormat(message.member.displayName)}, it hasn't been 23 hours yet since you last claimed your daily reward.`,
                    `You need to wait ${util.toFormattedTime(whenClaimed + 82800000 - Date.now())}.`
                    ])
                .addField('Additional Info', [`You last claimed it at ${new Date(whenClaimed)}`,
                `You can claim it again on ${new Date(whenClaimed + 82800000)}`])
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter(`This message will automatically be deleted in ${config.longer_delete_delay / 1000} seconds.`), config.longer_delete_delay);
            util.safeDelete(message);
        }
    }
}