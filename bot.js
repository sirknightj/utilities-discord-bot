const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
const util = require('./utilities');
const jsonFile = require('jsonfile');
const fs = require('fs');
bot.commands = new Discord.Collection();

const commandList = [];
const allAliases = [];
const pointMap = new Map();

// Read all of the command files from the './commands' folder.
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

for (var i = 0; i < config.point_earnings.length; i++) {
    pointMap.set(config.point_earnings[i][0], config.point_earnings[i][1]);
}

// Makes sure that the config.channel_ids_not_to_accept_commands_from is a string.
if (typeof config.channel_ids_to_not_accept_commands_from === 'string') {
    config.channel_ids_to_not_accept_commands_from = [config.channel_ids_to_not_accept_commands_from];
}

bot.once('ready', () => {
    // bot.user.setStatus('invisible');
    console.log('online!');
});

bot.on('message', message => {
    // Make sure that the message is not from another bot, and only from a text channel.
    if (message.author.bot || message.channel.type !== 'text') {
        return;
    }

    manageStats(message);

    // Checks if the message starts with a prefix.
    if (message.content.startsWith(config.prefix)) {
        // Makes sure that the bot is allowed to accept commands from this channel.
        if (config.channel_ids_to_not_accept_commands_from.includes(message.channel.id)) {
            return;
        }

        console.log(`${message.author.username} ${message.content}`); // for debugging purposes.

        const args = message.content.trim().slice(config.prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'help') {
            var helpMessage = `**Here are all of my commands:**\n`;
            for (commandName of commandList) {
                var commands = bot.commands.get(commandName);
                if (!commands.hiddenFromHelp) {
                    helpMessage += `\`${config.prefix}${commandName} ${commands.usage}\`\t${commands.description}\n`;
                }
            }
            util.sendMessage(message.channel, helpMessage);
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

            // If a command has the requiredPermissions property, then check that the sender has the all of the requiredPermissions.
            if (requiredPerms && requiredPerms.length) {
                // Loop through all required permissions. If the user is missing any of them, then don't perform the command.
                for (var permission of requiredPerms) {
                    if (!message.member.hasPermission(permission)) {
                        util.safeDelete(message);
                        util.sendMessage(message.channel, "You do not have permission to use this command.");
                        return;
                    }
                }
            }

            if (args[0]) {
                if (args[0].toLowerCase() === 'help' || args[0].toLowerCase() === 'usage') {
                    util.safeDelete(message);
                    util.sendTimedMessage(message.channel, `Usage: \`${config.prefix}${command} ${botCommand.usage}\``);
                    return;
                }
            }

            // Checks if the command requires arguments to be inputted. If the user did not put any, say the correct usage.
            if (botCommand.requiresArgs) {
                if (args.length == 0) {
                    util.safeDelete(message);
                    util.sendTimedMessage(message.channel, `Invalid usage. ${config.prefix}${command} ${botCommand.usage}`);
                    return;
                }
            }

            // Checks if the command requires a user to be mentioned.
            if (botCommand.requiresTarget) {

                // Attempts to find the user from the first argument args[0].
                const user = util.getUserFromMention(message, args.shift());

                // Throws an error if there is no user found.
                if (!user) {
                    util.safeDelete(message);
                    util.sendTimedMessage(message.channel, `Invalid usage. ${config.prefix}${command} ${botCommand.usage}`);
                    return;
                }

                // Attempts to execute the message, while catching any missing bot permission errors.
                try {
                    botCommand.execute(bot, message, args, user);
                } catch (error) {
                    util.safeDelete(message);
                    util.sendTimedMessage(message.channel, `Invalid usage. ${config.prefix}${command} ${botCommand.usage}`);
                }
                return;
            }
            // Executes the command, if a mention isn't required, while catching any missing bot permission errors.
            try {
                botCommand.execute(bot, message, args);
            } catch (error) {
                util.safeDelete(message);
                util.sendTimedMessage(message.channel, `Invalid usage. ${config.prefix}${command} ${botCommand.usage}`);
            }
            return;
            // If the command doesn't exist...
        } else {
            util.safeDelete(message);
            util.sendMessage(message.channel, `${config.unknown_command_message}`);
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
                            if (Math.floor(Math.random() * 10) === 1) {
                                // Be mean. 1/10 of being mean.
                                message_to_send = config.annoying_messages_to_send[Math.floor((Math.random() * config.annoying_messages_to_send.length))];
                                reaction = config.annoying_reactions[Math.floor((Math.random() * config.annoying_reactions.length))];
                            } else {
                                // Be nice. 9/10 of being nice.
                                message_to_send = config.praising_messages_to_send[Math.floor((Math.random() * config.praising_messages_to_send.length))];
                                reaction = config.praising_reactions[Math.floor((Math.random() * config.praising_reactions.length))];
                            }
                        }
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

            if (config.points_earning_channel_id.includes("" + message.channel.id)) {
                let wordsToParse = message.content.split(' ');
                var pointsToEarn = 0;
                wordsToParse.forEach((word) => {
                    word = word.toLowerCase();
                    if (pointMap.has(word)) {
                        pointsToEarn = pointMap.get(word);
                    }
                });
                if (pointsToEarn > 0) {
                    util.sendMessage(message.channel, `${message.member.displayName} has been awarded ${pointsToEarn} points.`);
                    if (!message.attachments.first()) {

                    }
                    util.addPoints(message, message.member, pointsToEarn);
                } else {
                    if (!message.attachments.first()) {
                        util.safeDelete(message);
                        util.sendTimedMessage(message.channel, `Do not send unrelated messages in this channel. If you're reporting an incorrect entry, discuss it in the appropriate channel.\nError: Your message is not exactly one of the specified accepted values.`);
                    }
                }
            }
        }
    }
});

bot.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.member.user.bot) {
        return;
    }
    if ((oldState.channel === newState.channel) || (oldState.channel === newState.guild.channels.cache.get(config.afk_channel_id) && !newState.channel) || (!oldState.channel && newState.channel === newState.guild.channels.cache.get(config.afk_channel_id))) {
        return;
    }
    let target = oldState.member;

    var allStats = {};
    const fileLocation = `${config.resources_folder_file_path}stats.json`;

    if (fs.existsSync(fileLocation)) {
        allStats = jsonFile.readFileSync(fileLocation);
    }

    if (!(newState.guild.id in allStats)) {
        allStats[message.guild.id] = {};
    }

    const guildStats = allStats[newState.guild.id];

    if (!(target.user.id in guildStats)) {
        guildStats[target.user.id] = {
            points: 0,
            last_message: 0,
            vc_session_started: 0
        };
    }

    const userStats = guildStats[target.user.id];
    const logChannel = newState.guild.channels.cache.get(config.log_channel_id);

    if ((oldState.channel && !newState.channel) || newState.channel.id === config.afk_channel_id) {
        util.sendMessage(logChannel, `${target.displayName} has left VC! ${new Date(Date.now())}.`);
        if (userStats.vc_session_started > 0) {
            let pointsToAdd = Math.floor((Date.now() - userStats.vc_session_started) / 300000);
            userStats.points += pointsToAdd;
            util.sendMessage(logChannel, `${target.displayName} has been awarded ${pointsToAdd} points for participating in VC for a total of ${userStats.points}! ${new Date(Date.now())}`);
            userStats.vc_session_started = 0;
        }
    } else if (newState.channel && (!oldState.channel || oldState.channel.id === config.afk_channel_id)) {
        util.sendMessage(logChannel, `${target.displayName} has joined VC! ${new Date(Date.now())}.`);
        userStats.vc_session_started = Date.now();
    }
    jsonFile.writeFileSync(fileLocation, allStats);
});

function manageStats(message) {
    var allStats = {};
    const fileLocation = `${config.resources_folder_file_path}stats.json`;

    if (fs.existsSync(fileLocation)) {
        allStats = jsonFile.readFileSync(fileLocation);
    }

    if (!(message.guild.id in allStats)) {
        allStats[message.guild.id] = {};
    }

    const guildStats = allStats[message.guild.id];

    if (!(message.author.id in guildStats)) {
        guildStats[message.author.id] = {
            points: 0,
            last_message: 0,
            vc_session_started: 0
        };
    }

    const userStats = guildStats[message.author.id];
    if (Date.now() - userStats.last_message >= 900000) { // 15 minutes
        userStats.points += 1;
        userStats.last_message = Date.now();
        util.sendMessage(message.guild.channels.cache.get(config.log_channel_id), `${message.member.displayName} has been awarded 1 point for sending a message in discord. ${message.createdAt}.`);
    }

    jsonFile.writeFileSync(fileLocation, allStats);
}

bot.login(config.token);