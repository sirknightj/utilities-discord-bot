const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json')

module.exports = {
    name: "bazaar",
    description: "Checks the prices from a specified product from the Bazaar.",
    usage: `<product>`,
    requiresArgs: true,

    execute(bot, message, args) {
        if (!util.API_KEY || util.API_KEY === 'YOUR_HYPIXEL_API_KEY_HERE') {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "This command requires a Hypixel API Key.");
            return;
        }

        try {
            fetch(`https://api.hypixel.net/skyblock/bazaar/product?key=${config.API_KEY}&productId=${args.join('_').toUpperCase()}`)
                .then(response => response.json())
                .then(data => {
                    util.sendMessage(message.channel, new Discord.MessageEmbed()
                        .setColor(Color.GOLD)
                        .setTitle(`${data.product_info.quick_status.productId}`)
                        .addFields(
                            { name: "Buy Value", value: `${data.product_info.quick_status.buyPrice}` },
                            { name: "Buy Volume", value: `${data.product_info.quick_status.buyVolume}` },
                            { name: "Sell Value", value: `${data.product_info.quick_status.sellPrice}` },
                            { name: "Sell Volume", value: `${data.product_info.quick_status.sellVolume}` }
                        ));
                });
            util.safeDelete(message)
        } catch (err) {
            util.sendTimedMessage(message, channel, 'Error fetching the API.');
        }
    }
}