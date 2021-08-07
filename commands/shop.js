const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');
const { getUsage } = require('../utilities');

module.exports = {
    name: ['shop', 'store'],
    description: "Lets you purchase items from the store. 'All' purchases as many of that item as you can.",
    usage: [`<purchase/refund> <ShopItem: ${getAllowedInputs()}> (optional: quantity/all)`, `upgrade`],
    requiresArgs: true,

    execute(bot, message, args) {
        let purchase = true;
        let upgrade = false;
        if (args[0].toLowerCase() !== 'purchase' && args[0].toLowerCase() !== 'refund' && args[0].toLowerCase() !== 'upgrade') {
            throw `Invalid <purchase/refund> argument: \`${args[0]}\`.`;
        } else {
            if (args[0].toLowerCase() === 'refund') {
                purchase = false;
            } else if (args[0].toLowerCase() === 'upgrade') {
                upgrade = true;
            }
        }

        let quantity = 1;
        if (!upgrade) {
            if (/^\d+$/.test(args[2])) {
                quantity = parseInt(args[2]);
            } else if (args[2] && args[2].toLowerCase() !== 'all') {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `Nice try, ${util.fixNameFormat(message.member.displayName)}. That is an invalid quantity.`);
                return;
            }
        }

        if (!args[1] && !upgrade) {
            throw 'Missing <ShopItem> argument.';
        }

        if (args[1]) {
            args[1] = args[1].toLowerCase();
        }

        let coinBalance = util.getStats(message, message.member, 'coins');
        let discountLv = util.getStats(message, message.member, 'upgrade_ticket_discount');
        let ticketCost = Math.round(config.shop_ticket_cost * (1 - (discountLv*0.02)) * 100) / 100;

        try {
            if (purchase && args[2] && typeof (args[2]) === 'string' && args[2].toLowerCase() === 'all') {
                quantity = Math.floor(coinBalance / ticketCost);
            } else if (!purchase && typeof (args[2]) === 'string' && args[2].toLowerCase() === 'all') {
                quantity = util.getStats(message, message.member, 'tickets');
                if (!quantity) {
                    util.sendTimedMessage(message.channel, `You don't have any tickets to refund.`);
                    return;
                }
            }
            if ((args[1] === 'ticket' || args[1] === 'tickets') && (args[0] === 'purchase' || args[0] === 'refund')) {
                if (config.role_id_required_to_use_shop) {
                    if (!message.member.roles.cache.some(role => role.id === config.role_id_required_to_use_shop)) {
                        util.safeDelete(message);
                        let requiredRoles = getRolesRequired(message);
                        util.sendTimedMessage(message.channel, `Sorry, you don't have the role required to purchase tickets.\nRequired role${requiredRoles.length > 1 ? "s" : ""}: \`${requiredRoles}\``);
                        return;
                    }
                }
                if (quantity === 0) {
                    util.sendMessage(message.channel, `${util.fixNameFormat(message.member.displayName)}, you have purchased 0 tickets. Congratulations.`);
                    return;
                }
                let cost = Math.round(ticketCost * quantity * 100) / 100;
                if (purchase && coinBalance >= cost) {
                    let ticketResult = util.addStats(message, message.member, quantity, 'tickets');
                    let coinResult = util.addStats(message, message.member, -cost, 'coins');

                    sendShopEmbed(message, ticketResult.oldPoints, ticketResult.newPoints, 'tickets', purchase, coinResult.oldPoints, coinResult.newPoints, 'coins', discountLv ? `${discountLv * 2}% discount!` : null);
                } else if (!purchase) {
                    if (quantity > util.getStats(message, message.member, 'tickets')) {
                        util.safeDelete(message);
                        util.sendTimedMessage(message.channel, `Sorry ${util.fixNameFormat(message.member.displayName)}, you don't have that many tickets.\nYou only have ${util.getStats(message, message.member, 'tickets')}.`);
                        return;
                    }
                    let ticketResult = util.addStats(message, message.member, -quantity, 'tickets');
                    let coinResult = util.addStats(message, message.member, cost, 'coins');
                    sendShopEmbed(message, ticketResult.oldPoints, ticketResult.newPoints, 'tickets', purchase, coinResult.oldPoints, coinResult.newPoints, 'coins', discountLv ? `${discountLv * 2}% discount!` : null);
                } else {
                    util.safeDelete(message);
                    util.sendTimedMessage(message.channel, `Sorry ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins to purchase this item. It costs ${cost} coin${addS(cost)} to purchase ${quantity} ticket${addS(quantity)}, and you only have ${coinBalance} coin${addS(coinBalance)}.`);
                }
            } else if (args[1] === 'role') {
                util.sendMessage(message.channel, 'Coming soon!');
                return;
            } else if (upgrade) {
                args.shift();
                if (args[0] && args[0].toLowerCase() === 'daily') {
                    args.shift();
                    if (args[0] && args[0].toLowerCase() === 'cooldown') {
                        let level = util.getStats(message, message.member, 'upgrade_daily_reward_cooldown');
                        let cost = getNextUpgradeCost(level, -1775, 0.1);
                        if (level === DAILY_COOLDOWN_MAX_LEVEL) {
                            util.sendMessage(message.channel, `This is already at max level!`);
                            return;
                        }
                        if (coinBalance < cost) {
                            util.sendMessage(message.channel, `Sorry, ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins. It costs ${util.addCommas(cost)} coins, but you only have ${util.addCommas(coinBalance)}.`);
                            return;
                        }
                        let levelTransaction = util.addStats(message, message.member, 1, 'upgrade_daily_reward_cooldown');
                        let coinTransaction = util.addStats(message, message.member, -cost, 'coins');
                        let upgradeEmbed = getUpgradesEmbed(message, 'Daily Rewards Cooldown', getDailyCooldownStatus(levelTransaction.newPoints), levelTransaction, coinTransaction);
                        util.sendMessage(message.channel, upgradeEmbed);
                        util.sendMessage(util.getLogChannel(message), upgradeEmbed);
                        return;
                    } else if (args[0] && args[0].toLowerCase() === 'grace') {
                        let level = util.getStats(message, message.member, 'upgrade_daily_reward_extended_grace');
                        let cost = getNextUpgradeCost(level, -1500, 0.2);
                        if (level >= UPGRADE_MAX_LEVEL) {
                            util.sendMessage(message.channel, `This is already at max level!`);
                            return;
                        }
                        if (coinBalance < cost) {
                            util.sendMessage(message.channel, `Sorry, ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins. It costs ${util.addCommas(cost)} coins, but you only have ${util.addCommas(coinBalance)}.`);
                            return;
                        }
                        let levelTransaction = util.addStats(message, message.member, 1, 'upgrade_daily_reward_extended_grace');
                        let coinTransaction = util.addStats(message, message.member, -cost, 'coins');
                        let upgradeEmbed = getUpgradesEmbed(message, 'Daily Rewards Grace Period', getDailyGraceStatus(levelTransaction.newPoints), levelTransaction, coinTransaction);
                        util.sendMessage(message.channel, upgradeEmbed);
                        util.sendMessage(util.getLogChannel(message), upgradeEmbed);
                        return;
                    } else if (args[0] && args[0].toLowerCase() === 'bonus') {
                        let level = util.getStats(message, message.member, 'upgrade_daily_reward_coin_bonus');
                        let cost = getNextUpgradeCost(level, -1550, 0.05);
                        if (level >= UPGRADE_MAX_LEVEL) {
                            util.sendMessage(message.channel, `This is already at max level!`);
                            return;
                        }
                        if (coinBalance < cost) {
                            util.sendMessage(message.channel, `Sorry, ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins. It costs ${util.addCommas(cost)} coins, but you only have ${util.addCommas(coinBalance)}.`);
                            return;
                        }
                        let levelTransaction = util.addStats(message, message.member, 1, 'upgrade_daily_reward_coin_bonus');
                        let coinTransaction = util.addStats(message, message.member, -cost, 'coins');
                        let upgradeEmbed = getUpgradesEmbed(message, 'Daily Rewards Coin Bonus', getDailyBonusStatus(levelTransaction.newPoints), levelTransaction, coinTransaction);
                        util.sendMessage(message.channel, upgradeEmbed);
                        util.sendMessage(util.getLogChannel(message), upgradeEmbed);
                        return;
                    } else if (args[0] && args[0].toLowerCase() !== 'help') {
                        util.sendMessage(message.channel, `Invalid <upgradeName> \`${args[0]}\`\nUsage: \`${config.prefix}shop upgrade daily <help/upgradeName>\``);
                    } else {
                        util.sendMessage(message.channel, getDailyUpgradeInfo(message));
                    }
                } else if (args[0] && args[0].toLowerCase() === 'gambling') {
                    args.shift();
                    if (args[0] && args[0].toLowerCase() === 'roulette') {
                        let level = util.getStats(message, message.member, 'upgrade_roulette_safety_net');
                        let cost = getNextUpgradeCost(level, -1750, 0.5);
                        if (level >= UPGRADE_MAX_LEVEL) {
                            util.sendMessage(message.channel, `This is already at max level!`);
                            return;
                        }
                        if (coinBalance < cost) {
                            util.sendMessage(message.channel, `Sorry, ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins. It costs ${util.addCommas(cost)} coins, but you only have ${util.addCommas(coinBalance)}.`);
                            return;
                        }
                        let levelTransaction = util.addStats(message, message.member, 1, 'upgrade_roulette_safety_net');
                        let coinTransaction = util.addStats(message, message.member, -cost, 'coins');
                        let upgradeEmbed = getUpgradesEmbed(message, 'Roulette Safety Net', getRouletteSafetyNetStatus(levelTransaction.newPoints), levelTransaction, coinTransaction);
                        util.sendMessage(message.channel, upgradeEmbed);
                        util.sendMessage(util.getLogChannel(message), upgradeEmbed);
                        return;
                    } else if (args[0] && args[0].toLowerCase() === 'blackjack') {
                        let level = util.getStats(message, message.member, 'upgrade_blackjack_safety_net');
                        let cost = getNextUpgradeCost(level, -1650, 0.45);
                        if (level >= BLACKJACK_SAFETY_NET_UPGRADE_MAX_LEVEL) {
                            util.sendMessage(message.channel, `This is already at max level!`);
                            return;
                        }
                        if (coinBalance < cost) {
                            util.sendMessage(message.channel, `Sorry, ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins. It costs ${util.addCommas(cost)} coins, but you only have ${util.addCommas(coinBalance)}.`);
                            return;
                        }
                        let levelTransaction = util.addStats(message, message.member, 1, 'upgrade_blackjack_safety_net');
                        let coinTransaction = util.addStats(message, message.member, -cost, 'coins');
                        let upgradeEmbed = getUpgradesEmbed(message, 'Blackjack Safety Net', getBlackjackSafetyNetStatus(levelTransaction.newPoints), levelTransaction, coinTransaction);
                        util.sendMessage(message.channel, upgradeEmbed);
                        util.sendMessage(util.getLogChannel(message), upgradeEmbed);
                        return;
                    } else if (args[0] && args[0].toLowerCase() === 'peek') {
                        let level = util.getStats(message, message.member, 'upgrade_blackjack_sneak_peek_chance');
                        let cost = getNextUpgradeCost(level, -1200, 0.3);
                        if (level >= UPGRADE_MAX_LEVEL) {
                            util.sendMessage(message.channel, `This is already at max level!`);
                            return;
                        }
                        if (coinBalance < cost) {
                            util.sendMessage(message.channel, `Sorry, ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins. It costs ${util.addCommas(cost)} coins, but you only have ${util.addCommas(coinBalance)}.`);
                            return;
                        }
                        let levelTransaction = util.addStats(message, message.member, 1, 'upgrade_blackjack_sneak_peek_chance');
                        let coinTransaction = util.addStats(message, message.member, -cost, 'coins');
                        let upgradeEmbed = getUpgradesEmbed(message, 'Blackjack Sneak Peek Chance', getBlackjackDeckPeekChanceStatus(levelTransaction.newPoints), levelTransaction, coinTransaction);
                        util.sendMessage(message.channel, upgradeEmbed);
                        util.sendMessage(util.getLogChannel(message), upgradeEmbed);
                        return;
                    } else if (args[0] && args[0].toLowerCase() === 'power') {
                        let level = util.getStats(message, message.member, 'upgrade_blackjack_sneak_peek_power');
                        let cost = getNextUpgradeCost(level, 7000, 1.6);
                        if (level >= PEEK_POWER_MAX_LEVEL) {
                            util.sendMessage(message.channel, `This is already at max level!`);
                            return;
                        }
                        if (coinBalance < cost) {
                            util.sendMessage(message.channel, `Sorry, ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins. It costs ${util.addCommas(cost)} coins, but you only have ${util.addCommas(coinBalance)}.`);
                            return;
                        }
                        let levelTransaction = util.addStats(message, message.member, 1, 'upgrade_blackjack_sneak_peek_power');
                        let coinTransaction = util.addStats(message, message.member, -cost, 'coins');
                        let upgradeEmbed = getUpgradesEmbed(message, 'Blackjack Sneak Peek Power', getBlackjackDeckPeekPowerStatus(levelTransaction.newPoints), levelTransaction, coinTransaction);
                        util.sendMessage(message.channel, upgradeEmbed);
                        util.sendMessage(util.getLogChannel(message), upgradeEmbed);
                        return;
                    } else if (args[0] && args[0].toLowercase() !== 'help') {
                        util.sendMessage(message.channel, `Invalid <upgradeName> \`${args[0]}\`\nUsage: \`${config.prefix}shop upgrade gambling <help/upgradeName>\``);
                    } else {
                        util.sendMessage(message.channel, getGamblingUpgradeInfo(message));
                    }
                } else if (args[0] && args[0].toLowerCase() === 'other') {
                    args.shift();
                    if (args[0] && args[0].toLowerCase() === 'messages') {
                        let level = util.getStats(message, message.member, 'upgrade_message_earnings');
                        let cost = getNextUpgradeCost(level, -1926, 0.2);
                        if (level === MESSAGE_EARNINGS_MAX_LEVEL) {
                            util.sendMessage(message.channel, `This is already at max level!`);
                            return;
                        }
                        if (coinBalance < cost) {
                            util.sendMessage(message.channel, `Sorry, ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins. It costs ${util.addCommas(cost)} coins, but you only have ${util.addCommas(coinBalance)}.`);
                            return;
                        }
                        let levelTransaction = util.addStats(message, message.member, 1, 'upgrade_message_earnings');
                        let coinTransaction = util.addStats(message, message.member, -cost, 'coins');
                        let upgradeEmbed = getUpgradesEmbed(message, 'Additional Message Earnings', getMessageEarningStatus(levelTransaction.newPoints), levelTransaction, coinTransaction);
                        util.sendMessage(message.channel, upgradeEmbed);
                        util.sendMessage(util.getLogChannel(message), upgradeEmbed);
                        return;
                    } else if (args[0] && args[0].toLowerCase() === 'vc') {
                        let level = util.getStats(message, message.member, 'upgrade_vc_earnings');
                        let cost = getNextUpgradeCost(level, -1951, 0.34);
                        if (level >= UPGRADE_MAX_LEVEL) {
                            util.sendMessage(message.channel, `This is already at max level!`);
                            return;
                        }
                        if (coinBalance < cost) {
                            util.sendMessage(message.channel, `Sorry, ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins. It costs ${util.addCommas(cost)} coins, but you only have ${util.addCommas(coinBalance)}.`);
                            return;
                        }
                        let levelTransaction = util.addStats(message, message.member, 1, 'upgrade_vc_earnings');
                        let coinTransaction = util.addStats(message, message.member, -cost, 'coins');
                        let upgradeEmbed = getUpgradesEmbed(message, 'Additional VC Earnings', getVCEarningStatus(levelTransaction.newPoints), levelTransaction, coinTransaction);
                        util.sendMessage(message.channel, upgradeEmbed);
                        util.sendMessage(util.getLogChannel(message), upgradeEmbed);
                        return;
                    } else if (args[0] && args[0].toLowerCase() === 'tickets') {
                        let level = util.getStats(message, message.member, 'upgrade_ticket_discount');
                        let cost = getNextUpgradeCost(level, -1750, 0.1);
                        if (level >= UPGRADE_MAX_LEVEL) {
                            util.sendMessage(message.channel, `This is already at max level!`);
                            return;
                        }
                        if (coinBalance < cost) {
                            util.sendMessage(message.channel, `Sorry, ${util.fixNameFormat(message.member.displayName)}, you don't have enough coins. It costs ${util.addCommas(cost)} coins, but you only have ${util.addCommas(coinBalance)}.`);
                            return;
                        }
                        let levelTransaction = util.addStats(message, message.member, 1, 'upgrade_ticket_discount');
                        let coinTransaction = util.addStats(message, message.member, -cost, 'coins');
                        let upgradeEmbed = getUpgradesEmbed(message, 'Tickets Discount', getCheaperTicketsStatus(levelTransaction.newPoints), levelTransaction, coinTransaction);
                        util.sendMessage(message.channel, upgradeEmbed);
                        util.sendMessage(util.getLogChannel(message), upgradeEmbed);

                        // Refund cost of current tickets.
                        let ticketCount = util.getStats(message, message.member, 'tickets');
                        if (ticketCount > 0) {
                            let refundAmount = Math.floor(ticketCount * config.shop_ticket_cost * 0.02 * 100) / 100;
                            let coinTransaction = util.addStats(message, message.member, refundAmount, 'coins')
                            let embed = new Discord.MessageEmbed()
                                .setTitle('Refund for cheaper tickets!')
                                .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                                .setColor(Colors.GOLD)
                                .setDescription([`Your ${util.addCommas(ticketCount)} tickets are now 2% cheaper than before.`,
                                `You have been refunded ${util.addCommas(refundAmount)} coins.`,
                                `Coins: ${util.addCommas(coinTransaction.oldPoints)} » ${util.addCommas(coinTransaction.newPoints)}`])
                            util.sendMessage(message.channel, embed);
                            util.sendMessage(util.getLogChannel(message), embed);
                        }
                        return;
                    } else if (args[0] && args[0].toLowerCase() !== 'help') {
                        util.sendMessage(message.channel, `Invalid <upgradeName> \`${args[0]}\`\nUsage: \`${config.prefix}shop upgrade other <help/upgradeName>\``);
                    } else {
                        util.sendMessage(message.channel, getOtherUpgradeInfo(message));
                    }
                } else {
                    util.sendMessage(message.channel, getUpgradeCategoryInfo(message));
                }
            } else {
                util.safeDelete(message, config.longer_delete_delay);
                util.sendTimedMessage(message.channel, `Invalid \`<ShopItem>\` argument: \`${args[1]}\`\n\`${config.prefix}shop ${this.usage}\``, config.longer_delete_delay);
                return;
            }
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
};

function getAllowedInputs() {
    return "ticket";
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
function sendShopEmbed(message, oldPoints, newPoints, stat, purchase, oldPoints2, newPoints2, stat2, additionalInformation) {

    let additionalInfo = [`${util.capitalizeFirstLetter(stat)}: ${util.addCommas(oldPoints)} » ${util.addCommas(newPoints)}`];

    if (stat2) {
        additionalInfo.push(`${util.capitalizeFirstLetter(stat2)}: ${util.addCommas(oldPoints2)} » ${util.addCommas(newPoints2)}`);
    }

    if (stat === 'tickets') {
        stat = 'ticket';
    }

    let logChannel = util.getLogChannel(message);

    let embed = new Discord.MessageEmbed()
        .setColor(Colors.LIGHT_BLUE)
        .setTitle(`Shop ${purchase ? 'Purchase' : 'Refund'}`)
        .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`${util.fixNameFormat(message.guild.me.displayName)} (bot) completed ${util.fixNameFormat(target.displayName)}'s ${stat} ${purchase ? 'purchase' : 'refund'}!${stat2 ? `\nEach ${stat} costs ${util.addCommas(Math.abs(Math.round((newPoints2 - oldPoints2)/(newPoints - oldPoints)*100)/100))} ${stat2}${additionalInformation ? ` (${additionalInformation})` : ""}.` : ''}`)
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

/**
 * Gets and returns the name of the provided roles array or id.
 * 
 * @param {Discord.Message} message 
 * @returns the role's names
 */
function getRolesRequired(message) {
    if (Array.isArray(config.role_id_required_to_use_shop)) {
        let result = [];
        for (roleID of config.role_id_required_to_use_shop) {
            result.push(getRoleName(message, roleID));
        }
        return result.join(', ');
    } else if (config.role_id_required_to_use_shop) {
        return getRoleName(message, config.role_id_required_to_use_shop);
    }
    return "Error. shop.js line 157."; // this should never happen
}

/**
 * Gets and returns the name of the provided role id.
 * 
 * @param {Discord.Message} message any message sent within the guild
 * @param {string} roleID the id of the role you want to get the name of
 * @returns the role's name
 */
function getRoleName(message, roleID) {
    let role = util.getRoleFromMention(message, roleID + "");
    if (role) {
        return role.name;
    } else {
        return 'Invalid role.';
    }
}

const UPGRADE_MAX_LEVEL = 10;

/**
 * Returns a help embed for the various upgrade categories.
 * 
 * @returns {Discord.MessageEmbed} the embed containing the upgrade category info
 */
function getUpgradeCategoryInfo(message) {
    return new Discord.MessageEmbed()
        .setTitle('All Upgrade Categories')
        .addField('Use these commands for more info',
            [
                `:calendar_spiral: \`${config.prefix}shop upgrade daily\` - View upgrades to \`${config.prefix}daily\` and \`${config.prefix}weekly\``,
                `:game_die: \`${config.prefix}shop upgrade gambling\` - View upgrades to \`${config.prefix}roulette\` and \`${config.prefix}blackjack\``,
                `:coin: \`${config.prefix}shop upgrade other\` - View upgrades to ticket costs and coins earned from participation`
            ])
        .setColor(Colors.YELLOW)
        .setFooter(`You have 💰 ${util.addCommas(util.getStats(message, message.member, 'coins'))} coins.`)
        .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }));
}

/**
 * Returns the upgrade transaction embed.
 * 
 * @param {Discord.Message} message any message sent within the guild
 * @param {string} statName the name of the stat updated
 * @param {string} statInfo more information about this stat
 * @param {import('../utilities').StatTransaction} levelTransaction the StatTransaction object for the level
 * @param {import('../utilities').StatTransaction} coinTransaction the StatTransaction object for the coins
 * @returns the role's name
 */
function getUpgradesEmbed(message, statName, statInfo, levelTransaction, coinTransaction) {
    let maxLv = UPGRADE_MAX_LEVEL;
    if (statName === 'Additional Message Earnings') {
        maxLv = MESSAGE_EARNINGS_MAX_LEVEL;
    } else if (statName === 'Daily Rewards Cooldown') {
        maxLv = DAILY_COOLDOWN_MAX_LEVEL;
    } else if (statName === 'Blackjack Safety Net') {
        maxLv = BLACKJACK_SAFETY_NET_UPGRADE_MAX_LEVEL;
    } else if (statName === 'Blackjack Sneak Peek Power') {
        maxLv = PEEK_POWER_MAX_LEVEL;
    }
    return new Discord.MessageEmbed()
        .setTitle(`Upgrade Purchased For ${util.addCommas(Math.round((coinTransaction.oldPoints - coinTransaction.newPoints) * 100) / 100)} Coins!`)
        .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
        .setColor(Colors.TURQUOISE)
        .addField('Upgrade Information', statInfo)
        .addField('Additional Info',
            [`Coins: ${util.addCommas(coinTransaction.oldPoints)} » ${util.addCommas(coinTransaction.newPoints)}`,
            `${util.capitalizeFirstLetter(statName)}: ${util.addCommas(levelTransaction.oldPoints)} » ${util.addCommas(levelTransaction.newPoints)}${levelTransaction.newPoints === maxLv ? " (MAX)" : ""}`
            ])
        .setTimestamp();
}

function getDailyUpgradeInfo(message) {
    return new Discord.MessageEmbed()
        .setTitle('Daily Upgrades Info')
        .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
        .setColor(Colors.TURQUOISE)
        .addField(`:fast_forward: Daily Rewards Cooldown`, [`\`${config.prefix}shop upgrade daily cooldown\``,
        ...getDailyCooldownStatus(util.getStats(message, message.member, 'upgrade_daily_reward_cooldown'), true)])
        .addField(`:fire: Daily Rewards Streak Grace Period`, [`\`${config.prefix}shop upgrade daily grace\``,
        ...getDailyGraceStatus(util.getStats(message, message.member, 'upgrade_daily_reward_extended_grace'), true)])
        .addField(`:moneybag: Daily Rewards Coin Bonus`, [`\`${config.prefix}shop upgrade daily bonus\``,
        ...getDailyBonusStatus(util.getStats(message, message.member, 'upgrade_daily_reward_coin_bonus'), true)])
        .setFooter(`You have 💰 ${util.addCommas(util.getStats(message, message.member, 'coins'))} coins.`)
}

function getGamblingUpgradeInfo(message) {
    return new Discord.MessageEmbed()
        .setTitle('Gambling Upgrades Info')
        .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
        .setColor(Colors.TURQUOISE)
        .addField(`:goal: Roulette Safety Net`, [`\`${config.prefix}shop upgrade gambling roulette\``,
        ...getRouletteSafetyNetStatus(util.getStats(message, message.member, 'upgrade_roulette_safety_net'), true)])
        .addField(`:goal: Blackjack Safety Net`, [`\`${config.prefix}shop upgrade gambling blackjack\``,
        ...getBlackjackSafetyNetStatus(util.getStats(message, message.member, 'upgrade_blackjack_safety_net'), true)])
        .addField(`:eyes: Blackjack Sneak Peek Chance`, [`\`${config.prefix}shop upgrade gambling peek\``,
        ...getBlackjackDeckPeekChanceStatus(util.getStats(message, message.member, 'upgrade_blackjack_sneak_peek_chance'), true)])
        .addField(`:point_up: Blackjack Sneak Peek Power`, [`\`${config.prefix}shop upgrade gambling power\``,
        ...getBlackjackDeckPeekPowerStatus(util.getStats(message, message.member, 'upgrade_blackjack_sneak_peek_power'), true)])
        .setFooter(`You have 💰 ${util.addCommas(util.getStats(message, message.member, 'coins'))} coins.`)
}

function getOtherUpgradeInfo(message) {
    return new Discord.MessageEmbed()
        .setTitle('Misc Upgrades Info')
        .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
        .setColor(Colors.TURQUOISE)
        .addField(`:moneybag: Coins Earned From Messages`, [`\`${config.prefix}shop upgrade other messages\``,
        ...getMessageEarningStatus(util.getStats(message, message.member, 'upgrade_message_earnings'), true)])
        .addField(`:moneybag: Coins Earned From VC`, [`\`${config.prefix}shop upgrade other vc\``,
        ...getVCEarningStatus(util.getStats(message, message.member, 'upgrade_vc_earnings'), true)])
        .addField(`:tickets: Ticket Discount`, [`\`${config.prefix}shop upgrade other tickets\``,
        ...getCheaperTicketsStatus(util.getStats(message, message.member, 'upgrade_ticket_discount'), true)])
        .setFooter(`You have 💰 ${util.addCommas(util.getStats(message, message.member, 'coins'))} coins.`)
}

const DAILY_COOLDOWN_MAX_LEVEL = 12;

/**
 * Returns the description of the daily cooldown upgrade.
 * Each level grants -2% daily reward cooldown.
 * 
 * @param {number} level 
 * @param {boolean} dontShow true if you just leveled up. False if not.
 * @returns {string} description of the daily cooldown upgrade.
 */
function getDailyCooldownStatus(level, dontShow = false) {
    let info = [`Each level decreases the cooldown between claiming \`${config.prefix}daily\` and \`${config.prefix}weekly\`.`];
    info.push(`Cooldown Level ${level}/${DAILY_COOLDOWN_MAX_LEVEL}`);
    if (level >= DAILY_COOLDOWN_MAX_LEVEL) {
        info[1] += ' (MAX)';
    }
    if (level === 0 || dontShow) {
        info.push(`Current Daily Cooldown: \`${util.toFormattedTime(Math.floor(config.daily_reward_cooldown * (100 - level * 2)) / 100)}\``);
        info.push(`Current Weekly Cooldown: \`${util.toFormattedTime(Math.floor(config.weekly_reward_cooldown * (100 - level * 2)) / 100)}\``);
    } else {
        info.push(`Current Daily Cooldown: \`${util.toFormattedTime(Math.floor(config.daily_reward_cooldown * (100 - (level * 2 - 2))) / 100)}\` » \`${util.toFormattedTime(Math.floor(config.daily_reward_cooldown * (100 - level * 2)) / 100)}\``)
        info.push(`Current Weekly Cooldown: \`${util.toFormattedTime(Math.floor(config.weekly_reward_cooldown * (100 - (level * 2 - 2))) / 100)}\` » \`${util.toFormattedTime(Math.floor(config.weekly_reward_cooldown * (100 - level * 2)) / 100)}\``)
    }
    if (level < DAILY_COOLDOWN_MAX_LEVEL) {
        info.push(`Next Upgrade: ${util.addCommas(getNextUpgradeCost(level, -1775, 0.1))} coins`,
            `Next Daily Cooldown: \`${util.toFormattedTime(Math.floor(config.daily_reward_cooldown * (100 - (level * 2 + 2))) / 100)}\``,
            `Next Weekly Cooldown: \`${util.toFormattedTime(Math.floor(config.weekly_reward_cooldown * (100 - (level * 2 + 2))) / 100)}\``);
    }
    return info;
}

/**
 * Returns the description of the daily grace upgrade.
 * Each level grants +25% more time before resetting your streak.
 * 
 * @param {number} level 
 * @param {boolean} dontShow true if you just leveled up. False if not.
 * @returns {string} description of the daily cooldown upgrade.
 */
function getDailyGraceStatus(level, dontShow = false) {
    let info = [`Each level increases the grace period before resetting your \`${config.prefix}daily\` and \`${config.prefix}weekly\` streaks.`]
    info.push(`Extended Grace Level ${level}/${UPGRADE_MAX_LEVEL}`);
    if (level >= UPGRADE_MAX_LEVEL) {
        info[1] += ' (MAX)';
    }
    info.push();
    if (level === 0 || dontShow) {
        info.push(`Current Daily Grace Period: \`${util.toFormattedTime(Math.round(config.daily_reward_streak_grace_period * (1 + level * 0.25)))}\``);
        info.push(`Current Weekly Grace Period: \`${util.toFormattedTime(Math.round(config.weekly_reward_streak_grace_period * (1 + level * 0.25)))}\``);
    } else {
        info.push(`Current Daily Grace Period: \`${util.toFormattedTime(Math.floor(config.daily_reward_streak_grace_period * (1 + (level - 1) * 0.25)))}\` » \`${util.toFormattedTime(Math.floor(config.daily_reward_streak_grace_period * (1 + level * 0.25)))}\``)
        info.push(`Current Weekly Grace Period: \`${util.toFormattedTime(Math.floor(config.weekly_reward_streak_grace_period * (1 + (level - 1) * 0.25)))}\` » \`${util.toFormattedTime(Math.floor(config.weekly_reward_streak_grace_period * (1 + level * 0.25)))}\``)
    }
    if (level < UPGRADE_MAX_LEVEL) {
        info.push(`Next Upgrade: ${util.addCommas(getNextUpgradeCost(level, -1500, 0.2))} coins`,
            `Next Daily Grace Period: \`${util.toFormattedTime(Math.floor(config.daily_reward_streak_grace_period * (1 + (level + 1) * 0.25)))}\``,
            `Next Weekly Grace Period: \`${util.toFormattedTime(Math.floor(config.weekly_reward_streak_grace_period * (1 + (level + 1) * 0.25)))}\``);
    }
    return info;
}

/**
 * Returns the description of the daily bonus upgrade.
 * Each level grants +4% more coins from using daily.
 * 
 * @param {number} level 
 * @param {boolean} dontShow true if you just leveled up. False if not.
 * @returns {string} description of the daily cooldown upgrade.
 */
function getDailyBonusStatus(level, dontShow = false) {
    let info = [`Each level increases the coins you get from \`${config.prefix}daily\` and \`${config.prefix}weekly\` by 5%.`]
    info.push(`Bonus Coins Level ${level}/${UPGRADE_MAX_LEVEL}`);
    if (level >= UPGRADE_MAX_LEVEL) {
        info[1] += ' (MAX)';
    }
    info.push();
    if (level === 0 || dontShow) {
        info.push(`Current Coin Bonus: \`${level * 5}%\``);
    } else {
        info.push(`Current Coin Bonus: \`${level * 5 - 5}%\` » \`${level * 5}%\``)
    }
    if (level < UPGRADE_MAX_LEVEL) {
        info.push(`Next Upgrade: ${util.addCommas(getNextUpgradeCost(level, -1550, 0.05))} coins`,
            `Next Coin Bonus: \`${level * 5 + 5}%\``);
    }
    return info;
}


/**
 * Returns the description of the roulette safety net upgrade.
 * 
 * @param {number} level 
 * @param {boolean} dontShow true if you just leveled up. False if not.
 * @returns {string} description of the roulette safety net upgrade.
 */
 function getRouletteSafetyNetStatus(level, dontShow = false) {
    let info = [`Each level increases the chance that a losing \`${config.prefix}roulette\` doesn't take coins away from you. \`0.02%\` per number in guess per level (ex. 18 numbers are odd, so 18 * 0.02% = 0.36% per level)`];
    info.push(`Safety Net Level ${level}/${UPGRADE_MAX_LEVEL}`);
    if (level >= UPGRADE_MAX_LEVEL) {
        info[1] += ' (MAX)';
    }
    info.push();
    if (level === 0 || dontShow) {
        info.push(`Current Safety Net: \`${level * 0.02}%\` per number in guess`);
    } else {
        info.push(`Current Safety Net: \`${(level - 1) * 0.02}%\` » \`${level * 0.02}%\` per number in guess`)
    }
    if (level < UPGRADE_MAX_LEVEL) {
        info.push(`Next Upgrade: ${util.addCommas(getNextUpgradeCost(level, -1750, 0.5))} coins`,
            `Next Safety Net: \`${(level + 1) * 0.02}%\` per number in guess`);
    }
    return info;
}

const BLACKJACK_SAFETY_NET_UPGRADE_MAX_LEVEL = 15;

/**
 * Returns the description of the roulette safety net upgrade.
 * 
 * @param {number} level 
 * @param {boolean} dontShow true if you just leveled up. False if not.
 * @returns {string} description of the roulette safety net upgrade.
 */
 function getBlackjackSafetyNetStatus(level, dontShow = false) {
    let info = [`Each level increases the chance that a losing \`${config.prefix}blackjack\` doesn't take coins away from you.`];
    info.push(`Safety Net Level ${level}/${BLACKJACK_SAFETY_NET_UPGRADE_MAX_LEVEL}`);
    if (level >= BLACKJACK_SAFETY_NET_UPGRADE_MAX_LEVEL) {
        info[1] += ' (MAX)';
    }
    info.push();
    if (level === 0 || dontShow) {
        info.push(`Current Safety Net: \`${level}%\` chance to activate`);
    } else {
        info.push(`Current Safety Net: \`${(level - 1)}%\` » \`${level}%\` chance to activate`)
    }
    if (level < BLACKJACK_SAFETY_NET_UPGRADE_MAX_LEVEL) {
        info.push(`Next Upgrade: ${util.addCommas(getNextUpgradeCost(level, -1650, 0.45))} coins`,
            `Next Safety Net: \`${(level + 1)}%\` chance to activate`);
    }
    return info;
}

/**
 * Returns the description of the blackjack peek upgrade.
 * 
 * @param {number} level 
 * @param {boolean} dontShow true if you just leveled up. False if not.
 * @returns {string} description of the blackjack peek upgrade.
 */
 function getBlackjackDeckPeekChanceStatus(level, dontShow = false) {
    let info = [`Each level increases the chance that during a \`${config.prefix}blackjack\` game, you can see the next card(s) to be drawn.`];
    info.push(`Blackjack Deck Peek Level ${level}/${UPGRADE_MAX_LEVEL}`);
    if (level >= UPGRADE_MAX_LEVEL) {
        info[1] += ' (MAX)';
    }
    info.push();
    if (level === 0 || dontShow) {
        info.push(`Current Peek Chance: \`${level * 5}%\` chance to activate`);
    } else {
        info.push(`Current Peek Chance: \`${(level - 1) * 5}%\` » \`${level * 5}%\` chance to activate`)
    }
    if (level < UPGRADE_MAX_LEVEL) {
        info.push(`Next Upgrade: ${util.addCommas(getNextUpgradeCost(level, -1200, 0.3))} coins`,
            `Next Peek Chance: \`${(level + 1) * 5}%\` chance to activate`);
    }
    return info;
}

const PEEK_POWER_MAX_LEVEL = 2;

/**
 * Returns the description of the blackjack peek upgrade.
 * 
 * @param {number} level 
 * @param {boolean} dontShow true if you just leveled up. False if not.
 * @returns {string} description of the blackjack peek upgrade.
 */
 function getBlackjackDeckPeekPowerStatus(level, dontShow = false) {
    let info = [`Each level increases the number of cards that are shown in a \`${config.prefix}blackjack\` game when the peek upgrade activates.`];
    info.push(`Cards Shown Level ${level}/${PEEK_POWER_MAX_LEVEL}`);
    if (level >= PEEK_POWER_MAX_LEVEL) {
        info[1] += ' (MAX)';
    }
    info.push();
    if (level === 0 || dontShow) {
        info.push(`Current Peek Power: Top \`${level + 1}\` cards shown`);
    } else {
        info.push(`Current Peek Power: Top \`${level}\` » \`${level + 1}\` cards shown`)
    }
    if (level < PEEK_POWER_MAX_LEVEL) {
        info.push(`Next Upgrade: ${util.addCommas(getNextUpgradeCost(level, 7000, 1.6))} coins`,
            `Next Peek Power: Top \`${(level + 2)}\` cards shown`);
    }
    return info;
}

const MESSAGE_EARNINGS_MAX_LEVEL = 12;

/**
 * Returns the description of the additional coins from messages upgrade.
 * Each level grants +1 coin per message.
 * 
 * @param {number} level 
 * @param {boolean} dontShow true if you just leveled up. False if not.
 * @returns {string} description of the daily cooldown upgrade.
 */
 function getMessageEarningStatus(level, dontShow = false) {
    let info = [`Each level grants you +1 coins per message!`];
    info.push(`Bonus Coins Level ${level}/${MESSAGE_EARNINGS_MAX_LEVEL}`);
    if (level >= MESSAGE_EARNINGS_MAX_LEVEL) {
        info[1] += ' (MAX)';
    }
    info.push();
    if (level === 0 || dontShow) {
        info.push(`Current Bonus: \`+${level}\` coins per message.`);
    } else {
        info.push(`Current Bonus: \`+${(level - 1)}\` » \`+${level}\` coins per message.`);
    }
    if (level < MESSAGE_EARNINGS_MAX_LEVEL) {
        info.push(`Next Upgrade: ${util.addCommas(getNextUpgradeCost(level, -1926, 0.2))} coins`,
            `Next Bonus: \`+${level + 1}\` coins per message.`);
    }
    return info;
}

/**
 * Returns the description of the additional coins from VC upgrade.
 * Each level grants +20% coins from VC.
 * 
 * @param {number} level 
 * @param {boolean} dontShow true if you just leveled up. False if not.
 * @returns {string} description of the daily cooldown upgrade.
 */
 function getVCEarningStatus(level, dontShow = false) {
    let info = [`Each level grants you \`+20%\` coins from VC!`];
    info.push(`Bonus Coins Level ${level}/${UPGRADE_MAX_LEVEL}`);
    if (level >= UPGRADE_MAX_LEVEL) {
        info[1] += ' (MAX)';
    }
    info.push();
    if (level === 0 || dontShow) {
        info.push(`Current Bonus: \`+${level * 20}%\` coins from VC.`);
    } else {
        info.push(`Current Bonus: \`+${(level - 1)*20}%\` » \`+${level*20}%\` coins from VC.`);
    }
    if (level < UPGRADE_MAX_LEVEL) {
        info.push(`Next Upgrade: ${util.addCommas(getNextUpgradeCost(level, -1951, 0.34))} coins`,
            `Next Bonus: \`+${(level + 1)*20}%\` coins from VC.`);
    }
    return info;
}

/**
 * Returns the description of the cheaper tickets upgrade.
 * Each level grants -1% cost of tickets.
 * 
 * @param {number} level 
 * @param {boolean} dontShow true if you just leveled up. False if not.
 * @returns {string} description of the daily cooldown upgrade.
 */
 function getCheaperTicketsStatus(level, dontShow = false) {
    let info = [`Each level grants you \`2%\` cheaper tickets!`];
    info.push(`Cheaper Tickets Level ${level}/${UPGRADE_MAX_LEVEL}`);
    if (level >= UPGRADE_MAX_LEVEL) {
        info[1] += ' (MAX)';
    }
    info.push();
    if (level === 0 || dontShow) {
        info.push(`Current Bonus: \`${level * 2}%\` cheaper tickets.`);
    } else {
        info.push(`Current Bonus: \`${(level - 1)*2}%\` » \`${level*2}%\` cheaper tickets.`);
    }
    if (level < UPGRADE_MAX_LEVEL) {
        info.push(`Next Upgrade: ${util.addCommas(getNextUpgradeCost(level, -1750, 0.1))} coins`,
            `Next Bonus: \`+${(level + 1)*2}%\` cheaper tickets.`);
    }
    return info;
}

/**
 * Returns the cost to upgrade to the next level.
 * Cost = (2000 + difficulty) * (1.2 + scaling) ^ (level of upgrade)
 * 
 * @param {number} currentLevel the current level 
 * @param {number} scaling offset the exponent of this upgrade. Default: 0.
 * @param {number} difficulty additional base cost of this upgrade. Default: 0. 
 * @returns the cost to upgrade to the next level
 */
function getNextUpgradeCost(currentLevel, difficulty = 0, scaling = 0) {
    return Math.floor((2000 + difficulty) * (1.2 + scaling) ** (currentLevel + 1));
}