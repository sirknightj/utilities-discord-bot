const util = require('../utilities');
const config = require('../config.json');
const { MessageEmbed, GuildMember } = require('discord.js');

module.exports = {
    name: ['myperms', 'mypermissions', 'perms', 'permissions'],
    description: "Gets all of the user's permissions.",
    usage: `(optional: user) (optional: channel-name)`,

    execute(bot, message, args) {
        if (args.length > 2) {
            throw new InvalidUsageException();
        }

        var target, targetChannel;

        if (args.length === 2) {
            //This means args[0] = user, and args[1] = channel-name;
            let lookingFor = args.shift();
            target = util.getUserFromMention(message, lookingFor);
            if (!target) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `Error: Cannot find user ${lookingFor}.`);
                return;
            }
            targetChannel = util.getChannelFromMention(message, args[0]);
            if (!targetChannel) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `Error: Cannot find channel ${args[0]}.`);
                return;
            }
        } else if (args.length === 1) {
            let lookingFor = args.shift();
            target = util.getUserFromMention(message, lookingFor);
            targetChannel = util.getChannelFromMention(message, lookingFor);
            if (!target && !targetChannel) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `Error: Cannot find user or channel ${lookingFor}.`);
                return;
            }
        }

        if(!target) {
            target = message.member;
        }

        util.safeDelete(message);
        const embed = new MessageEmbed()
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addField('User Info', [
                `Discord Tag: ${target.user.tag}`,
                `Display Name: ${target.displayName}`
            ])
            .addField('Discord Info', [
                `Highest Role: ${target.roles.highest.id === message.guild.id ? 'None' : target.roles.highest.name}`,
                `Permissions${(targetChannel) ? ` in ${targetChannel}` : ""}: ${target.permissionsIn(targetChannel || message.channel).toArray()}`
            ])
            .setDescription(`This message will be automatically deleted after ${config.userinfo_and_myperms_delete_delay / 1000} seconds.`);

        util.sendTimedMessage(message.channel, embed, config.userinfo_and_myperms_delete_delay);
    }
}