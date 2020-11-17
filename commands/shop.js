const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ['shop', 'store'],
    description: 'Lets you purchase items from the store.',
    usage: `purchase <${getAllowedInputs()}>`,
    requiresArgs: true,

    execute(bot, message, args) {
        util.safeDelete(message);
        if (args[0].toLowerCase() !== 'purchase') {
            return;
        }

        if (!args[1]) {
            throw new InvalidUsageError('Missing item to purchase.');
        }

        args[1] = args[1].toLowerCase();
        
        let coinBalance = util.getStats(message, message.member, 'coins');

        try {
            if (args[1] === 'ticket') {
                if (coinBalance >= config.shop_ticket_cost) {
                    let ticketResult = util.addStats(message, message.member, 1, 'tickets');
                    let coinResult = util.addStats(message, message.member, -config.shop_ticket_cost, 'coins');
                    util.sendTimedMessage(message.channel, `You have been awarded 1 ticket. You now have ${ticketResult.newPoints} tickets.\nYour points have been updated. Previous: ${coinResult.oldPoints} coins. Now: ${coinResult.newPoints} coins.`, config.longer_delete_delay);
                    sendShopEmbed(message, ticketResult.oldPoints, ticketResult.newPoints, 'tickets', coinResult.oldPoints, coinResult.newPoints, 'coins');
                } else {
                    util.sendTimedMessage(`Sorry, you don't have enough coins to purchase this item. It costs ${config.shop_ticket_cost} coins.`);
                }
            } else {
                throw new InvalidUsageError('Invalid argument.');
            }
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
};

function getAllowedInputs() {
    return "Ticket";
}

/**
 * Sends a message displaying the shop transaction to the logs.
 * @param {Discord.Message} message any message in the guild.
 * @param {number} oldPoints the previous number of points.
 * @param {number} newPoints the new number of points.
 * @param {String} stat the name of the stat to display.
 * @param {number} oldPoints2 (optional) the previous number of points.
 * @param {number} newPoints2 (optional) the new number of points.
 * @param {number} stat2 (optional) the name of the second stat to display.
 */
function sendShopEmbed(message, oldPoints, newPoints, stat, oldPoints2, newPoints2, stat2) {

    let additionalInfo = [`Before: ${oldPoints} ${stat}.`, `After: ${newPoints} ${stat}.`]

    if (stat2) {
        additionalInfo.push(`Before: ${oldPoints2} ${stat2}.`, `Now: ${newPoints2} ${stat2}.`)
    }

    let logChannel = util.getLogChannel(message);
    if (logChannel) {
        util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
        .setColor(Colors.GOLD)
        .setTitle("Shop Purchase")
        .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`${message.guild.me.displayName} (bot) completed ${target.displayName}'s ${stat} purchase!`)
        .addField('Additional Info', [
            ...additionalInfo,
            `Date Awarded: ${new Date(Date.now())}`
        ]));
    } else {
        console.log(`${message.member.displayName} purchased something from the shop! Their ${stat}${stat2 ? ` and ${stat2}` : ''} have been changed.`);
    }
}