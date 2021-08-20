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
    }
}