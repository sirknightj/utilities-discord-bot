module.exports = {
    name: 'avatar',
    description: 'gets the avatar of the user',
    usage: `avatar <@user>`,
    requiresTarget: false,
    execute(bot, message, args, userFromMention) {

        let target = message.guild.members.cache.get(args[0]);
        if (!target && message.mentions.members) {
            target = message.mentions.members.first();
        }
        if (!target && args[0]) {
            target = message.guild.members.cache.find(member => {
                return member.displayName.toLowerCase().includes(args[0]) || member.user.tag.toLowerCase().includes(args[0]);
            });
        }
        if (!target) {
            message.channel.send(`Error: Cannot find ${args[0]}`);
        }

        message.channel.send(`${target.username}'s avatar: ${target.avatarURL}${target.user.id}`);
    }
}