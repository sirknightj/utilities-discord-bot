const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: "bazaar",
    description: "Checks the prices from a specified product from the Bazaar.",
    usage: `<product>`,
    requiresArgs: true,

    execute(bot, message, args) {
        try {
            fetch(`https://api.hypixel.net/skyblock/bazaar/product?key=${config.API_KEY}&productId=${args.join('_').toUpperCase()}`)
                .then(response => response.json())
                .then(data => {
                    const BazaarEmbed = new Discord.MessageEmbed()
                        .setColor("#cc271f")
                        .setTitle(`${data.product_info.quick_status.productId}`)
                        .addFields(
                            { name: "Buy Value", value: `${data.product_info.quick_status.buyPrice}` },
                            { name: "Buy Volume", value: `${data.product_info.quick_status.buyVolume}` },
                            { name: "Sell Value", value: `${data.product_info.quick_status.sellPrice}` },
                            { name: "Sell Volume", value: `${data.product_info.quick_status.sellVolume}` }
                        )
                    sendMessage(message.channel, BazaarEmbed);
                });
                util.safeDelete(message)
        } catch (err) {
            util.sendTimedMessage('Error fetching the API.');
        }
    }
}