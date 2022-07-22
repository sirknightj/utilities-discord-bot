const util = require('../utilities');
const ms = require('ms');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');
const config = require('../config.json');

module.exports = {
    name: 'mute',
    description: "Mute a user.",
    usage: '<user> (optional: duration) (optional: reason)',
    requiredPermissions: 'KICK_MEMBERS',
    requiresTarget: true,

    execute(bot, message, args, member) {
        let mutedRole = message.guild.roles.cache.find((role) => role.name === 'Muted');

        if (!message.guild.me.hasPermission('MANAGE_ROLES')) {
            util.sendMessage(message.channel, "I don't have permission to do this. I need `MANAGE_ROLES`.");
            return;
        }

        if (!mutedRole) {
            util.sendMessage(message.channel, "I can't find a role called `Muted`");
            return;
        }

        if (message.guild.me.roles.highest.comparePositionTo(mutedRole) <= 0) {
            util.sendMessage(message.channel, "The `Muted` role is above my role. I cannot assign roles higher than my highest role!");
            return;
        }

        let stats = util.getMemberStats(message, member);
        if (stats.muted) {
            util.sendMessage(message.channel, `This member is already muted!`);
            return;
        }

        let channelsToSend = [];
        if (config.channel_ids_to_log_punishments) {
            if (typeof config.channel_ids_to_log_punishments !== 'object') {
                let channel = util.getChannelFromMention(message, config.channel_ids_to_log_punishments);
                if (channel) {
                    channelsToSend.push(channel);
                } else {
                    console.log(`mute.js: Could not locate channel with id ${config.channel_ids_to_log_punishments} in ${message.guild.name}.`);
                }
            } else {
                channelsToSend = config.channel_ids_to_log_punishments.reduce((array, channelId) => {
                    let channel = util.getChannelFromMention(message, channelId)
                    if (channel) {
                        array.push(channel);
                    } else {
                        console.log(`mute.js: Could not locate channel with id ${config.channel_ids_to_log_punishments} in ${message.guild.name}.`);
                    }
                    return array;
                }, []);
            }
        }
        let logChannel = util.getLogChannel(message);
        if (logChannel) {
            if (!channelsToSend.some((channel) => channel.id === logChannel.id)) {
                channelsToSend.push(logChannel);
            }
        }

        let channelsToDisplay = [];
        if (config.channel_ids_to_list_current_mutes) {
            if (typeof config.channel_ids_to_list_current_mutes !== 'object') {
                let channel = util.getChannelFromMention(message, config.channel_ids_to_list_current_mutes);
                if (channel) {
                    channelsToDisplay.push(channel);
                } else {
                    console.log(`mute.js: Could not locate channel with id ${config.channel_ids_to_list_current_mutes} in ${message.guild.name}.`);
                }
            } else {
                channelsToDisplay = config.channel_ids_to_list_current_mutes.reduce((array, channelId) => {
                    let channel = util.getChannelFromMention(message, channelId)
                    if (channel) {
                        array.push(channel);
                    } else {
                        console.log(`mute.js: Could not locate channel with id ${config.channel_ids_to_list_current_mutes} in ${message.guild.name}.`);
                    }
                    return array;
                }, []);
            }
        }

        let duration = 0;

        if (args[0]) {
            duration = ms(args[0]);
        }

        if (duration) {
            args.shift();
        }

        let reason = args.join(' ');

        member.roles.add(mutedRole.id);

        let embed = new Discord.MessageEmbed()
            .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addField('Staff', `${message.author.tag}\n<@${message.member.id}>`, true)
            .addField('Muted', `${member.user.tag}\n<@${member.id}>`, true)
            .addField('Length', `${duration ? ms(duration) : 'indefinitely'}`, true)
            .addField('With Reason', reason ? reason : 'No reason provided.')
            .setColor(Colors.PURPLE)
            .setTimestamp();
        
        util.sendMessage(message.channel, 'Done.');

        for (let channel of channelsToSend) {
            util.sendMessage(channel, embed);
        }

        let messagesToDeleteLater = [];
        for (let channel of channelsToDisplay) {
            util.sendMessage(channel, `<@${member.id}>`).then((msg) => messagesToDeleteLater.push(msg));
            util.sendMessage(channel, embed).then((msg) => messagesToDeleteLater.push(msg));
        }

        if (duration) {
            setTimeout(() => {
                if (message.guild.me.hasPermission('MANAGE_ROLES')) { 
                    member.roles.remove(mutedRole.id);
                    util.sendMessage(message.channel, `<@${member.id}> has now been unmuted.`);
                } else {
                    util.sendMessage(message.channel, `<@${message.member.id}>, ${member.user.tag} was supposed to be unmuted just now, but I don't have permissions to remove their role!`)
                }
                for (let message of messagesToDeleteLater) {
                    if (message && !message.deleted) {
                        message.delete();
                    }
                }
            }, duration);
        }
    }
}