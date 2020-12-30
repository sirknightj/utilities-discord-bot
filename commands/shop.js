const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ['shop', 'store'],
    description: "Lets you purchase items from the store. 'All' purchases as many of that item as you can.",
    usage: `<purchase/refund> <${getAllowedInputs()}> (optional: quantity/all)`,
    requiresArgs: true,
    requiredPermissions: "CHANGE_NICKNAME",

    execute(bot, message, args) {
        let purchase = true;
        if (args[0].toLowerCase() !== 'purchase' && args[0].toLowerCase() !== 'refund') {
            throw 'First argument must be purchase';
        } else {
            if (args[0].toLowerCase() === 'refund') {
                purchase = false;
            }
        }

        let quantity = 1;
        if (/^-?\d+$/.test(args[2])) {
            quantity = parseInt(args[2]);
        } else if (args[2] && args[2].toLowerCase() !== 'all') {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, `Nice try, ${util.fixNameFormat(message.member.displayName)}. That is an invalid quantity.`);
            return;
        }

        if (!args[1]) {
            throw 'Missing item to purchase or refund.';
        }

        args[1] = args[1].toLowerCase();

        let coinBalance = util.getStats(message, message.member, 'coins');

        try {
            if (purchase && args[2] && typeof (args[2]) === 'string' && args[2].toLowerCase() === 'all') {
                quantity = Math.floor(coinBalance / config.shop_ticket_cost);
            } else if (!purchase && typeof (args[2]) === 'string' && args[2].toLowerCase() === 'all') {
                quantity = util.getStats(message, message.member, args[1]);
                if (!quantity) {
                    util.safeDelete(message);
                    util.sendTimedMessage(message.channel, `You don't have any ${args[1]} to refund.`);
                    return;
                }
            }
            if (args[1] === 'ticket' || args[1] === 'tickets') {
                if (quantity === 0) {
                    util.sendMessage(message.channel, `${util.fixNameFormat(message.member.displayName)}, you have purchased 0 tickets. Congratulations.`);
                    return;
                }
                let cost = config.shop_ticket_cost * quantity;
                if (purchase && coinBalance >= cost) {
                    let ticketResult = util.addStats(message, message.member, quantity, 'tickets');
                    let coinResult = util.addStats(message, message.member, -cost, 'coins');
                    sendShopEmbed(message, ticketResult.oldPoints, ticketResult.newPoints, 'tickets', purchase, coinResult.oldPoints, coinResult.newPoints, 'coins');
                } else if (!purchase) {
                    let ticketResult = util.addStats(message, message.member, -quantity, 'tickets');
                    let coinResult = util.addStats(message, message.member, cost, 'coins');
                    sendShopEmbed(message, ticketResult.oldPoints, ticketResult.newPoints, 'tickets', purchase, coinResult.oldPoints, coinResult.newPoints, 'coins');
                } else {
                    util.safeDelete(message);
                    util.sendTimedMessage(message.channel, `Sorry ${message.member.displayName}, you don't have enough coins to purchase this item. It costs ${cost} coin${addS(cost)} to purchase ${quantity} ticket${addS(quantity)}, and you only have ${coinBalance} coin${addS(coinBalance)}.`);
                }
            } else {
                throw 'Invalid argument.';
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
 * @param {boolean} purchase true if this is a purchase. false if it's a refund.
 * @param {number} oldPoints2 (optional) the previous number of points.
 * @param {number} newPoints2 (optional) the new number of points.
 * @param {number} stat2 (optional) the name of the second stat to display.
 */
function sendShopEmbed(message, oldPoints, newPoints, stat, purchase, oldPoints2, newPoints2, stat2) {

    let additionalInfo = [`${util.capitalizeFirstLetter(stat)} ${util.addCommas(oldPoints)} » ${util.addCommas(newPoints)}`];

    if (stat2) {
        additionalInfo.push(`${util.capitalizeFirstLetter(stat)} ${util.addCommas(oldPoints2)} » ${util.addCommas(newPoints2)}`);
    }

    let logChannel = util.getLogChannel(message);

    let embed = new Discord.MessageEmbed()
        .setColor(Colors.LIGHT_BLUE)
        .setTitle(`Shop ${purchase ? 'Purchase' : 'Refund'}`)
        .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`${util.fixNameFormat(message.guild.me.displayName)} (bot) completed ${util.fixNameFormat(target.displayName)}'s ${stat} ${purchase ? 'purchase' : 'refund'}!`)
        .addField('Additional Info', additionalInfo)
        .setTimestamp();

    if (logChannel) {
        util.sendMessage(util.getLogChannel(message), embed);
    } else {
        console.log(`${message.member.displayName} purchased something from the shop! Their ${stat}${stat2 ? ` and ${stat2} have` : ' has'} been changed.`);
    }
    util.sendMessage(message.channel, embed);
}

/**
 * Returns 's' if the number is not 1.
 * @param {number} number the number to check whether it requires a plural or not
 */
function addS(number) {
    return number === 1 ? '' : 's';
}