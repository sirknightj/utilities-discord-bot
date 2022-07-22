const util = require('../utilities');
const config = require('../config.json');

module.exports = {
    name: ["skills"],
    description: "Shows you someone's skills.",
    usage: "(optional: user)",

    execute(bot, message, args) {
        let target = message.member;
        if (args[0]) {
            target = util.getUserFromMention(message, args[0]);
            if (!target) {
                throw 'Invalid target';
            }
        }
        let stats = util.getStats(message, target, 'skyblock_skills');
        if (stats) {
            util.sendMessage(message.channel, JSON.stringify(stats));
        } else {
            util.sendMessage(message.channel, 'Not initialized yet');
        }
    }
}