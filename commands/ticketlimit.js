const util = require('../utilities');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');
const config = require('../config.json');

module.exports = {
    name: 'ticketlimit',
    description: 'Tells you or sets the new ticket limit. -1 to remove limit.',
    usage: `(optional: new limit)`,

    execute(bot, message, args) {
        if (args.length > 1) {
            throw 'Too many arguments!';
        }
        if (args.length === 0) {
            util.sendMessage(message.channel, `The current ticket limit is ${util.addCommas(util.getStats(message, message.guild.me, 'ticket_limit'))}.`);
        } else {
            if (!message.member.hasPermission('ADMINISTRATOR')) {
                throw 'Missing permission: `ADMINISTRATOR`';
            }
            let updateEveryone = false;
            let newLimit = util.convertNumber(args[0]);
            let prevLimit = util.getStats(message, message.guild.me, 'ticket_limit');
            let embed = new Discord.MessageEmbed()
                .setColor(Colors.BRIGHT_RED)
                .setTitle("Ticket Limit Change!")
                .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            if (newLimit === 0) {
                throw `Unable to understand the number \`${args[0]}\`. To remove the limit, input \`-1\`.`;
            } else if (prevLimit === newLimit || (newLimit === -1 && prevLimit === 0)) {
                util.sendMessage(message.channel, new Discord.MessageEmbed()
                    .setColor(Colors.YELLOW)
                    .setTitle('Nice!')
                    .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`The ticket limit is already set to \`${prevLimit === 0 ? '`no limit`' : util.addCommas(prevLimit)}\`. Congratulations.`)
                    .setTimestamp());
                return;
            } else if (newLimit === -1) {
                newLimit = 0;
                let ticket_transaction = util.setStats(message, message.guild.me, newLimit, 'ticket_limit');
                embed.setDescription(`${util.fixNameFormat(message.member.displayName)} has removed the ticket limit! It previously was ${util.addCommas(ticket_transaction.oldPoints)}.`);
            } else {
                let ticket_transaction = util.setStats(message, message.guild.me, newLimit, 'ticket_limit');
                embed.setDescription(`${util.fixNameFormat(message.member.displayName)} has changed the ticket limit from ${util.addCommas(ticket_transaction.oldPoints)} » ${util.addCommas(ticket_transaction.newPoints)}`);
                updateEveryone = true;
            }
            util.sendMessage(message.channel, embed);
            util.sendMessage(util.getLogChannel(message), embed);

            if (updateEveryone) {
                let isAnyoneUpdated = false;
                for (const member of message.guild.members.cache) { // member = [userID, Discord.GuildMember]
                    if (!member[1].roles.cache.some(role => role.id === config.role_id_required_to_use_shop)) {
                        continue;
                    }
                    let prevTicketCount = util.getStats(message, member[1], 'tickets');
                    if (prevTicketCount <= newLimit) {
                        continue;
                    }
                    let discountLv = util.getStats(message, member[1], 'upgrade_ticket_discount');
                    let ticketCost = Math.round(config.shop_ticket_cost * (1 - (discountLv*0.02)) * 100) / 100;
                    let ticketsToRemove = prevTicketCount - newLimit;
                    let refundAmount = Math.round(ticketsToRemove * ticketCost * 100) / 100;
                    let ticket_transaction = util.addStats(message, member[1], -ticketsToRemove, 'tickets');
                    let coins_transaction = util.addStats(message, member[1], refundAmount, 'coins');

                    util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
                        .setColor(Colors.LIGHT_BLUE)
                        .setTitle('Shop Refund')
                        .setDescription(`${util.fixNameFormat(message.guild.me.displayName)} (bot) completed ${util.fixNameFormat(member[1].displayName)}'s ticket refund to fit the new ticket limit!\n${util.addCommas(ticketsToRemove)} ticket${ticketsToRemove === 1 ? ' has' : 's have'} been refunded.\nEach ticket costs ${util.addCommas(ticketCost)} coins${discountLv ? ` (${discountLv * 2}% discount!)` : '.'}`)
                        .setAuthor(member[1].displayName, member[1].user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .addField('Additional Info', [
                            `Tickets: ${util.addCommas(ticket_transaction.oldPoints)} » ${util.addCommas(ticket_transaction.newPoints)}`,
                            `Coins: ${util.addCommas(coins_transaction.oldPoints)} » ${util.addCommas(coins_transaction.newPoints)}`
                        ]));
                    isAnyoneUpdated = true;
                }
                if (isAnyoneUpdated) {
                    util.sendMessage(message.channel, `Everyone who had more tickets than the ticket limit has their coins refunded.`);
                }
            }
        }
    }
}