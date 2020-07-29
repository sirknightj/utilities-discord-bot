const discord = require("discord.js");

module.exports = {
    name: 'ghostping',
    description: 'Pings the specified user then deletes the message. Also deletes your command.',
    usage: `ghostping <@user> <#channel>`,
    hiddenFromHelp: true,
    execute(bot, message, args, userFromMention) {
        message.delete();
        if(args.length !== 2) {
            message.channel.send(`Invalid usage: ${this.usage}`);
            return;
        }
        var lookingFor = args[1];
        var sendingChannel = bot.channels.cache.find(channel => channel.name.toLowerCase() === lookingFor.toLowerCase());

        if(sendingChannel === null || sendingChannel === undefined) {
            sendingChannel = getChannelFromMention(bot, lookingFor);
        }

        if(sendingChannel === null || sendingChannel === undefined) {
            message.channel.send(`Invalid channel: ${lookingFor}`);
            return;
        }

        let target = message.guild.members.cache.get(args[0]);
        if(!target && message.mentions.members) {
            target = message.mentions.members.first();
        }
        if(!target && args[0]) {
            target = message.guild.members.cache.find(member => {
                return member.displayName.toLowerCase().includes(args[0]) || member.user.tag.toLowerCase().includes(args[0]);
            });
        }
        if(!target) {
            message.channel.send(`Error: Cannot find ${args[0]}`);
        }
        
        sendingChannel.send(`<@${target.user.id}>`).then(msg => msg.delete()).catch(error => message.channel.send(`Error: ${error.message}`));
    }
}

/**
 * Returns the channel that was mentioned. Returns null if the channel is not found, or formatted incorrectly.
 * @param {Discord.Client()} bot
 * @param {string} mention 
 */
function getChannelFromMention(bot, mention) {
    if (!mention) {
        return null;
    }
    // Checks if mention is formatted correctly.
    if (mention.startsWith('<#') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        return bot.channels.cache.get(mention);
    }
    return null;
}