const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');
const updateName = require('./updatename.js');

const cost = 10000;

module.exports = {
    name: ['namechange', 'nickname'],
    description: "Lets you change your nickname!",
    usage: "",
    execute(bot, message, args) {
        this.executor(bot, message, args)
    },

    async executor(bot, message, args) {
        if (!util.getStats(message, message.member, 'upgrade_change_nickname')) {
            let balance = util.getStats(message, message.member, 'coins');
            if (balance < 10000) {
                util.sendMessage(message.channel, `You don't have enough coins to unlock this feature! It costs 10,000 coins to unlock, but you have ${util.addCommas(balance)}!`);
                return;
            }
            let answer = await util.askUser(message.channel, message.member, new Discord.MessageEmbed()
                .setTitle('Shop Purchase')
                .setDescription('Would you like to unlock the ability to change your nickname? It costs 10,000 coins to unlock.')
                .setColor(Colors.LIGHT_BLUE)
                .setTimestamp()
                .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                .setFooter(`You have 💰 ${util.addCommas(balance)} coins.`), config.longer_delete_delay);
            if (answer) {
                let transaction = util.addStats(message, message.member, -10000, 'coins');
                util.sendMessage(message.channel, new Discord.MessageEmbed()
                    .setTitle('Nickname Change Unlocked!')
                    .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Coins: ${util.addCommas(transaction.oldPoints)} » ${util.addCommas(transaction.newPoints)}`)
                    .setColor(Colors.LIGHT_BLUE)
                    .setTimestamp());
                util.addStats(message, message.member, 1, 'upgrade_change_nickname');
            } else {
                util.sendMessage(message.channel, 'Alright then.');
                return;
            }
        }

        if (await util.askUser(message.channel, message.member, new Discord.MessageEmbed()
            .setTitle('Confirmation')
            .setDescription(`Are you sure you want to change your nickname?`)
            .setTimestamp()
            .setColor(Colors.LIGHT_BLUE)
            .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
            , config.longer_delete_delay)) {
            util.sendMessage(message.channel, `What would you like to be added in the \`()\` after your name? To remove it, type in 'none'. If you want to cancel, just wait ${config.longer_delete_delay / 1000}s, or type 'cancel'.`)
            let response = await util.askUserForInput(message.channel, message.member, config.longer_delete_delay);
            console.log('response: ' + response);
            if (!response || response.toLowerCase() === 'cancel') {
                util.sendMessage('Cancelled!');
                return;
            }
            if (response.toLowerCase() === 'none') {
                util.setStats(message, message.member, 0, 'custom_nickname');
            } else {
                util.writeStats(message.member.guild, message.member, response, 'custom_nickname');
            }
            updateName.execute(bot, message, [`${message.member.id}`]);
        } else {
            util.sendMessage(message.channel, 'Cancelled!');
        }
    }
}