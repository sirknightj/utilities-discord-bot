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

        if (!whenClaimed || now - whenClaimed >= 82800000) { // 23 hours = 82,800,000 ms
            util.addStats(message, message.member, now - whenClaimed, 'daily_reward_last_claimed');
            let coinTransaction = util.addStats(message, message.member, config.daily_reward_coin_amount, 'coins');

            let embed = new Discord.MessageEmbed()
                .setTitle(`${message.member.displayName} has claimed their daily reward!`)
                .setColor(Colors.YELLOW)
                .setDescription(`${message.member.displayName} has been awarded ${config.daily_reward_coin_amount} coin${config.daily_reward_coin_amount === 1 ? '' : 's'}.`)
                .addField('Additional Info', [
                    `Before: ${util.addCommas(coinTransaction.oldPoints)} coins`,
                    `Now: ${util.addCommas(coinTransaction.newPoints)} coins`
                ])
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
                    `You last claimed it at ${new Date(whenClaimed)}`,
                    `You can claim it again on ${new Date(whenClaimed + 82800000)}`])
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter(`This message will automatically be deleted in ${config.longer_delete_delay / 1000} seconds.`), config.longer_delete_delay);
            util.safeDelete(message);
        }
    }
}