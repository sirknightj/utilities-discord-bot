const Discord = require('discord.js');
const bot = new Discord.Client({ ws: new Discord.Intents().add(Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_BANS, Discord.Intents.FLAGS.GUILD_VOICE_STATES) });
const config = require('./config.json');
const util = require('./utilities');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('./resources/colors.json');
const stringSimilarity = require("string-similarity");
const { getUUID } = require('./commands/uuid');
const updateName = require('./commands/updatename');

bot.commands = new Discord.Collection();

const commandList = [];
const allAliases = [];
const pointMap = new Map();

// Read all of the command files from the './commands' folder, and initializes all of the commands.
for (command of fs.readdirSync('./commands').filter(file => file.endsWith('.js'))) {
    const botCommand = require(`./commands/${command}`);

    if (typeof botCommand.name === 'string') {
        botCommand.name = [botCommand.name];
    }

    commandList.push(botCommand.name[0]);
    for (commandAlias of botCommand.name) {
        bot.commands.set(commandAlias, botCommand);
        allAliases.push(commandAlias);
    }
}

// Initializes the point map
for (let i = 0; i < config.point_earnings.length; i++) {
    pointMap.set(config.point_earnings[i][0], config.point_earnings[i][1]);
}

// Makes sure that the config.channel_ids_not_to_accept_commands_from is an array of strings, so we can loop through it.
if (typeof config.channel_ids_to_not_accept_commands_from === 'number') {
    config.channel_ids_to_bother = ["" + config.channel_ids_to_bother];
} else if (typeof config.channel_ids_to_not_accept_commands_from === 'string') {
    config.channel_ids_to_not_accept_commands_from = [config.channel_ids_to_not_accept_commands_from];
}

bot.once('ready', () => {
    // bot.user.setStatus('invisible');
    console.log('online!');
    setInterval(() => {
        fs.copyFile(
            `${config.resources_folder_file_path}stats.json`,
            `${config.resources_folder_file_path}backup_stats.json`,
            (err) => console.error
        );
    }, 1000 * 60 * 60); // 1 hour
    setInterval(() => {
        fs.copyFile(
            `${config.resources_folder_file_path}stats.json`,
            `${config.resources_folder_file_path}daily_backup_stats.json`,
            (err) => console.error
        );
        console.log(`Daily backup made on ${new Date(Date.now())}`);
    }, 1000 * 60 * 60 * 24); // 24 hours
});

bot.on('message', async message => {

    // Manage messages sent in the guild chat channel (discord-minecraft chat bridge)
    if (message.channel.id === config.guild_chat_channel) {
        if (!message.author.bot) return;
        for (const embed of message.embeds) {
            if (embed.author) {
                let user = embed.author.name;
                if (!user.includes(' ')) {
                    let userr = message.guild.members.cache.find(member => {
                        return member.displayName.replace(/ *\([^)]*\) */g, "") === user;
                    });
                    if (userr) {
                        manageGuildStats(message, userr);
                    } else {
                        let uuid = await getUUID(bot, message, user);
                        let target = message.guild.members.cache.find(member => {
                            return !member.user.bot && util.getStats(message, member, 'mc_uuid') === uuid;
                        });
                        if (!target) {
                            util.sendMessage(util.getLogChannel(message), "I can't find any discord accounts verified to `" + user + "`");
                            return;
                        }
                        await updateName.executor(bot, message, [target.user.id]);
                        util.sendMessage(util.getLogChannel(message), `I updated \`${target.displayName}\`'s nickname to \`${user}\`!`);
                    }
                } else if (user.endsWith(' left.')) {
                    user = user.slice(0, -6);
                    let userr = message.guild.members.cache.find(member => {
                        return member.displayName.replace(/ *\([^)]*\) */g, "") === user;
                    });
                    if (userr) {
                        util.setStats(message, userr, 0, 'online_status');
                    } else {
                        let uuid = await getUUID(bot, message, user);
                        let target = message.guild.members.cache.find(member => {
                            return !member.user.bot && util.getStats(message, member, 'mc_uuid') === uuid;
                        });
                        if (!target) {
                            util.sendMessage(util.getLogChannel(message), "I can't find any discord accounts verified to `" + user + "`");
                            return;
                        }
                        await updateName.executor(bot, message, [target.user.id]);
                        util.sendMessage(util.getLogChannel(message), `I updated \`${target.displayName}\`'s nickname to \`${user}\`!`);
                    }
                    return;
                } else if (user.endsWith(' joined.')) {
                    user = user.slice(0, -8);
                    let userr = message.guild.members.cache.find(member => {
                        return member.displayName.replace(/ *\([^)]*\) */g, "") === user;
                    });
                    if (userr) {
                        util.setStats(message, userr, 1, 'online_status');
                    } else {
                        let uuid = await getUUID(bot, message, user);
                        let target = message.guild.members.cache.find(member => {
                            return !member.user.bot && util.getStats(message, member, 'mc_uuid') === uuid;
                        });
                        if (!target) {
                            util.sendMessage(util.getLogChannel(message), "I can't find any discord accounts verified to `" + user + "`");
                            return;
                        }
                        await updateName.executor(bot, message, [target.user.id]);
                        util.sendMessage(util.getLogChannel(message), `I updated \`${target.displayName}\`'s nickname to \`${user}\`!`);
                    }
                    return;
                } else if (user.endsWith(' Joined')) {
                    // Joined the guild
                    user = embed.description.split(' ')[0];
                    let userr = message.guild.members.cache.find(member => {
                        return member.displayName.replace(/ *\([^)]*\) */g, "") === user;
                    });
                    if (userr) {
                        util.setStats(message, userr, 1, 'online_status');
                    } else {
                        let uuid = await getUUID(bot, message, user);
                        let target = message.guild.members.cache.find(member => {
                            return !member.user.bot && util.getStats(message, member, 'mc_uuid') === uuid;
                        });
                        if (!target) {
                            util.sendMessage(util.getLogChannel(message), "I can't find any discord accounts verified to `" + user + "`");
                            return;
                        }
                        await updateName.executor(bot, message, [target.user.id]);
                        util.sendMessage(util.getLogChannel(message), `I updated \`${target.displayName}\`'s nickname to \`${user}\`!`);
                    }
                    return;
                } else if (user.endsWith(' Left')) {
                    // Left the guild
                    user = embed.description.split(' ')[0];
                    let userr = message.guild.members.cache.find(member => {
                        return member.displayName.replace(/ *\([^)]*\) */g, "") === user;
                    });
                    if (userr) {
                        util.setStats(message, userr, 0, 'online_status');
                    } else {
                        let uuid = await getUUID(bot, message, user);
                        let target = message.guild.members.cache.find(member => {
                            return !member.user.bot && util.getStats(message, member, 'mc_uuid') === uuid;
                        });
                        if (!target) {
                            util.sendMessage(util.getLogChannel(message), "I can't find any discord accounts verified to `" + user + "`");
                            return;
                        }
                        await executor(bot, message, [target.user.id]);
                        util.sendMessage(util.getLogChannel(message), `I updated \`${target.displayName}\`'s nickname to \`${user}\`!`);
                    }
                    return;
                }
            }
        }
    }

    // Make sure that the message is not from another bot, and only from a text channel.
    if (message.channel.type !== 'text' || message.author.bot) {
        return;
    }
        
    manageStats(message);

    // Checks if the message starts with a prefix.
    if (message.content.startsWith(config.prefix)) {
        // Makes sure that the bot is allowed to accept commands from this channel.
        if (config.channel_ids_to_not_accept_commands_from.includes(message.channel.id)) {
            return;
        }

        console.log(`${message.author.tag}: ${message.content}`); // for debugging purposes.

        const args = message.content.trim().slice(config.prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'help') {
            const helpLimit = 30;
            let count = 0;
            util.safeDelete(message);
            var helpMessage = '';
            for (commandName of commandList) {
                var commands = bot.commands.get(commandName);
                if (!commands.hiddenFromHelp) {
                    helpMessage += `\`${config.prefix}${commandName} help\` ${commands.description}\n`;
                }
                count++;
                if (count >= helpLimit) {
                    util.sendTimedMessage(message.channel, new Discord.MessageEmbed()
                        .setTitle('Here are all of my commands:')
                        .setDescription(helpMessage)
                        .setFooter(`This message will be automatically deleted in ${config.longest_delete_delay / 1000} seconds.`),
                        config.longest_delete_delay);
                    count = 0;
                    helpMessage = '';
                }
            }
            util.sendTimedMessage(message.channel, new Discord.MessageEmbed()
                .setTitle('Here are all of my commands:')
                .setDescription(helpMessage)
                .setFooter(`This message will be automatically deleted in ${config.longest_delete_delay / 1000} seconds.`),
                config.longest_delete_delay);
            return;
        }

        if (command === 'refresh') {
            updateServerStats(message.guild);
            util.sendMessage(message.channel, "OK!");
            return;
        }

        // If the command exists...
        if (allAliases.includes(command)) {

            var requiredPerms = bot.commands.get(command).requiredPermissions;
            // If the requiredPermissions property is a string, turn it into an array.
            const botCommand = bot.commands.get(command);
            if (requiredPerms && typeof requiredPerms === 'string') {
                requiredPerms = [requiredPerms];
            }

            // If the first word after the command name is "help" or "usage", then display how to use it.
            if (args[0]) {
                if (args[0].toLowerCase() === 'help' || args[0].toLowerCase() === 'usage') {
                    util.safeDelete(message, config.longer_delete_delay);
                    let embed = new Discord.MessageEmbed()
                        .setTitle(`${config.prefix}${command}`)
                        .setAuthor(message.member.displayName, message.member.user.displayAvatarURL({ dynamic: true }))
                        .setDescription(botCommand.description);

                    if (botCommand.usage && botCommand.usage.length > 0) {
                        embed.addField('Usage', usageToString(command, botCommand.usage));
                    } else {
                        embed.addField(`Usage`, `\`${config.prefix}${command}\``);
                    }
                    if (botCommand.requiredPermissions) {
                        if (typeof botCommand.requiredPermissions === 'string') {
                            embed.addField('Permissions Required To Use:', botCommand.requiredPermissions);
                        } else {
                            embed.addField('Permissions Required To Use:', botCommand.requiredPermissions.join(', '));
                        }
                    }
                    embed.addField('Aliases', botCommand.name.join(', '))
                        .setFooter([`< > = required argument, ( ) = optional argument`, `This message will automatically be deleted in ${config.longer_delete_delay / 1000} seconds.`])
                        .setColor(Colors.BLACK)
                        .setTimestamp();
                    util.sendTimedMessage(message.channel, embed, config.longer_delete_delay);
                    return;
                }
            }

            // If a command has the requiredPermissions property, then check that the sender has the all of the requiredPermissions.
            if (requiredPerms && requiredPerms.length) {
                // Loop through all required permissions. If the user is missing any of them, then don't perform the command.
                for (var permission of requiredPerms) {
                    if (!message.member.hasPermission(permission)) {
                        util.sendMessage(message.channel, `You do not have permission to use this command.\nMissing \`${permission}\`.`);
                        return;
                    }
                }
            }

            // Checks if the command requires arguments to be inputted. If the user did not put any, say the correct usage.
            if (botCommand.requiresArgs) {
                if (args.length == 0) {
                    util.safeDelete(message, config.delete_delay)
                    util.sendTimedMessage(message.channel, `Invalid usage.\n${usageToString(command, botCommand.usage)}`);
                    return;
                }
            }

            // Checks if the command requires a user to be mentioned.
            if (botCommand.requiresTarget) {

                // Attempts to find the user from the first argument args[0].
                let lookingFor = args.shift();
                const user = util.getUserFromMention(message, lookingFor);

                // Throws an error if there is no user found.
                if (!user) {
                    util.safeDelete(message, config.delete_delay)
                    util.sendTimedMessage(message.channel, `Invalid usage.\n${usageToString(command, botCommand.usage)}\nAdditional Info: Could not find user \`${lookingFor}\`.`);
                    return;
                }

                // Attempts to execute the message, while catching any missing bot permission errors.
                try {
                    botCommand.execute(bot, message, args, user);
                } catch (error) {
                    util.safeDelete(message, config.delete_delay)
                    util.sendTimedMessage(message.channel, `Invalid usage.\n${usageToString(command, botCommand.usage)}\nAdditional info: ${error}`);
                }
                return;
            }
            // Executes the command, if a mention isn't required, while catching any missing bot permission errors.
            try {
                botCommand.execute(bot, message, args);
            } catch (error) {
                util.safeDelete(message, config.delete_delay)
                console.log(error)
                util.sendTimedMessage(message.channel, `Invalid usage.\n${usageToString(command, botCommand.usage)}\nAdditional info: ${error}`);
            }
            return;
            // If the command doesn't exist...
        } else {
            const bestMatch = stringSimilarity.findBestMatch(command, commandList).bestMatch.target;
            const botCommand = bot.commands.get(bestMatch);
            const unknownCommandEmbed = new Discord.MessageEmbed()
                .setTitle('Unknown Command')
                .setDescription(`${config.unknown_command_message}\nThe closest command to \`${config.prefix}${command}\` is: \`${config.prefix}${bestMatch}\``)
                .addField('Description', botCommand.description)
                .setColor(Colors.RED);

            if (botCommand.usage && botCommand.usage.length > 0) {
                unknownCommandEmbed.addField('Usage', usageToString(bestMatch, botCommand.usage));
            } else {
                unknownCommandEmbed.addField(`Usage`, `\`${config.prefix}${bestMatch}\``);
            }
            if (botCommand.requiredPermissions) {
                if (typeof botCommand.requiredPermissions === 'string') {
                    unknownCommandEmbed.addField('Permissions Required To Use:', botCommand.requiredPermissions);
                } else {
                    unknownCommandEmbed.addField('Permissions Required To Use:', botCommand.requiredPermissions.join(', '));
                }
            }
            unknownCommandEmbed.addField('Aliases', botCommand.name.join(', '))
                .setFooter([`< > = required argument, ( ) = optional argument`, `This message will automatically be deleted in ${config.longer_delete_delay / 1000} seconds.`])

            util.sendTimedMessage(message.channel, unknownCommandEmbed, config.longer_delete_delay);
        }
        return;
        // If the message doesn't start with the prefix...
    } else {
        // Then, annoy the user, if they attach a photo in their message.

        // Makes sure that the message came from a channel that is OK to bother.
        if (config.channel_ids_to_bother) {

            // Makes sure that the channels to bother is in an array so we can loop through all of them.
            if (typeof config.channel_ids_to_bother === 'string') {
                config.channel_ids_to_bother = [config.channel_ids_to_bother];
            }

            // If this channel is in the OK to bother list, then...
            if (config.channel_ids_to_bother.includes("" + message.channel.id)) {

                // Checks that the user has sent a message with more than one attachment.
                if (message.attachments.size > 0) {
                    // This means they have sent a message with a photo as a "show-off" gesture.
                    // This means we can criticize, or praise them for their photo.
                    var message_to_send = "";
                    var reaction = "";
                    // Checks if this configuration setting is set.
                    if (config.user_ids_to_always_praise && config.user_ids_to_always_annoy) {
                        // Checks if the sender is on the "praise" list.
                        if (config.user_ids_to_always_praise.includes("" + message.author.id)) {
                            message_to_send = config.praising_messages_to_send[Math.floor((Math.random() * config.praising_messages_to_send.length))];
                            reaction = config.praising_reactions[Math.floor((Math.random() * config.praising_reactions.length))];
                            // Checks if the user is on the "naughty" list.
                        } else if (config.user_ids_to_always_annoy.includes("" + message.author.id)) {
                            message_to_send = config.annoying_messages_to_send[Math.floor((Math.random() * config.annoying_messages_to_send.length))];
                            reaction = config.annoying_reactions[Math.floor((Math.random() * config.annoying_reactions.length))];
                        } else {
                            // The user isn't on either list.
                            if (Math.floor(Math.random() * 4) === 1) {
                                // Be mean. 1/4 of being mean.
                                message_to_send = config.annoying_messages_to_send[Math.floor((Math.random() * config.annoying_messages_to_send.length))];
                                reaction = config.annoying_reactions[Math.floor((Math.random() * config.annoying_reactions.length))];
                            } else {
                                // Be nice. 3/4 of being nice.
                                message_to_send = config.praising_messages_to_send[Math.floor((Math.random() * config.praising_messages_to_send.length))];
                                reaction = config.praising_reactions[Math.floor((Math.random() * config.praising_reactions.length))];
                            }
                        }
                    } else {
                        return;
                    }
                    // Send the praise or criticism message, and also react.
                    util.sendMessage(message.channel, message_to_send);
                    message.react(reaction).catch(error => message.reply(`Error 179: ${error}`));
                }
            }
        }
        if (config.points_earning_channel_id) {
            // Makes sure that the channels to get points in array form, so we can loop through them.
            if (typeof config.points_earning_channel_id === 'string') {
                config.points_earning_channel_id = [config.points_earning_channel_id];
            }

            var keyword;
            if (config.points_earning_channel_id.includes("" + message.channel.id)) {
                let wordsToParse = message.content.split(' ');
                var pointsToEarn = 0;
                wordsToParse.forEach((word) => {
                    word = word.toLowerCase();
                    if (pointMap.has(word)) {
                        pointsToEarn = pointMap.get(word);
                        keyword = word;
                    }
                });
                if (pointsToEarn > 0) {
                    util.sendMessage(message.channel, `${message.member.displayName} has been awarded ${pointsToEarn} points and ${pointsToEarn} coins.\nReason: ${keyword}.`);
                    if (config.require_attachment_to_earn_points && !message.attachments.first() && config.missing_attachment_error_message) {
                        util.sendTimedMessage(message.channel, config.missing_attachment_error_message);
                    }
                    let result = util.addPoints(message, message.member, pointsToEarn, keyword);
                    let coinResult = util.addStats(message, message.member, pointsToEarn, "coins");

                    util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
                        .setColor(Colors.GOLD)
                        .setTitle("Awarded Points")
                        .setAuthor(message.member.displayName, message.author.displayAvatarURL({ dynamic: true }))
                        .setDescription(`${bot.user.username} (bot) manually awarded ${target.displayName} ${pointsToEarn} points and ${pointsToEarn} coins for ${keyword}!`)
                        .addField('Additional Info', [
                            `Points: ${util.addCommas(result.oldPoints)} » ${util.addCommas(result.newPoints)}`,
                            `Coins: ${util.addCommas(coinResult.oldPoints)} » ${util.addCommas(coinResult.newPoints)}`,
                            `${util.capitalizeFirstLetter(keyword)}: ${util.addCommas(result.oldReason)} » ${util.addCommas(result.newReason)}`,
                            `Date Awarded: ${new Date(Date.now())}`
                        ]));
                } else {
                    if (!message.attachments.first()) {
                        util.safeDelete(message);
                        util.sendTimedMessage(message.channel, `Do not send unrelated messages in this channel. If you're reporting an incorrect entry, discuss it in the appropriate channel.`, config.longer_delete_delay);
                    }
                    let acceptedValues = "(";
                    for (var i = 0; i < config.point_earnings.length; i++) {
                        acceptedValues += `\`${config.point_earnings[i][0]}\` `;
                    }
                    util.sendTimedMessage(message.channel, `Error: Your message is not exactly one of the specified accepted values ${acceptedValues.trim()}). No points were awarded.`, config.longer_delete_delay);
                }
            }
        }
    }
});

bot.on('voiceStateUpdate', async (oldState, newState) => {
    const afkChannel = newState.guild.channels.cache.get(config.afk_channel_id);
    const logChannel = newState.guild.channels.cache.get(config.log_channel_id);

    if (config.move_to_afk_on_self_deafen && newState.selfDeaf && afkChannel && newState.channel !== afkChannel && !newState.member.user.bot) { // if the member is self-deafened, move them to the AFK channel
        await newState.setChannel(afkChannel);
        await util.sendMessage(logChannel, `I have moved <@${newState.member.id}> to AFK for self-deafening.`);
        return;
    }

    if (!config.track_and_award_vc_usage) {
        return;
    }

    if ((oldState.channel === newState.channel) || // i.e. muted/unmuted/deafen/undeafen
        (oldState.channel === afkChannel && !newState.channel) || // i.e. left AFK
        (!oldState.channel && newState.channel === afkChannel) || // i.e. joined AFK from not being in vc
        (oldState.channel && newState.channel && oldState.channel != afkChannel && newState.channel != afkChannel)) { // moved from one VC to another
        return;
    }

    let target = oldState.member;
    var allStats = {};
    const fileLocation = `${config.resources_folder_file_path}stats.json`;

    if (fs.existsSync(fileLocation)) {
        allStats = jsonFile.readFileSync(fileLocation);
    }

    if (!(newState.guild.id in allStats)) {
        allStats[oldState.guild.id] = {};
    }

    const guildStats = allStats[newState.guild.id];

    if (!(target.user.id in guildStats) && (!newState.member.user.bot || config.bots_have_stats)) {
        guildStats[target.user.id] = {
            points: 0,
            last_message: 0,
            vc_session_started: 0,
            time_spent_in_vc: 0,
            participating_messages: 0
        };
    }

    const userStats = guildStats[target.user.id];
    const botStats = guildStats[oldState.guild.me.id];

    // Alert for leaving VC
    if ((oldState.channel && !newState.channel) || newState.channel.id === config.afk_channel_id) {
        let leavingEmbed = new Discord.MessageEmbed()
            .setColor(Colors.RED)
            .setTitle("Left Voice Channel")
            .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`${util.fixNameFormat(target.displayName)} left a Voice Channel.`)
            .addField('Timestamps', [
                `Left: ${new Date(Date.now())}`
            ]);

        if (oldState.guild.me.hasPermission('VIEW_AUDIT_LOG')) {
            const auditLogEntries = await oldState.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_DISCONNECT'
            });

            const auditLogEntry = auditLogEntries.entries.first();

            let prev_id = botStats['vc_disconnect_id'];
            let prev_num = botStats['vc_disconnect_number'];
            let newId = auditLogEntry ? auditLogEntry.id : null;
            let newNum = auditLogEntry ? auditLogEntry.extra.count : -1;
            if (auditLogEntry && prev_id !== newId || (prev_id == newId && newNum !== prev_num)) {
                leavingEmbed.setDescription(`${util.fixNameFormat(target.displayName)} was disconnected from a Voice Channel by ${util.fixNameFormat(auditLogEntry.executor.tag)}.`)
                    .setThumbnail(auditLogEntry.executor.displayAvatarURL({ dynamic: true }))
                    .setColor(Colors.PURPLE);
                botStats['vc_disconnect_id'] = newId;
                botStats['vc_disconnect_number'] = newNum;
                util.sendMessage(newState.guild.channels.cache.get('768570345996550145'), leavingEmbed);
            }
        }

        util.sendMessage(logChannel, leavingEmbed);

        if (!newState.member.user.bot || config.bots_have_stats) {
            // Awards points for every 5 minutes spent in VC.
            if (userStats.vc_session_started > 0) {
                let now = Date.now();
                let millisecondsSpent = now - userStats.vc_session_started;
                let secondsSpent = Math.floor(millisecondsSpent / 1000);
                let minutesSpent = Math.floor(secondsSpent / 60);
                let pointsToAdd = Math.floor(secondsSpent / 3) / 100 * 2; // 2 points per 5 minutes. Equivalent is 0.02 pts per 3 seconds.
                let beforePoints = userStats.points;
                userStats.points += pointsToAdd;
                userStats.points = Math.round(userStats.points * 100) / 100; // Rounds to the nearest 0.01 because of floating-point errors.
                if (!userStats['time_spent_in_vc']) {
                    userStats['time_spent_in_vc'] = 0;
                }
                let beforeTimeSpentInVC = userStats['time_spent_in_vc'];
                userStats['time_spent_in_vc'] += millisecondsSpent;
                let nowTimeSpentInVC = userStats['time_spent_in_vc'];

                let previousCoins = userStats.coins ? userStats.coins : 0;
                let bonus = userStats.upgrade_vc_earnings ? userStats.upgrade_vc_earnings * 20 : 0;
                let coinsToAdd = Math.round(((pointsToAdd) * 100) * (1 + bonus / 100)) / 100;
                userStats.coins = Math.round((userStats.coins + coinsToAdd) * 100) / 100;

                util.sendMessage(logChannel, new Discord.MessageEmbed()
                    .setColor(Colors.YELLOW)
                    .setTitle("Earned Points")
                    .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Awarded ${target.displayName} ${util.addCommas(pointsToAdd)} points and ${util.addCommas(coinsToAdd)} coins${bonus ? ` (+${bonus}% bonus!)` : ''} for being in a VC for ${util.addCommas(Math.floor(minutesSpent / 60))}h ${minutesSpent % 60}m ${secondsSpent % 60}s.`)
                    .addField('Additional Info', [
                        `Joined: ${new Date(userStats.vc_session_started)}`,
                        `Left: ${new Date(now)}`,
                        `Points: ${util.addCommas(beforePoints)} » ${util.addCommas(userStats.points)}`,
                        `Coins: ${util.addCommas(previousCoins)} » ${util.addCommas(userStats.coins)}`,
                        `Time Spent In VC: ${util.toFormattedTime(beforeTimeSpentInVC)} » ${util.toFormattedTime(nowTimeSpentInVC)}`
                    ]));

            }
            userStats.vc_session_started = 0;
        }
        // Alert for joining VC
    } else {
        userStats.vc_session_started = Date.now();
        util.sendMessage(logChannel, new Discord.MessageEmbed()
            .setColor(Colors.GREEN)
            .setTitle('Joined Voice Channel')
            .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`${target.displayName} joined a Voice Channel.`)
            .addField('Timestamps', [
                `Joined: ${new Date(userStats.vc_session_started)}`
            ]));
    }
    jsonFile.writeFileSync(fileLocation, allStats);
});

bot.on('guildMemberAdd', (newMember) => {
    updateServerStats(newMember.guild);
    if (!config.welcome_new_members || !config.welcome_message || newMember.user.bot) {
        return;
    }
    const welcomeChannel = newMember.guild.channels.cache.get(config.welcome_channel_id);
    if (!welcomeChannel) {
        console.log('Your welcome_channel_id is invalid.');
        return;
    }
    util.sendMessage(welcomeChannel, `<@${newMember.id}>, ${config.welcome_message}`);
});

bot.on('guildMemberRemove', async (memberAffected) => {
    console.log(memberAffected);
    console.log(`^ is no longer in this discord server. Timestamp: ${new Date(Date.now())}`);
    updateServerStats(memberAffected.guild);
    try {
        const logChannel = memberAffected.guild.channels.cache.get(config.log_channel_id);
        if (logChannel) {
            let info = [];
            let userStats;
            try {
                var allStats = {};
                const fileLocation = `${config.resources_folder_file_path}stats.json`;

                if (fs.existsSync(fileLocation)) {
                    allStats = jsonFile.readFileSync(fileLocation);
                } else {
                    util.sendTimedMessage(logChannel, "stats.json has not been properly configured.");
                    return;
                }

                userStats = (allStats[memberAffected.guild.id])[memberAffected.user.id];

                if (!userStats) {
                    util.sendTimedMessage(logChannel, `${memberAffected.displayName} had 0 points.`);
                } else {
                    let properties = Object.keys(userStats);
                    for (let i = 0; i < properties.length; i++) {
                        if (properties[i] !== 'last_message' && properties[i] !== 'vc_session_started') {
                            if (properties[i] === 'time_spent_in_vc') {
                                info.push(`${properties[i]}: ${util.toFormattedTime(userStats[properties[i]])}`)
                            } else if (properties[i] === 'daily_reward_last_claimed') {
                                info.push(`${properties[i]}: ${new Date(userStats[properties[i]])}`);
                            } else {
                                info.push(`${properties[i]}: ${util.addCommas(userStats[properties[i]])}`);
                            }
                        }
                    }
                }
            } catch (err) {
                util.sendTimedMessage(logChannel, "Error fetching stats.json.")
                console.log(err);
            }
            if (!info || info.length === 0) {
                info = ["0 points."];
            }

            const auditLogEntries = await memberAffected.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_KICK'
            });

            const auditLogEntry = auditLogEntries.entries.first();

            const embed = new Discord.MessageEmbed()
                .setColor(Colors.PINK)
                .setTitle('Is No Longer In The Discord Server')
                .setAuthor(memberAffected.displayName, memberAffected.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`${memberAffected.displayName} ${auditLogEntry && auditLogEntry.target.id === memberAffected.id ? `was kicked from ${memberAffected.guild.name} by ${auditLogEntry.executor.tag}` : `has left ${memberAffected.guild.name}`}.`)

            if (auditLogEntry && auditLogEntry.target.id === memberAffected.id && auditLogEntry.reason) {
                embed.addField('Kick Reason', auditLogEntry.reason)
            }

            let roles = memberAffected.roles.cache.array();
            if (roles.length > 1) {
                roles.sort((o1, o2) => Discord.Role.comparePositions(o1, o2));
            }

            embed.addField('Timestamps', [
                `Discord Tag: ${memberAffected.user.tag}`,
                `User ID: ${memberAffected.id}`,
                `Roles: ${roles.length > 0 ? roles.join(', ') : "None"}`,
                `Joined: ${memberAffected.joinedAt}`,
                `Left: ${new Date(Date.now())}`,
            ]).addField('Point Insights', info);

            logChannel.send(embed).then(msg => {
                if (userStats) {
                    util.deleteEntry(msg, memberAffected);
                }
            });
        } else {
            console.log(`Your log channel has not been configured properly.\n${memberAffected.displayName} has left/been removed from the server.\nUser ID: ${memberAffected.id}.\nTimestamp: ${new Date(Date.now())}`);
        }
    } catch (err) {
        console.log(err);
    }
});

bot.on('guildBanAdd', async (guild, userAffected) => {
    updateServerStats(guild);
    const logChannel = guild.channels.cache.get(config.log_channel_id);
    if (!logChannel) {
        console.log(`guildBanAdd: config.json is not set up correctly.\n${userAffected.tag} has been banned from the server ${userAffected.name}.`);
        return;
    }
    const auditLogEntries = await guild.fetchAuditLogs({
        limit: 1,
        type: 'MEMBER_BAN_ADD'
    });

    const auditLogEntry = auditLogEntries.entries.first();

    if (!auditLogEntry) {
        console.log(`${userAffected.tag} was banned from ${guild.name} but no audit log entry was located...`);
    }

    const embed = new Discord.MessageEmbed()
        .setColor(Colors.PURPLE)
        .setTitle('Is Now Banned From This Discord Server')
        .setAuthor(userAffected.tag, userAffected.displayAvatarURL({ dynamic: true }))
        .setDescription(`${userAffected.tag} has just been banned from this discord server${auditLogEntry.executor && auditLogEntry.target.id === userAffected.id ? ` by ${auditLogEntry.executor.tag}` : ''}.`)

    if (auditLogEntry && auditLogEntry.reason && auditLogEntry.target.id === userAffected.id) {
        embed.addField('Reason', auditLogEntry.reason);
    }

    if (auditLogEntry && auditLogEntry.executor && auditLogEntry.target.id === userAffected.id) {
        embed.setThumbnail(auditLogEntry.executor.displayAvatarURL({ dynamic: true }))
    }

    logChannel.send(embed.addField('Timestamps', [
        `User ID: ${userAffected.id}`,
        `Banned: ${new Date(Date.now())}`,
    ]));

    util.sendMessage(guild.channels.cache.get('768570345996550145'), embed); // EE
});

bot.on('guildBanRemove', async (guild, userAffected) => {
    updateServerStats(guild);
    const logChannel = guild.channels.cache.get(config.log_channel_id);
    if (!logChannel) {
        console.log(`guildBanRemove: config.json is not set up correctly.\n${userAffected.tag} has been unbanned from the server ${guild.name}.`);
        return;
    }

    const auditLogEntries = await guild.fetchAuditLogs({
        limit: 1,
        type: 'MEMBER_BAN_REMOVE'
    });

    const auditLogEntry = auditLogEntries.entries.first();

    if (!auditLogEntry) {
        console.log(`${userAffected.tag} was unbanned from ${guild.name} but no audit log entry was located...`);
    }

    const embed = new Discord.MessageEmbed()
        .setColor(Colors.PURPLE)
        .setTitle('Is Now Unbanned From This Discord Server')
        .setAuthor(userAffected.tag, userAffected.displayAvatarURL({ dynamic: true }))
        .setDescription(`${userAffected.tag} was previously banned from this discord server.${auditLogEntry.executor && auditLogEntry.target.id === userAffected.id ? ` They were unbanned by ${auditLogEntry.executor.tag}.` : ''}`);

    if (auditLogEntry && auditLogEntry.executor && auditLogEntry.target.id === userAffected.id) {
        embed.setThumbnail(auditLogEntry.executor.displayAvatarURL({ dynamic: true }))
    }

    logChannel.send(embed.addField('Timestamps', [
        `User ID: ${userAffected.id}`,
        `Unbanned: ${new Date(Date.now())}`,
    ]));

    util.sendMessage(guild.channels.cache.get('768570345996550145'), embed); // EE
});

function manageStats(message) {
    const logChannel = message.guild.channels.cache.get(config.log_channel_id);
    var allStats = {};
    const fileLocation = `${config.resources_folder_file_path}stats.json`;

    // Checks if the stats.json file exists. Syncs all the points if it does exist.
    if (fs.existsSync(fileLocation)) {
        allStats = jsonFile.readFileSync(fileLocation);
    }

    // Checks if this guild is in the stats file. If not, creates a new one.
    if (!(message.guild.id in allStats)) {
        allStats[message.guild.id] = {};
    }

    const guildStats = allStats[message.guild.id];
    target = message.member;

    // Checks if the message author is in the guild stats. If not, creates a new object.
    if (!(message.author.id in guildStats)) {
        guildStats[message.author.id] = {
            points: 0,
            coins: 0,
            last_message: 0,
            vc_session_started: 0,
            time_spent_in_vc: 0,
            participating_messages: 0
        };
    }

    const userStats = guildStats[message.author.id];

    // Adds 3 points if their last message was more than 5 minutes ago.
    if (Date.now() - userStats.last_message >= 300000) {
        const pointsToAdd = 3;
        const coinsToAdd = 3 + (userStats['upgrade_message_earnings'] ? userStats['upgrade_message_earnings'] : 0);
        let previousPoints = userStats.points ? userStats.points : 0;
        userStats.points = Math.round((previousPoints + pointsToAdd) * 100) / 100;
        let previousCoins = userStats.coins ? userStats.coins : 0;
        userStats.coins = Math.round((previousCoins + coinsToAdd) * 100) / 100;
        userStats.last_message = Date.now();
        if (!userStats.participating_messages) {
            userStats.participating_messages = 0;
        }
        util.sendMessage(logChannel, new Discord.MessageEmbed()
            .setColor(Colors.YELLOW)
            .setTitle("Earned Points")
            .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`Awarded ${target.displayName} ${pointsToAdd} points and ${coinsToAdd} coins${userStats.upgrade_message_earnings ? ` (+${userStats.upgrade_message_earnings} bonus!)` : ''} for sending a message in the discord.`)
            .addField('Additional Info', [
                `Points: ${util.addCommas(previousPoints)} » ${util.addCommas(userStats.points)}`,
                `Coins: ${util.addCommas(previousCoins)} » ${util.addCommas(userStats.coins)}`,
                `Messages: ${util.addCommas(userStats.participating_messages)} » ${util.addCommas(userStats.participating_messages + 1)}`
            ])
            .setTimestamp());
        userStats.participating_messages++;
    }

    jsonFile.writeFileSync(fileLocation, allStats);
}

function manageGuildStats(message, member) {
    const logChannel = message.guild.channels.cache.get(config.log_channel_id);
    var allStats = {};
    const fileLocation = `${config.resources_folder_file_path}stats.json`;

    // Checks if the stats.json file exists. Syncs all the points if it does exist.
    if (fs.existsSync(fileLocation)) {
        allStats = jsonFile.readFileSync(fileLocation);
    }

    // Checks if this guild is in the stats file. If not, creates a new one.
    if (!(message.guild.id in allStats)) {
        allStats[message.guild.id] = {};
    }

    const guildStats = allStats[message.guild.id];
    target = member;

    // Checks if the message author is in the guild stats. If not, creates a new object.
    if (!(member.id in guildStats)) {
        guildStats[member.id] = {
            points: 0,
            coins: 0,
            last_message: 0,
            vc_session_started: 0,
            time_spent_in_vc: 0,
            participating_messages: 0
        };
    }

    const userStats = guildStats[member.id];

    // Adds 3 points if their last message was more than 5 minutes ago.
    if (Date.now() - userStats.last_message >= 300000) {
        const pointsToAdd = 3;
        const coinsToAdd = 3 + (userStats['upgrade_message_earnings'] ? userStats['upgrade_message_earnings'] : 0);
        let previousPoints = userStats.points ? userStats.points : 0;
        userStats.points = Math.round((previousPoints + pointsToAdd) * 100) / 100;
        let previousCoins = userStats.coins ? userStats.coins : 0;
        userStats.coins = Math.round((previousCoins + coinsToAdd) * 100) / 100;
        userStats.last_message = Date.now();
        if (!userStats.participating_messages) {
            userStats.participating_messages = 0;
        }
        util.sendMessage(logChannel, new Discord.MessageEmbed()
            .setColor(Colors.YELLOW)
            .setTitle("Earned Points")
            .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`Awarded ${target.displayName} ${pointsToAdd} points and ${coinsToAdd} coins${userStats.upgrade_message_earnings ? ` (+${userStats.upgrade_message_earnings} bonus!)` : ''} for sending a message in guild chat.`)
            .addField('Additional Info', [
                `Points: ${util.addCommas(previousPoints)} » ${util.addCommas(userStats.points)}`,
                `Coins: ${util.addCommas(previousCoins)} » ${util.addCommas(userStats.coins)}`,
                `Messages: ${util.addCommas(userStats.participating_messages)} » ${util.addCommas(userStats.participating_messages + 1)}`
            ])
            .setTimestamp());
        userStats.participating_messages++;
    }

    jsonFile.writeFileSync(fileLocation, allStats);
}

/**
 * Updates the names of the dedicated Voice Channels to the member and user count of the guild.
 * @param {Discord.Guild} guild the guild to be updated
 */
function updateServerStats(guild) {
    if (!config.display_server_stats) {
        return;
    }

    if (config.user_count_channel_id) {
        let userCountChannel = guild.channels.cache.get(config.user_count_channel_id);
        if (!userCountChannel || userCountChannel.type != "voice") {
            console.log(`Error! Cannot updateServerStats because user_count_channel_id ${config.user_count_channel_id} is invalid or it is not a Voice Channel.`);
        }
        if (!userCountChannel || !userCountChannel.permissionsFor(guild.me).has("MANAGE_CHANNELS") || !userCountChannel.permissionsFor(guild.me).has("CONNECT") || !userCountChannel.permissionsFor(guild.me).has("VIEW_CHANNEL")) {
            console.log("Error! I am missing one of the following: MANAGE_CHANNELS, CONNECT, VIEW_CHANNEL permission to edit the server stats (user_count).");
        } else {
            userCountChannel.setName(`Users: ${guild.memberCount}`);
        }
    }

    if (config.member_count_channel_id) {
        let memberCountChannel = guild.channels.cache.get(config.member_count_channel_id);
        if (!memberCountChannel || memberCountChannel.type != "voice") {
            console.log(`Error! Cannot updateServerStats because member_count_channel_id ${config.member_count_channel_id} is invalid or it is not a Voice Channel.`);
        }
        if (!memberCountChannel || !memberCountChannel.permissionsFor(guild.me).has("MANAGE_CHANNELS") || !memberCountChannel.permissionsFor(guild.me).has("CONNECT") || !memberCountChannel.permissionsFor(guild.me).has("VIEW_CHANNEL")) {
            console.log("Error! I am missing one of the following: MANAGE_CHANNELS, CONNECT, VIEW_CHANNEL permission to edit the server stats (member_count).");
        } else {
            memberCountChannel.setName(`Members: ${guild.members.cache.filter(member => !member.user.bot).size}`);
        }
    }
}

function usageToString(commandName, usage) {
    if (typeof usage === 'string') {
        return `\`${config.prefix}${commandName} ${usage}\``;
    } else {
        return [...usage].map((item) => item.length > 0 ? `\`${config.prefix}${commandName} ${item}\`` : `\`${config.prefix}${commandName}\``).join('\n');
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

bot.login(config.token);