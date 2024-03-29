const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ['name'],
    description: 'Gets the name of a player.',
    usage: '<uuid>',
    requiresArgs: true,

    async execute(bot, message, args) {
        let name = await this.getName(bot, message, args[0])
        if (!name) return;
        util.sendMessage(message.channel, new Discord.MessageEmbed()
            .setColor(Colors.GOLD)
            .setTitle(`uuid ${args[0]} belongs to:`)
            .setDescription(name)
        );
    },

    /**
     * Returns the name of a player. If their name was changed
     * recently (within the past 2 weeks), returns 'newName (previousName)'.
     * @param {Discord.Client} bot the bot
     * @param {Discord.Message} message the message sent
     * @param {string} uuid the player's uuid whose name you want.
     * @returns 
     */
    async getName(bot, message, uuid) {
        console.log(uuid)
        console.log(`Fetching https://api.mojang.com/user/profile/${uuid}`)
        return fetch(`https://api.mojang.com/user/profile/${uuid}`)
            .then(response => {
                if (response.ok) {
                    return response.json().then(data => {
                        return `${data.name}`;
                    }).catch(error => {
                        util.sendMessage(message.channel, new Discord.MessageEmbed()
                            .setTitle('Error!')
                            .setDescription(error.message)
                        );
                        return null;
                    });
                } else {
                    return response.json().then(data => {
                        util.sendMessage(message.channel, new Discord.MessageEmbed()
                            .setTitle(`Error ${response.status}: ${response.statusText}`)
                            .setDescription(data.errorMessage)
                        );
                        return null;
                    }).catch(error => {
                        util.sendMessage(message.channel, new Discord.MessageEmbed()
                            .setTitle('Error!')
                            .setDescription(error.message)
                        );
                        return null;
                    });
                }
            })
            .catch(error => {
                util.sendMessage(message.channel, new Discord.MessageEmbed()
                    .setTitle('Error!')
                    .setDescription(error.message)
                );
                return null;
            });
    },
}