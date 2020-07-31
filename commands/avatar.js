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
        message.channel.send(`${target.user.username}'s avatar: ${target.user.avatarURL({ dynamic: true })}\nUser ID: ${target.user.id}`)
            .then(msg => msg.delete({ timeout: config.delete_delay })
                .catch(error => message.reply(`Error: ${error}`)));
    }
}