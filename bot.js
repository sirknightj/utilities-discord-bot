const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
const { execute } = require('./commands/warn');
const util = require('./utilities');
bot.commands = new Discord.Collection();

const commandList = [];

// Read all of the command files from the ./commands folder.
for (command of require('fs').readdirSync('./commands').filter(file => file.endsWith('.js'))) {
    const botCommand = require(`./commands/${command}`);

    if (typeof botCommand.name === 'string') {
        botCommand.name = [botCommand.name];
    }

    commandList.push(botCommand.name[0]);
    for (commandAlias of botCommand.name) {
        bot.commands.set(commandAlias, botCommand);
    }
}

bot.once('ready', () => {
    // bot.user.setStatus('invisible');
    console.log('online!');
})

bot.on('message', message => {
    if (message.author.bot || message.channel.type !== 'text') {
        return;
    }

    // if the message starts with the prefix...
    if (message.content.startsWith(config.prefix)) {
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

        if (commandList.includes(command)) {
            // If the requiredPermissions property is a string, turn it into an array.
            if (typeof bot.commands.get(command).requiredPermissions === 'string') {
                bot.commands.get(command).requiredPermissions = [bot.commands.get(command).requiredPermissions];
            }

            // If a command has the requiredPermissions property, then check that the sender has the all of the requiredPermissions.
            if (bot.commands.get(command).requiredPermissions && bot.commands.get(command).requiredPermissions.length) {
                for (var permission of bot.commands.get(command).requiredPermissions) {
                    if (!message.member.hasPermission(permission)) {
                        message.delete().catch(error => message.reply(`Error: ${error}`));
                        message.channel.send(`You do not have permission to use this command.`)
                            .then(msg => msg.delete({ timeout: config.delete_delay })
                                .catch(error => message.reply(`Error: ${error}`)));
                        return;
                    }
                }
            }

            if (bot.commands.get(command).requiresArgs) {
                if (args.length == 0) {
                    message.channel.send(`Invalid usage. ${config.prefix}${command} ${bot.commands.get(command).usage}`)
                        .then(msg => msg.delete({ timeout: config.delete_delay })
                            .catch(error => message.reply(`Error: ${error}`)));
                    return;
                }
            }

            // Checks if the command requires a user to be mentioned.
            if (bot.commands.get(command).requiresTarget) {
                const user = util.getUserFromMention(message, args.shift());
                if (!user) {
                    message.channel.send(`Invalid usage. ${config.prefix}${command} ${bot.commands.get(command).usage}`)
                        .then(msg => msg.delete({ timeout: config.delete_delay })
                            .catch(error => message.reply(`Error: ${error}`)));
                    return;
                }
                try {
                    bot.commands.get(command).execute(bot, message, args, user);
                } catch (error) {
                    message.channel.send(`Invalid usage. ${config.prefix}${command} ${bot.commands.get(command).usage}`)
                        .then(msg => msg.delete({ timeout: config.delete_delay })
                            .catch(error => message.reply(`Error: ${error}`)));
                    return;
                }
                return
            }
            // Executes the command, if a mention isn't required.
            try {
                bot.commands.get(command).execute(bot, message, args);
            } catch (error) {
                message.channel.send(`Invalid usage. ${config.prefix}${command} ${bot.commands.get(command).usage}`)
                    .then(msg => msg.delete({ timeout: config.delete_delay })
                        .catch(error => message.reply(`Error: ${error}`)));
                return;
            }
        } else {
            message.channel.send(config.unknown_command_message);
            return;
        }

        // if the message doesn't start with the prefix...
    } else {
        // Then, annoy the user, if they send a message.
        if (config.channel_ids_to_bother) {
            if (typeof config.channel_ids_to_bother === 'string') {
                config.channel_ids_to_bother = [config.channel_ids_to_bother];
            }
            if (config.channel_ids_to_bother.includes("" + message.channel.id)) {
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
                        } else if (config.user_ids_to_always_annoy.includes("" + message.author.id)) {
                            message_to_send = config.annoying_messages_to_send[Math.floor((Math.random() * config.annoying_messages_to_send.length))];
                            reaction = config.annoying_reactions[Math.floor((Math.random() * config.annoying_reactions.length))];
                        } else {
                            message_to_send = (Math.floor(Math.random() * 2) === 1) ?
                                config.praising_messages_to_send[Math.floor((Math.random() * config.praising_messages_to_send.length))] :
                                config.annoying_messages_to_send[Math.floor((Math.random() * config.annoying_messages_to_send.length))];
                            reaction = (Math.floor(Math.random() * 2) === 1) ?
                                config.praising_reactions[Math.floor((Math.random() * config.praising_reactions.length))] :
                                config.annoying_reactions[Math.floor((Math.random() * config.annoying_reactions.length))];
                        }
                    }
                    message.channel.send(message_to_send).catch(error => message.reply(`Error: ${error}`));
                    message.react(reaction).catch(error => message.reply(`Error: ${error}`));
                }
            }
        }
    }
})

bot.login(config.token);