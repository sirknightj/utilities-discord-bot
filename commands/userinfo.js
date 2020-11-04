const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: 'userinfo',
    description: 'Gets info about the user.',
    usage: `<user>`,
    requiresTarget: true,
    execute(bot, message, args, target) {
        util.safeDelete(message);
        const embed = new Discord.MessageEmbed()
            .setColor(Colors.YELLOW)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addField('User', [
                `Discord Tag: ${target.user.tag}`,
                `Display Name: ${target.displayName}`,
                `Created: ${target.user.createdAt}`,
                `Status: ${target.user.presence.status}`,
                `Locale: ${target.user.locale || 'None'}`
            ])
            .addField('Member', [
                `Highest Role: ${target.roles.highest.id === message.guild.id ? 'None' : target.roles.highest}`,
                `Roles: ${target.roles.cache.array().toString().replace(/,/g, ', ') || "None"}`,
                `Server Join Date: ${target.joinedAt}`,
            ])
            .setFooter(`This message will be automatically deleted after ${config.longer_delete_delay / 1000} seconds.`);

        util.sendTimedMessage(message.channel, embed, config.longer_delete_delay);
    }
}