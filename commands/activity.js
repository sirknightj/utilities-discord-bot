const config = require('../config.json');
const util = require('../utilities');

const activityPrefix = ['playing', 'streaming', 'listening', 'watching'];

module.exports = {
    name: ['activity', 'setActivity', 'updateActivity'],
    description: "Sets the bot's activity.",
    usage: "(optional: playing/streaming/listening/watching) (optional: activity-name/twitch.tv/link)",

    execute(bot, message, args) {
        message.delete();
        if (!args || args.length === 0 || args[0].toLowerCase() === 'clear') {
            bot.user.setActivity().catch(err => util.sendTimedMessage(channel.name, `Error: ${err}`));
            util.sendTimedMessage(message.channel, "Activity cleared. Please give it a minute or two to update.");
        } else {
            var activityType;
            if (activityPrefix.includes(args[0].toLowerCase())) {
                // This means that an ActivityType was passed in.
                activityType = args.shift().toUpperCase();
            }

            if (args.length > 0) {
                bot.user.setActivity(args.join(" "), { type: activityType}).catch(err => util.sendTimedMessage(channel.name, `Error: ${err}`));
                util.sendTimedMessage(message.channel, `Bot's activity has been set to ${activityType || ""} ${args.join(" ")}.`.trim());
            } else {
                bot.user.setActivity('nothing', { type: activityType }).catch(err => util.sendTimedMessage(channel.name, `Error: ${err}`));
                util.sendTimedMessage(message.channel, `Bot's activity has been set to ${activityType || ""} nothing.`.trim());
            }
        }
    }
}