const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');

module.exports = {
    name: "slots",
    description: "Roll the slot machine!",
    usage: '',

    execute(bot, message, args) {
        let slots = [":orange_circle:", ":green_circle:", ":blue_circle:", ":red_circle:"]
        let result1 = Math.floor((Math.random() * slots.length));
        let result2 = Math.floor((Math.random() * slots.length));
        let result3 = Math.floor((Math.random() * slots.length));
        try {
            if (slots[result1] === slots[result2] && slots[result1] === slots[result3]) {
                let embed = new Discord.MessageEmbed()
                    .setFooter('yaaay', message.author.displayAvatarURL)
                    .setTitle('Cool, I guess.')
                    .addField('Result:', slots[result1] + " : " + slots[result2] + " : " + slots[result3], true)
                    .setColor(0x59c957)
                util.sendMessage(message.channel, embed);
            } else {
                let embed2 = new Discord.MessageEmbed()
                    .setFooter(`you are bad`, message.author.displayAvatarURL)
                    .setTitle('Wow, what a loser, amirite?')
                    .addField('Result:', slots[result1] + " : " + slots[result2] + " : " + slots[result3], true)
                    .setColor(0xcc271f)
                util.sendMessage(message.channel, embed2);
            }
        } catch (err) {
            console.log(err.stack)
        }
    }
}