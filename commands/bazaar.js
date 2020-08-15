const util = require('../utilities');
const util = require('../utilities');
const config = require('../config.json');
const { sendTimedMessage } = require('../utilities');
const { DiscordAPIError } = require('discord.js');

modules.export = {
    name: "bazaar",
    description: "Checks the prices from a specified product from the Bazaar.",
    usage: `!bazaar <product>`,
    requiresArgs: true,

    execute(bot,message,args) {
        fetch(`https:api.hypixel.net/skyblock/bazaar/product?key=${config.API_KEY}&productId=${args}`)
        .then(result => result.json())
        if (result.success) {
            const BazaarEmbed = new Discord.MessageEmbed()
            .setColor("#cc271f")
            .setTitle(`${result.product_info.product_id}`)
            .addFields(
                {name: "Buy Value", value: `${result.products.buyPrice}`},
                {name: "Buy Volume", value: `${result.products.buyVolume}`},
                {name: "Sell Value", value: `${result.products.sellPrice}`},
                {name: "Sell Volume", value: `${result.products.sellVolume}`}
            )
            sendTimedMessage(message.channel, BazaarEmbed)
        } else {
            sendTimedMessage(channel.message, `Error: Couldn't get the product. Reason: ${result.cause}`)
        }
    }
}