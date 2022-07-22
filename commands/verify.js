const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');
const uuid = require('./uuid.js');
const initskills = require('./initskills');
const { executor } = require('./updatename');

module.exports = {
    name: ['verify', 'link'],
    description: 'Links a Minecraft account to a Discord account',
    usage: '<Minecraft IGN>',

    async execute(bot, message, args) {
        if (!config.enable_hypixel_api_required_commands) {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "This command is disabled.");
            return;
        }

        if (!config.API_KEY || config.API_KEY === 'YOUR_HYPIXEL_API_KEY_HERE') {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "This command requires a Hypixel API Key.");
            return;
        }

        let current_uuid = util.getStats(message, message.member, 'mc_uuid');
        if (current_uuid) {
            util.sendMessage(message.channel, new Discord.MessageEmbed()
                .setTitle('Already Verified!')
                .setDescription(`\`${message.member.user.tag}\` is already linked to uuid \`${current_uuid}\``)
                .setColor(Colors.RED));
            return;
        }

        if (!args[0]) {
            util.sendMessage(message.channel, `Missing IGN.\nUsage is: \`${config.prefix}verify ${this.usage}\``);
        }

        let targetUuid = await uuid.getUUID(bot, message, args[0]);

        if (!targetUuid) {
            util.sendMessage(message.channel, 'Failed to get UUID. Are you sure you typed your IGN in right?');
            return;
        }

        let target = message.member;

        try {
            fetch(`https://api.hypixel.net/player?key=${config.API_KEY}&uuid=${targetUuid}`).then(response => {
                if (response.ok) {
                    response.json().then(data => {
                        if (data && data.player && data.player.socialMedia && data.player.socialMedia.links && data.player.socialMedia.links.DISCORD) {
                            let discordTag = data.player.socialMedia.links.DISCORD;
                            if (discordTag !== target.user.tag) {
                                util.sendMessage(message.channel, new Discord.MessageEmbed()
                                    .setTitle(':x: Error! :x:')
                                    .setDescription(`Your Discord tag doesn't match!\nHypixel says it's \`${discordTag}\`\nBut yours is \`${target.user.tag}\``)
                                    .setColor(Colors.RED));
                                return;
                            }
                            this.sendVerifyEmbed(message, target, targetUuid, data);
                            util.writeStats(message.member.guild, message.member, targetUuid, 'mc_uuid');
                            executor(bot, message, [target.user.id]);
                            initskills.execute(bot, message, [message.member.user.id]);
                        } else {
                            util.sendMessage(message.channel, "Please link your Discord account on Hypixel!");
                            return;
                        }
                    })
                } else {
                    response.json().then(data => {
                        util.sendMessage(message.channel, new Discord.MessageEmbed()
                            .setTitle(`Error ${response.status}: ${response.statusText}`)
                            .setDescription(data.cause)
                        );
                    });
                }
            })
            return;
        } catch (err) {
            util.sendTimedMessage(message, message.channel, 'Error fetching the API.');
        }
    },

    sendVerifyEmbed(message, target, targetUuid, data) {
        util.sendMessage(message.channel, new Discord.MessageEmbed()
            .setTitle('Success!')
            .setDescription(`\`${target.user.tag}\` is now linked to uuid \`${targetUuid}\`, which currently has IGN \`${data && data.player && data.player.displayname ? data.player.displayname : '???'}\`.\n\nUse \`${config.prefix}update\` to update your name.`)
            .setColor(Colors.GREEN)
            .setTimestamp());
    }
}