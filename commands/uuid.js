const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ['uuid'],
    description: 'Gets the uuid of a player.',
    usage: '<IGN>',
    requiresArgs: true,

    execute(bot, message, args) {
        fetch(`https://api.mojang.com/users/profiles/minecraft/${args[0]}`)
            .then(response => {
                console.log(response);
                if (response.ok) {
                    response.json().then(data => {
                        util.sendMessage(message.channel, new Discord.MessageEmbed()
                            .setColor(Colors.GOLD)
                            .setTitle(`${args[0]}'s uuid:`)
                            .setDescription(data.id)
                        );
                    }).catch(error => {
                        util.sendMessage(message.channel, new Discord.MessageEmbed()
                            .setTitle('Error!')
                            .setDescription(error.message)
                        );
                    });
                } else {
                    response.json().then(data => {
                        util.sendMessage(message.channel, new Discord.MessageEmbed()
                            .setTitle(`Error ${response.status}: ${response.statusText}`)
                            .setDescription(data.errorMessage)
                        );
                    }).catch(error => {
                        util.sendMessage(message.channel, new Discord.MessageEmbed()
                            .setTitle('Error!')
                            .setDescription(error.message)
                        );
                    });
                }
            })
            .catch(error => {
                util.sendMessage(message.channel, new Discord.MessageEmbed()
                    .setTitle('Error!')
                    .setDescription(error.message)
                );
            });
    },

    async getUUID(bot, message, name) {
        return fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`)
            .then(response => {
                if (response.ok) {
                    return response.json().then(data => {
                        return data.id;
                    }).catch(error => {
                        util.sendMessage(message.channel, new Discord.MessageEmbed()
                            .setTitle('Error!')
                            .setDescription(error.message + "\n**It's likely that this IGN is outdated and currently not in use by anybody.**")
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
                util.sendMessage(mssage.channel, new Discord.MessageEmbed()
                    .setTitle('Error!')
                    .setDescription(error.message)
                );
                return null;
            });
    },
}