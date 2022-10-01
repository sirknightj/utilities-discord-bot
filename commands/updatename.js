const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');
const name = require('./name.js');

module.exports = {
    name: ['update', 'updatename'],
    description: "Updates a player's name.",
    usage: '(optional: user)',

    execute: function (bot, message, args, returntype = false) {
        return this.executor(bot, message, args, returntype).catch(err => {
            util.sendMessage(message.channel, `${err}`);
        });
    },

    executor: async (bot, message, args, returntype = false) => {
        let target;
        if (!args[0]) {
            target = message.member;
        } else {
            target = util.getUserFromMention(message, args.join(' '));
            if (!target) {
                throw 'Invalid user `' + args.join(' ') + '`';
            }
        }

        let uuid = util.getStats(message, target, 'mc_uuid');
        if (!uuid) {
            util.sendMessage(message.channel, `${util.fixNameFormat(target.displayName)} isn't verified yet! Get them to \`${config.prefix}verify\` or use \`${config.prefix}forceverify\`.`);
            return;
        }
        let newName = await name.getName(bot, message, uuid);
        if (!newName) {
            util.sendMessage(message.channel, 'This should never happen, report immediately.');
            return;
        }
        if (!newName.includes('(')) {
            let custom_nickname = util.getStats(message, target, 'custom_nickname');
            if (custom_nickname) {
                newName = `${newName} (${custom_nickname})`;
                if (newName.length > 31) {
                    newName = newName.substring(0, 31) + ')';
                }
            }
        }

        
        let prevNickname = target.displayName;

        if (returntype) {
            if (newName === prevNickname) {
                return ``;
            } else {
                error = false;
                await target.setNickname(newName, `${message.member.user.tag} used ${config.prefix}update`).catch(err => {
                    error = true;
                    util.sendMessage(message.channel, new Discord.MessageEmbed()
                        .setColor(Colors.RED)
                        .setTitle('Error!')
                        .setDescription(`${err}\n<@${target.id}>: Failed to update \`${prevNickname}\` to \`${newName}\`.`));
                });
                if (error) {
                    return '';
                }
                return `<@${target.id}>: \`${prevNickname}\` was updated to \`${newName}\``;
            }
        }

        if (newName === prevNickname) {
            util.sendMessage(message.channel, new Discord.MessageEmbed()
                .setTitle(`Nice! Your nickname is already up-to-date!`)
                .setDescription(`<@${target.id}>: \`${prevNickname}\` is still \`${prevNickname}\`.`)
                .setColor(Colors.YELLOW)
                .setTimestamp());
        } else {
            return target.setNickname(newName, `${message.member.user.tag} used ${config.prefix}update`)
            .then(() => {
                util.sendMessage(message.channel, new Discord.MessageEmbed()
                    .setTitle(`Name update!`)
                    .setDescription(`<@${target.id}>: \`${prevNickname}\` was updated to \`${newName}\`.`)
                    .setColor(Colors.GREEN)
                    .setTimestamp());
            }).catch((err) => {
                util.sendMessage(message.channel, new Discord.MessageEmbed()
                    .setTitle('Error updating nickname!')
                    .setDescription(`Attempted to update ${target}'s nickname to \`${newName}\`, but got the following error:\n${err.message}`)
                    .setColor(Colors.RED)
                    .setTimestamp());
            });
        }
    },
        

    updateNickname: async (message, target, newName, returntype = false) => {
        let prevNickname = target.displayName;

        if (returntype) {
            if (newName === prevNickname) {
                return ``;
            } else {
                error = false;
                await target.setNickname(newName, `${message.member.user.tag} used ${config.prefix}update`).catch(err => {
                    error = true;
                    util.sendMessage(message.channel, new Discord.MessageEmbed()
                        .setColor(Colors.RED)
                        .setTitle('Error!')
                        .setDescription(`${err}\n<@${target.id}>: Failed to update \`${prevNickname}\` to \`${newName}\`.`));
                });
                if (error) {
                    return '';
                }
                return `<@${target.id}>: \`${prevNickname}\` was updated to \`${newName}\``;
            }
        }

        if (newName === prevNickname) {
            util.sendMessage(message.channel, new Discord.MessageEmbed()
                .setTitle(`Nice! Your nickname is already up-to-date!`)
                .setDescription(`<@${target.id}>: \`${prevNickname}\` is still \`${prevNickname}\`.`)
                .setColor(Colors.YELLOW)
                .setTimestamp());
        } else {
            return target.setNickname(newName, `${message.member.user.tag} used ${config.prefix}update`)
            .then(() => {
                util.sendMessage(message.channel, new Discord.MessageEmbed()
                    .setTitle(`Name update!`)
                    .setDescription(`<@${target.id}>: \`${prevNickname}\` was updated to \`${newName}\`.`)
                    .setColor(Colors.GREEN)
                    .setTimestamp());
            }).catch((err) => {
                util.sendMessage(message.channel, new Discord.MessageEmbed()
                    .setTitle('Error updating nickname!')
                    .setDescription(`Attempted to update ${target}'s nickname to \`${newName}\`, but got the following error:\n${err.message}`)
                    .setColor(Colors.RED)
                    .setTimestamp());
            });
        }
    }
};