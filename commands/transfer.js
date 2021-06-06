const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ['transfer', 'transfercoins', 'givecoins', 'gift'],
    description: 'Gives coins from you to another user. Note: IRL ',
    usage: `<user> <amount>`,
    requiresTarget: true,

    execute(bot, message, args, target) {
        if (!config.allow_coin_transfers) {
            util.sendMessage(message.channel, 'This command is disabled in this server.');
            return;
        }

        if (!args[0]) {
            throw 'Missing <amount>!';
        }

        if (target.id === message.member.id) {
            util.sendMessage(message.channel, 'Nice try, but you cannot gift yourself.');
            return;
        }

        if (args[1] && !(args[1].toLowerCase() === 'coins' || args[1].toLowerCase() === 'coin')) {
            throw 'Too many arguments!';
        }

        let amount = 0;

        let yourCoins = util.getStats(message, message.member, 'coins');
        if (args[0].toLowerCase() === 'all') {
            amount = yourCoins;
        } else if (args[0].toLowerCase() === 'half') {
            amount = Math.floor(yourCoins * 100) / 100;
        } else {
            amount = util.convertNumber(args[0]);
        }

        if (amount <= 0) {
            throw `Invalid amount: \`${args[0]}\`.`;
        }

        if (yourCoins < amount) {
            throw "You don't have enough coins!";
        }

        const confirmationEmbed = new Discord.MessageEmbed()
            .setColor(Colors.BLUE)
            .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .setTitle('Confirmation')
            .setDescription(`Are you sure you want to gift ${target.user.tag} ${util.addCommas(amount)} coin${amount === 1 ? '' : 's'}?`)
            .setFooter(`You have 💰 ${util.addCommas(yourCoins)} coin${amount === 1 ? '' : 's'}.`);

        util.sendMessage(message.channel, confirmationEmbed).then(msg => {
            msg.react('❌')
            .then(() => {
                msg.react('✅');
            })
            .then(() => {
                const collector = msg.createReactionCollector((reaction, user) => {
                    return user.id === message.member.id;
                }, {time: 60000, max: 1})

                collector.on('collect', reaction => {
                    if (reaction.emoji.name === '✅') {
                        const transaction = util.addStats(message, target, amount, 'coins');
                        util.addStats(message, target, amount, 'coins_received');
                        const subtraction = util.addStats(message, message.member, -amount, 'coins');
                        util.addStats(message, message.member, amount, 'coins_gifted');

                        const embed = new Discord.MessageEmbed()
                        .setColor(Colors.MEDIUM_GREEN)
                        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                        .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                        .setTitle('Coin Gift')
                        .setDescription(`${util.fixNameFormat(message.member.displayName)} has gifted ${util.fixNameFormat(target.displayName)} ${util.addCommas(amount)} coin${amount === 1 ? '' : 's'}!`)
                        .setFooter(`RMT for coins is not allowed!`)
                        .addField('Additional Info', [
                            `${util.fixNameFormat(message.member.displayName)}'s coins: ${util.addCommas(subtraction.oldPoints)} » ${util.addCommas(subtraction.newPoints)}`,
                            `${util.fixNameFormat(target.displayName)}'s coins: ${util.addCommas(transaction.oldPoints)} » ${util.addCommas(transaction.newPoints)}`
                        ])
                        .setTimestamp();
                        
                        msg.delete();
                        util.sendMessage(message.channel, embed);
                        util.sendMessage(util.getLogChannel(message), embed);
                    } else {
                        msg.delete();
                        util.sendMessage(message.channel, 'Transaction canceled!');
                    }
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        util.sendMessage(message.channel, `${util.fixNameFormat(message.member.displayName)} did not respond within 60 seconds. The transaction has been canceled.`);
                        msg.delete();
                    }
                });
            });
        });
    }
}