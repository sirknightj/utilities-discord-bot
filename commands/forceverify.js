const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');
const uuid = require('./uuid.js');
const updatename = require('./updatename.js');
const verify = require('./verify.js');
const initskills = require('./initskills');
const name = require('./name.js');

module.exports = {
    name: ['forceverify', 'fv', 'forcelink', 'fl'],
    description: 'Force links a Minecraft account to a Discord account',
    usage: '<user> <Minecraft IGN>',
    requiredPermissions: 'MANAGE_MESSAGES',

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

        if (!args[0]) {
            util.sendMessage(message.channel, 'Missing user');
            return;
        }

        if (!args[1]) {
            util.sendMessage(message.channel, 'Missing IGN');
            return;
        }

        let target = util.getUserFromMention(message, args[0]);

        if (!target) {
            util.sendMessage(message.channel, 'Invalid target: `' + args[0] + '`');
            return;
        }

        let curr_uuid = util.getStats(message, target, 'mc_uuid');
        if (curr_uuid) {
            util.sendMessage(message.channel, new Discord.MessageEmbed()
                .setTitle(':warning: Warning! :warning:')
                .setDescription(`${target} is already verified!\nThey are linked to \`${curr_uuid}\`, which belongs to IGN \`${await name.getName(bot, message, curr_uuid)}\``)
                .setColor(Colors.RED)
                .setFooter('Are you sure you want to proceed?')
            ).then(msg => {
                msg.react('✅')
                    .then(() => {
                        msg.react('❌');
                    })
                    .then(() => {
                        const collector = msg.createReactionCollector((reaction, user) => {
                            return user.id === message.member.id;
                        }, { time: 60000, max: 1 })

                        collector.on('collect', async reaction => {
                            if (reaction.emoji.name === '✅') {
                                msg.reactions.removeAll();

                                let targetUuid = await uuid.getUUID(bot, message, args[1]);
                                if (!targetUuid) {
                                    console.log(targetUuid)
                                    throw 'Failed to get UUID';
                                }

                                this.phase2(bot, message, target, targetUuid).catch((err) => console.log(err));
                                return;
                            } else {
                                util.sendMessage(message.channel, `Canceled.`);
                                msg.reactions.removeAll();
                                return;
                            }
                        });
                        collector.on('end', collected => {
                            if (collected.size === 0) {
                                util.sendMessage(message.channel, `${util.fixNameFormat(message.member.displayName)} did not respond within 60 seconds. Automatically canceled.`);
                                msg.reactions.removeAll();
                                return;
                            }
                        });
                    });
            });
        } else {
            let targetUuid = await uuid.getUUID(bot, message, args[1]);
            if (!targetUuid) {
                console.log(targetUuid)
                throw 'Failed to get UUID';
            }
            this.phase2(bot, message, target, targetUuid).catch((err) => console.log(err));
        }
    },

    async phase2(bot, message, target, targetUuid) {
        try {
            console.log(`Fetching https://api.hypixel.net/player?key=${config.API_KEY}&uuid=${targetUuid}`)
            fetch(`https://api.hypixel.net/player?key=${config.API_KEY}&uuid=${targetUuid}`).then(response => {
                if (response.ok) {
                    response.json().then(data => {
                        if (data) {
                            let discordTag = data && data.player && data.player.socialMedia && data.player.socialMedia.links && data.player.socialMedia.links.DISCORD ? data.player.socialMedia.links.DISCORD : undefined;
                            if (discordTag !== target.user.tag) {
                                let desc;
                                if (discordTag) {
                                    desc = `Their Discord tags don't match!\nHypixel says it's \`${discordTag}\`\nBut theirs is \`${target.user.tag}\``;
                                } else {
                                    desc = `\`${target.user.tag}\` does not have a Discord account linked on Hypixel!`
                                }
                                util.sendMessage(message.channel, new Discord.MessageEmbed()
                                    .setTitle(':warning: Warning! :warning:')
                                    .setDescription(desc)
                                    .setColor(Colors.RED)
                                    .setFooter('Are you sure you want to proceed?')
                                ).then(msg => {
                                    msg.react('✅')
                                        .then(() => {
                                            msg.react('❌');
                                        })
                                        .then(() => {
                                            const collector = msg.createReactionCollector((reaction, user) => {
                                                return user.id === message.member.id;
                                            }, { time: 60000, max: 1 })
                    
                                            collector.on('collect', reaction => {
                                                if (reaction.emoji.name === '✅') {
                                                    this.writeUUID(target, targetUuid);
                                                    verify.sendVerifyEmbed(message, target, targetUuid, data);
                                                    msg.reactions.removeAll();
                                                    if (data.player.displayname !== target.displayName) {
                                                        updatename.execute(bot, message, [target.user.id]);
                                                    }
                                                    initskills.execute(bot, message, [target.user.id]);
                                                    return;
                                                } else {
                                                    util.sendMessage(message.channel, `Canceled.`);
                                                    msg.reactions.removeAll();
                                                    return;
                                                }
                                            });
                                            collector.on('end', collected => {
                                                if (collected.size === 0) {
                                                    util.sendMessage(message.channel, `${util.fixNameFormat(message.member.displayName)} did not respond within 60 seconds. Automatically canceled.`);
                                                    msg.reactions.removeAll();
                                                }
                                            });
                                        });
                                });
                            } else {
                                this.writeUUID(target, targetUuid);
                                
                                verify.sendVerifyEmbed(message, target, targetUuid, data);
                                if (data.player.displayname !== target.displayName) {
                                    updatename.execute(bot, message, [target.user.id]);
                                }
                                initskills.execute(bot, message, [target.user.id]);
                            }                            
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

    writeUUID(member, uuid) {
        util.writeStats(member.guild, member, uuid, 'mc_uuid');
    }
}