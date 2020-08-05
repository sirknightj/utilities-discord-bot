const util = require('../utilities');
const config = require('../config.json');
const { MessageEmbed, GuildMember } = require('discord.js');

module.exports = {
    name: 'userinfo',
    description: 'Gets info about the user.',
    usage: `<user>`,
    requiresTarget: true,
    execute(bot, message, args, target) {
        message.delete();
        const embed = new MessageEmbed()
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addField('User', [
                `Discord Tag: ${target.user.tag}`,
                `Display Name: ${target.displayName}`,
                `Created: ${target.user.createdAt}`,
                `Status: ${target.user.presence.status}`,
                `Locale: ${target.user.locale || 'None'}`
            ])
            .addField('Member', [
                `Highest Role: ${target.roles.highest.id === message.guild.id ? 'None' : target.roles.highest.name}`,
                `Server Join Date: ${target.joinedAt}`,
            ]);

        util.sendTimedMessage(message.channel, embed, config.userinfo_and_myperms_delete_delay);
        util.sendTimedMessage(message.channel, `The above message will be deleted after ${config.userinfo_and_myperms_delete_delay/1000} seconds.`);
    }
}