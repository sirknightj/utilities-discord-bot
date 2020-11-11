const config = require('../config.json');
const util = require('../utilities');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ['userlist', 'roles', 'rolequery', 'listusers'],
    description: 'Prints out all of the users with the specified role.',
    usage: '<role name>',
    requiresArgs: true,

    execute(bot, message, args) {
        util.safeDelete(message);
        var role = util.getRoleFromMention(message, args.join(' '));

        if (!role) {
            util.sendTimedMessage(message.channel, `I can't find the role: ${args.join(' ')}`);
            return;
        }

        let listOfUsers = role.members.map(guildMember => `${guildMember.displayName}${guildMember.user.bot ? ' (bot)' : ''}`).sort((s1, s2) => {
            s1 = s1.toLowerCase();
            s2 = s2.toLowerCase();
            if (s1 > s2) {
                return 1;
            }
            if (s2 > s1) {
                return -1;
            }
            return 0;
        }).join(', ').replace(/_/g, '\\_');

        util.sendTimedMessage(message.channel, new Discord.MessageEmbed()
            .setColor(Colors.BLUE)
            .setTitle(`List of all users with the ${role.name} role \(${role.members.array().length}\)`)
            .setDescription(listOfUsers)
            .setFooter(`This message will be automatically deleted in ${config.longer_delete_delay / 1000} seconds.`),
            config.longer_delete_delay);
    }
}