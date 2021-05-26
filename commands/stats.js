const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Discord = require("discord.js");
const Colors = require('../resources/colors.json')

module.exports = {
    name: ['stats', 'points', 'mypoints', 'mystats', 'balance', 'checkbalance', 'coins', 'profile', 'bal'],
    description: 'Tells you how many points you have.',
    usage: `(optional: user) (optional: dontDelete? true/false)`,

    execute(bot, message, args, channel) {
        let dontDelete = false;
        if (args.length != 0 && args[args.length - 1].toLowerCase() === 'true') {
            dontDelete = true;
            args.pop();
        }

        let target;
        if (args.length != 0) {
            target = util.getUserFromMention(message, args.join(' '));
            if (!target && args.length > 1) {
                target = util.getUserFromMention(message, args.slice(0, -1).join(' '));
            }
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

            let coinsAndPointsInfo = [`:medal: Points: ${util.addCommas(userStats['points'])}`,
            `💰 Coins: ${util.addCommas(userStats['coins'])}`,
            `:tickets: Tickets: ${util.addCommas(userStats['tickets'])}`];

            let discordParticipationInfo = [`:scroll: participating_messages: ${util.addCommas(userStats['participating_messages'])}`,
            `:headphones: time_spent_in_vc: ${util.toFormattedTime(userStats['time_spent_in_vc'])}`];

            let dailyRewardsInfo = userStats['daily_rewards_claimed'] ? [
                `daily_rewards_streak: ${util.addCommas(userStats['daily_rewards_streak'])}`,
                `daily_rewards_claimed: ${util.addCommas(userStats['daily_rewards_claimed'])}`,
                `daily_reward_last_claimed: ${new Date(userStats['daily_reward_last_claimed'])}`
            ] : `\`${config.prefix}daily\` has not been used yet!`;

            let rouletteStatNames = ['roulette_played', 'roulette_wins', 'roulette_losses', 'coins_bet_in_roulette',
                'coins_earned_in_roulette', 'coins_lost_in_roulette', 'net_roulette_earnings', 'roulette_safety_net_saves',
                'roulette_longest_win_streak', 'roulette_longest_losing_streak', 'roulette_winning_streak', 'roulette_losing_streak']
            let rouletteStats = userStats['roulette_played'] ?
                rouletteStatNames.map(statName => `${statName}: ${util.addCommas(userStats[statName])}`) :
                `\`${config.prefix}roulette\` has not been used yet!`;

            let blackjackStatNames = ['blackjack_played', 'blackjack_wins', 'blackjack_blackjacks', 'blackjack_tied', 'blackjack_losses',
                'coins_bet_in_blackjack', 'coins_earned_in_blackjack', 'coins_lost_in_blackjack', 'blackjack_net_earnings', 'blackjack_safety_net_saves',
                'blackjack_longest_win_streak', 'blackjack_longest_losing_streak', 'blackjack_winning_streak', 'blackjack_losing_streak']
            let blackjackStats = userStats[blackjackStatNames[0]] ?
                blackjackStatNames.map(statName => `${statName}: ${util.addCommas(userStats[statName])}`) :
                `\`${config.prefix}blackjack\` has not been used yet!`;

            let coinflipStatNames = ['coinflip_played', 'coinflip_wins', 'coinflip_losses', 'coins_bet_in_coinflip', 'coins_earned_in_coinflip',
                'coins_lost_in_coinflip', 'coinflip_net_earnings', 'coinflip_longest_win_streak', 'coinflip_longest_losing_streak', 'coinflip_winning_streak',
                'coinflip_winning_streak', 'coinflip_losing_streak']
            let coinflipStats = userStats['coinflip_played'] ?
                coinflipStatNames.map(statName => `${statName}: ${util.addCommas(userStats[statName])}`) :
                `\`${config.prefix}coinflip\` has not been used yet!`;

            let excluded = ['points', 'coins', 'tickets', 'participating_messages', 'time_spent_in_vc', 'daily_rewards_claimed', 'daily_reward_last_claimed', 'daily_rewards_streak',
                ...rouletteStatNames, ...blackjackStatNames, ...coinflipStatNames
            ];
            let properties = Object.keys(userStats).filter(name => !excluded.includes(name));

            let upgradeNames = properties.filter(name => name.startsWith('upgrade_'));
            let upgrades = upgradeNames.length > 0 ?
                upgradeNames.map(statName => `${statName}: ${util.addCommas(userStats[statName])}`) :
                `\`${config.prefix}shop upgrade\` has not been used yet!`;

            properties = properties.filter(name => !name.startsWith('upgrade_'));

            let info = [];
            for (var i = 0; i < properties.length; i++) {
                if (properties[i] !== 'last_message' && properties[i] !== 'vc_session_started') {
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

            let embed = new Discord.MessageEmbed()
                .setColor(Colors.YELLOW)
                .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                .addField('Profile', coinsAndPointsInfo, true)
                .addField('Discord Participation', discordParticipationInfo, true)
                .addField('Daily Rewards', dailyRewardsInfo)
                .addField('Roulette Stats', rouletteStats, true)
                .addField('BlackJack Stats', blackjackStats, true)
                .addField('Coinflip Stats', coinflipStats)
                .addField('Upgrades', upgrades)
                .addField('Point Insights', info)
                .setTimestamp()

            if (dontDelete) {
                util.sendMessage(message.channel, embed);
            } else {
                util.sendTimedMessage(message.channel, embed
                    .setFooter(`This message will be automatically deleted in ${config.longest_delete_delay / 1000} seconds.`),
                    config.longest_delete_delay)
                util.safeDelete(message, config.longest_delete_delay);
            }
        } catch (err) {
            util.sendTimedMessage(channel || message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}