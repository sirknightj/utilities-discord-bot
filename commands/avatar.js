const util = require('../utilities');

module.exports = {
    name: 'avatar',
    description: 'gets the avatar of the user',
    usage: `avatar <@user>`,
    requiresTarget: true,

    execute(bot, message, args, target) {
        var avatarURL = target.user.avatarURL({ dynamic: true });
        if (!avatarURL) {
            avatarURL = `Default`;
        }
        message.channel.send(`${target.user.username}'s avatar: ${target.user.avatarURL({ dynamic: true })}\nUser ID: ${target.user.id}`);
    }
}