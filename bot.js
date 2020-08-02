const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
const { execute } = require('./commands/warn');
const util = require('./utilities');
bot.commands = new Discord.Collection();

const commandList = [];
const allAliases = [];

// Read all of the command files from the './commands' folder.
for (command of require('fs').readdirSync('./commands').filter(file => file.endsWith('.js'))) {
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

// Makes sure that the config.channel_ids_not_to_accept_commands_from is a string.
if (typeof config.channel_ids_to_not_accept_commands_from === 'string') {
    config.channel_ids_to_not_accept_commands_from = [config.channel_ids_to_not_accept_commands_from];
}

bot.once('ready', () => {
    // bot.user.setStatus('invisible');
    console.log('online!');
})

bot.on('message', message => {
    // Make sure that the message is not from another bot, and only from a text channel.
    if (message.author.bot || message.channel.type !== 'text') {
        return;
    }

    // Checks if the message starts with a prefix.
    if (message.content.startsWith(config.prefix)) {
        // Makes sure that the bot is allowed to accept commands from this channel.
        if (config.channel_ids_to_not_accept_commands_from.includes(message.channel.id)) {
            return;
        }

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
            message.channel.send(helpMessage);
            return;
        }

        var requiredPerms = bot.commands.get(command).requiredPermissions;

        // If the command exists...
        if (allAliases.includes(command)) {
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
                        message.delete().catch(error => message.reply(`Error: ${error}`));
                        util.sendMessage(message.channel, "You do not have permission to use this command.");
                        return;
                    }
                }
            }

            // Checks if the command requires arguments to be inputted. If the user did not put any, say the correct usage.
            if (botCommand.requiresArgs) {
                if (args.length == 0) {
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
                    util.sendTimedMessage(message.channel, `Invalid usage. ${config.prefix}${command} ${botCommand.usage}`);
                    return;
                }

                // Attempts to execute the message, while catching any missing bot permission errors.
                try {
                    botCommand.execute(bot, message, args, user);
                } catch (error) {
                    util.sendTimedMessage(message.channel, `Invalid usage. ${config.prefix}${command} ${botCommand.usage}`);
                }
                return;
            }
            // Executes the command, if a mention isn't required, while catching any missing bot permission errors.
            try {
                botCommand.execute(bot, message, args);
            } catch (error) {
                util.sendTimedMessage(message.channel, `Invalid usage. ${config.prefix}${command} ${botCommand.usage}`);
            }
        // If the command doesn't exist...
        } else {
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
                    message.channel.send(message_to_send).catch(error => message.reply(`Error: ${error}`));
                    message.react(reaction).catch(error => message.reply(`Error: ${error}`));
                }
            }
        }
    }
})

bot.login(config.token);