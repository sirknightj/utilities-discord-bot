const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ["bazaar", "bz"],
    description: "Checks the prices from a specified product from the Bazaar.",
    usage: `<product>`,
    requiresArgs: true,

    execute(bot, message, args) {
        if (!config.enable_hypixel_api_required_commands) {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "This command is disabled.");
            return;
        }

        if (!config.API_KEY || config.API_KEY === 'YOUR_HYPIXEL_API_KEY_HERE') {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "This command requires a Hypixel API Key.");
            return;
        }

        try {
            fetch(`https://api.hypixel.net/skyblock/bazaar?key=${config.API_KEY}`)
                .then(response => {
                    if (response.ok) {
                        response.json().then(data => {
                            if (data.products[args.join('_').toUpperCase()]) {
                                util.sendMessage(message.channel, new Discord.MessageEmbed()
                                    .setColor(Colors.GOLD)
                                    .setTitle(`${args.join('_').toUpperCase()}`)
                                    .setDescription(`Last updated: <t:${Math.round(data.lastUpdated / 1000)}:F>`)
                                    .addFields(
                                        { name: "Instant Sell", value: `${data.products[args.join('_').toUpperCase()].quick_status.sellPrice}`, inline: true },
                                        { name: "Sell Volume", value: `${util.addCommas(data.products[args.join('_').toUpperCase()].quick_status.sellVolume)}`, inline: true },
                                        util.embedLineBreak(),
                                        { name: "Instant Buy", value: `${data.products[args.join('_').toUpperCase()].quick_status.buyPrice}`, inline: true },
                                        { name: "Buy Volume", value: `${util.addCommas(data.products[args.join('_').toUpperCase()].quick_status.buyVolume)}`, inline: true },
                                        util.embedLineBreak(),
                                        { name: "Buy Orders", value: `${this.summaryToString(data.products[args.join('_').toUpperCase()].sell_summary, false).join('\n')}`, inline: true },
                                        { name: "Sell Orders", value: `${this.summaryToString(data.products[args.join('_').toUpperCase()].buy_summary, true).join('\n')}`, inline: true },
                                    )
                                );
                            } else {
                                util.sendMessage(message.channel, new Discord.MessageEmbed()
                                    .setTitle(`Error!`)
                                    .setDescription(`There is no product with the name ${args.join('_').toUpperCase()}`)
                                );
                            }
                        });
                    } else {
                        response.json().then(data => {
                            util.sendMessage(message.channel, new Discord.MessageEmbed()
                                .setTitle(`Error ${response.status}: ${response.statusText}`)
                                .setDescription(data.cause)
                            );
                        });
                    }
                });
        } catch (err) {
            util.sendTimedMessage(message, channel, 'Error fetching the API.');
        }
    },
    
    summaryToString(summary, ascending) {
        if (summary.length === 0) {
            return 'None!';
        } else {
            let result = [];
            let i = 0;
            while (summary.length !== 0 && i < 10) {
                let thisSummary = ascending ? summary.pop() : summary.shift();
                result.push(`${util.addCommas(thisSummary.amount)} @ ${util.addCommas(thisSummary.pricePerUnit)} (${util.addCommas(thisSummary.orders)} order${thisSummary.orders === 1 ? '' : 's'})`);
                i++;
            }
            return result;
        }
    }
}