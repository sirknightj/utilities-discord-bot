const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: 'avatar',
    description: 'Gets the avatar of the user',
    usage: `<user>`,
    requiresTarget: true,

    execute(bot, message, args, target) {
        var avatarURL = target.user.avatarURL({ dynamic: true });
        if (!avatarURL) {
            avatarURL = `Default`;
        }
        util.sendMessage(message.channel, `${target.user.username}'s avatar: ${target.user.avatarURL({ dynamic: true })}\nUser ID: ${target.user.id}`);
    }
}