const config = require('../config.json');
const util = require('../utilities');

const activityPrefix = ['playing', 'streaming', 'listening', 'watching'];

module.exports = {
    name: ['activity', 'setActivity', 'updateActivity'],
    description: "Sets the bot's activity.",
    usage: "(optional: playing/streaming/listening/watching) (optional: activity-name/twitch.tv/link)",

    execute(bot, message, args) {
        util.safeDelete(message);
        if (!args || args.length === 0 || args[0].toLowerCase() === 'clear') {
            bot.user.setActivity().catch(err => util.sendTimedMessage(message.channel, `Error: ${err}`));
            util.sendTimedMessage(message.channel, "Activity cleared. Please give it a minute or two to update.");
        } else {
            var activityType, toActivityType;
            if (activityPrefix.includes(args[0].toLowerCase())) {
                // This means that an ActivityType was passed in.
                activityType = args.shift();
                toActivityType = activityType.toUpperCase();
            }

            if (args.length > 0) {
                bot.user.setActivity(args.join(" "), { type: toActivityType }).catch(err => util.sendTimedMessage(message.channel, `Error: ${err}`));
                util.sendTimedMessage(message.channel, `Bot's activity has been set to ${activityType || ""} ${args.join(" ")}.`.replace(/ +(?= )/g, ''));
            } else {
                bot.user.setActivity('nothing', { type: activityType }).catch(err => util.sendTimedMessage(message.channel, `Error: ${err}`));
                util.sendTimedMessage(message.channel, `Bot's activity has been set to ${activityType} nothing.`.replace(/ +(?= )/g, ''));
            }
        }
    }
}