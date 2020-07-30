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
    commandList.push(botCommand.name);
    bot.commands.set(botCommand.name, botCommand);
}

bot.once('ready', () => {
    bot.user.setStatus('invisible');
    console.log('online!');
})

bot.on('message', message => {
    if (message.author.bot || message.channel.type !== 'text' || !message.content.startsWith(config.prefix)) {
        return;
    }

    const args = message.content.trim().slice(config.prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'help') {
        var helpMessage = `**Here are all of my commands:**\n`;
        for (commandName of commandList) {
            var commands = bot.commands.get(commandName);
            if (!commands.hiddenFromHelp) {
                helpMessage += `\`${config.prefix}${commands.usage}\`\t${commands.description}\n`;
            }
        }
        message.channel.send(helpMessage);
        return;
    }

    if (commandList.includes(command)) {
        if (bot.commands.get(command).requiresArgs) {
            if (args.length == 0) {
                message.channel.send(`Invalid usage. ${config.prefix}${bot.commands.get(command).usage}`);
                return;
            }
        }

        // Checks if the command requires a user to be mentioned.
        if (bot.commands.get(command).requiresTarget) {
            const user = util.getUserFromMention(message, args.shift());
            if (!user) {
                message.channel.send(`Invalid usage. ${config.prefix}${bot.commands.get(command).usage}`);
                return;
            }
            bot.commands.get(command).execute(bot, message, args, user);
            return
        }
        // Executes the command, if a mention isn't required.
        bot.commands.get(command).execute(bot, message, args);
    } else {
        message.channel.send('i dont have that command programmed in yet');
    }
})

bot.login(config.token);