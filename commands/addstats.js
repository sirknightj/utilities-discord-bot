const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');

module.exports = {
    name: ['addstats', 'addpoints'],
    description: "Adds to a user's points. Only available to users with the ADMINISTRATOR permission.",
    usage: `<user> <points-to-add>`,
    requiredPermissions: 'ADMINISTRATOR',
    hiddenFromHelp: true,

    execute(bot, message, args) {
        let newPointNumber = parseInt(args.pop());
        if (newPointNumber < 0) {
            throw new InvalidUsageException('Points cannot be negative.');
        }

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

            const guildStats = allStats[message.guild.id];
            let oldStats = 0;

            if (!(target.user.id in guildStats)) {
                guildStats[target.user.id] = {
                    points: 0,
                    last_message: 0,
                    vc_session_started: 0
                };
            } else {
                oldStats = guildStats[target.user.id].points;
                guildStats[target.user.id].points += newPointNumber;
            }

            jsonFile.writeFileSync(fileLocation, allStats);
            util.sendTimedMessage(message.channel, `Updated ${target.displayName}'s points from ${oldStats} to ${guildStats[target.user.id].points}.`);
        } catch (err) {
            util.sendTimedMessage(message.channel, "Error fetching stats.json.")
            console.log(err);
        }
    }
}