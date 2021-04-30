const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Discord = require("discord.js");
const Colors = require('../resources/colors.json')

module.exports = {
    name: ['stats', 'points', 'mypoints', 'mystats', 'balance', 'checkbalance', 'coins', 'profile', 'bal'],
    description: 'Tells you how many points you have.',
    usage: `(optional: user)`,

    execute(bot, message, args, channel) {
        var target;
        if (args.length != 0) {
            target = util.getUserFromMention(message, args.join(' '));
        } else {
            target = message.member;
        }

        // util.safeDelete(message);
        if (!target) {
            util.sendTimedMessage(channel || message.channel, `Error: Cannot find user ${args.join(' ')}`);
            return;
        }

        try {
            var allStats = {};
            const fileLocation = `${config.resources_folder_file_path}stats.json`;

            if (fs.existsSync(fileLocation)) {
                allStats = jsonFile.readFileSync(fileLocation);
            } else {
                util.sendTimedMessage(channel || message.channel, "stats.json has not been properly configured.");
                return;
            }

            const userStats = (allStats[message.guild.id])[target.user.id];

            if (!userStats) {
                util.sendTimedMessage(channel || message.channel, `${target.displayName} has 0 points.`);
                return;
            }

            let excluded = ['points', 'coins', 'participating_messages', 'time_spent_in_vc', 'daily_rewards_claimed', 'daily_reward_last_claimed', 'daily_rewards_streak',
            'roulette_wins', 'roulette_losses', 'coins_bet_in_roulette', 'coins_earned_in_roulette', 'roulette_played', 'tickets',
            'coins_lost_in_roulette', 'net_roulette_earnings', 'roulette_safety_net_saves', 'roulette_longest_win_streak', 
            'roulette_longest_win_streak', 'roulette_longest_losing_streak', 'roulette_winning_streak', 'roulette_losing_streak'];
            let properties = Object.keys(userStats).filter(name => !excluded.includes(name));

            let coinsAndPointsInfo = [`:medal: Points: ${util.addCommas(userStats['points'])}`,
            `:moneybag: Coins: ${util.addCommas(userStats['coins'])}`,
            `:tickets: Tickets: ${util.addCommas(userStats['tickets'])}`];

            let discordParticipationInfo = [`:scroll: participating_messages: ${util.addCommas(userStats['participating_messages'])}`,
            `:headphones: time_spent_in_vc: ${util.toFormattedTime(userStats['time_spent_in_vc'])}`];

            let dailyRewardsInfo = userStats['daily_rewards_claimed'] ? [`daily_rewards_streak: ${util.addCommas(userStats['daily_rewards_streak'])}`,
            `daily_rewards_claimed: ${util.addCommas(userStats['daily_rewards_claimed'])}`,
            `daily_reward_last_claimed: ${new Date(userStats['daily_reward_last_claimed'])}`
            ] : `\`${config.prefix}daily\` has not been used yet!`;

            let rouletteStats = userStats['roulette_played'] ? [`roulette_played: ${util.addCommas(userStats['roulette_played'])}`,
            `roulette_wins: ${util.addCommas(userStats['roulette_wins'])}`,
            `roulette_losses: ${util.addCommas(userStats['roulette_losses'])}`,
            `coins_bet_in_roulette: ${util.addCommas(userStats['coins_bet_in_roulette'])}`,
            `coins_earned_in_roulette: ${util.addCommas(userStats['coins_earned_in_roulette'])}`,
            `coins_lost_in_roulette: ${util.addCommas(userStats['coins_lost_in_roulette'])}`,
            `net_roulette_earnings: ${util.addCommas(userStats['net_roulette_earnings'])}`,
            `roulette_safety_net_saves: ${util.addCommas(userStats['roulette_safety_net_saves'])}`,
            `roulette_longest_win_streak: ${util.addCommas(userStats['roulette_longest_win_streak'])}`,
            `roulette_longest_losing_streak: ${util.addCommas(userStats['roulette_longest_losing_streak'])}`,
            `roulette_winning_streak: ${util.addCommas(userStats['roulette_winning_streak'])}`,
            `roulette_losing_streak: ${util.addCommas(userStats['roulette_losing_streak'])}`
            ] : `\`${config.prefix}roulette\` has not been used yet!`;

            let info = [];
            for (var i = 0; i < properties.length; i++) {
                if (properties[i] !== 'last_message' && properties[i] !== 'vc_session_started' && properties[i] !== 'points' && properties[i] !== 'coins' && properties[i] !== 'participating_messages' && properties[i] !== 'time_spent_in_vc') {
                    if (properties[i] === 'daily_reward_last_claimed') {
                        info.push(`${properties[i]}: ${new Date(userStats[properties[i]])}`);
                    } else {
                        info.push(`${properties[i]}: ${util.addCommas(userStats[properties[i]])}`);
                    }
                }
            }

            if (!info.length) {
                info.push('Nothing here...');
            }

            util.sendMessage(message.channel, new Discord.MessageEmbed()
                .setColor(Colors.YELLOW)
                .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                .addField('Profile', coinsAndPointsInfo, true)
                .addField('Discord Participation', discordParticipationInfo, true)
                .addField('Daily Rewards', dailyRewardsInfo)
                .addField('Roulette Stats', rouletteStats)
                .addField('Point Insights', info)
                .setTimestamp()
                // .setFooter(`This message will be automatically deleted in ${config.longer_delete_delay / 1000} seconds.`), config.longer_delete_delay
            )
        } catch (err) {
            util.sendTimedMessage(channel || message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}