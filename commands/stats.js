const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');

module.exports = {
    name: ['stats', 'points', 'mypoints', 'mystats'],
    description: 'Tells you how many points you have.',
    usage: `(optional: user)`,

    execute(bot, message, args) {
        var target;
        if (args.length != 0) {
            target = util.getUserFromMention(message, args.join(' '));
        } else {
            target = message.member;
        }
        
        util.safeDelete(message);
        if (!target) {
            util.sendTimedMessage(message.channel, `Error: Cannot find user ${args.join(' ')}`);
            return;
        }

        try {
            var allStats = {};
            const fileLocation = `${config.resources_folder_file_path}stats.json`;
        
            if (fs.existsSync(fileLocation)) {
                allStats = jsonFile.readFileSync(fileLocation);
            } else {
                util.sendTimedMessage(message.channel, "stats.json has not been properly configured.");
                return;
            }

            const userStats = (allStats[message.guild.id])[target.user.id];

            if (!userStats) {
                util.sendTimedMessage(message.channel, `${target.displayName} has 0 points.`);
                return;
            }

            util.sendTimedMessage(message.channel, `${target.displayName}'s points: ${userStats.points}`);
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}