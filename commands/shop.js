const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ['shop', 'store'],
    description: "Lets you purchase items from the store. 'All' purchases as many of that item as you can.",
    usage: `purchase <${getAllowedInputs()}> (optional: quantity/all)`,
    requiresArgs: true,
    requiredPermissions: "CHANGE_NICKNAME",

    execute(bot, message, args) {
        util.safeDelete(message);
        if (args[0].toLowerCase() !== 'purchase') {
            throw new InvalidUsageException('First argument must be purchase');
        }


        let quantity = 1;
        if (/^-?\d+$/.test(args[2])) {
            quantity = parseInt(args[2]);
        } else if (args[2] && args[2].toLowerCase() !== 'all') {
            util.sendTimedMessage(message.channel, `Nice try, ${message.member.displayName}. That is an invalid quantity.`);
            return;
        }

        if (!args[1]) {
            throw new InvalidUsageError('Missing item to purchase.');
        }

        args[1] = args[1].toLowerCase();
        
        let coinBalance = util.getStats(message, message.member, 'coins');

        try {
            if (args[2] && typeof(args[2]) === 'string' && args[2].toLowerCase() === 'all') {
                quantity = Math.floor(coinBalance / config.shop_ticket_cost);
            }
            if (quantity === 0) {
                util.sendTimedMessage(message.channel, `${message.member.displayName}, you have purchased 0 tickets. Congratulations.`);
                return;
            }
            if (args[1] === 'ticket' || args[1] === 'tickets') {
                let cost = config.shop_ticket_cost * quantity;
                if (coinBalance >= cost) {
                    let ticketResult = util.addStats(message, message.member, quantity, 'tickets');
                    let coinResult = util.addStats(message, message.member, -cost, 'coins');
                    util.sendTimedMessage(message.channel, `${message.member.displayName}, you have been awarded ${quantity} ticket${addS(quantity)}, which cost ${cost} coin${addS(cost)}. Your tickets have been updated from ${ticketResult.oldPoints} to ${ticketResult.newPoints} ticket${addS(ticketResult.newPoints)}.\nYour points have been updated. Previous: ${coinResult.oldPoints} coin${addS(coinResult.oldPoints)}. Now: ${coinResult.newPoints} coin${addS(coinResult.newPoints)}.\n_This message will be automatically deleted in ${config.longer_delete_delay / 1000} seconds._`, config.longer_delete_delay);
                    sendShopEmbed(message, ticketResult.oldPoints, ticketResult.newPoints, 'tickets', coinResult.oldPoints, coinResult.newPoints, 'coins');
                } else {
                    util.sendTimedMessage(message.channel, `Sorry ${message.member.displayName}, you don't have enough coins to purchase this item. It costs ${cost} coin${addS(cost)} to purchase ${quantity} ticket${addS(quantity)}, and you only have ${coinBalance} coin${addS(coinBalance)}.`);
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
        .setColor(Colors.LIGHT_BLUE)
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

/**
 * Returns 's' if the number is not 1.
 * @param {number} number the number to check whether it requires a plural or not
 */
function addS(number) {
    return number === 1 ? '' : 's';
}