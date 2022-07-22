const util = require('../utilities');
const config = require('../config.json');
const claim = require('./claim');

module.exports = {
    name: ["forceclaim"],
    description: "Runs !claim as target.",
    usage: "<target/everyone>",
    requiresArgs: true,

    execute(bot, message, args) {
        if (args[0].toLowerCase() === 'everyone') {
            if (!message.member.permissions.has('ADMINISTRATOR')) {
                util.sendMessage(message.channel, "You don't have permission to use this command. Missing `ADMINISTRATOR`");
                return;
            }
            this.executor(bot, message, args)
            return;
        }

        let target = util.getUserFromMention(message, args[0]);
        if (!target) {
            throw 'Invalid user';
        }

        let targetUuid = util.getStats(message, target, 'mc_uuid');
        if (!targetUuid) {
            throw 'Target is not verified yet.';
        }

        claim.forceClaim(bot, message, target, targetUuid);
    },

    async executor(bot, message, args) {
        let i = 0;
        for (const member of message.guild.members.cache) {
            if (util.getStats(message, member[1], 'mc_uuid')) {
                i++;
            }
        }
        let msg = await util.sendMessage(message.channel, `Updating ${util.addCommas(i)} users. Estimated time to complete: \`${util.toFormattedTime(i * COOLDOWN)}\` (<t:${Math.round((Date.now() + i * COOLDOWN) / 1000)}:F>)`);
        for (const member of message.guild.members.cache) { // member = [userID, Discord.GuildMember]
            // if (!member[1].roles.cache.some(role => role.id === config.role_id_required_to_use_shop)) {
            //     continue;
            // }
            let uuid = util.getStats(message, member[1], 'mc_uuid');
            if (uuid) {
                util.sendTimedMessage(message.channel, `Updating ${member[1].displayName}...`, config.delete_delay);
                claim.forceClaim(bot, message, member[1], uuid, true, false);
                await delay(COOLDOWN);
            }
        }
        util.sendTimedMessage(message.channel, "Done. Everyone's skills are now up to date.", config.longer_delete_delay);
        util.safeDelete(message);
        util.safeDelete(msg);
    }
}

const COOLDOWN = 10000;

const delay = ms => new Promise(res => setTimeout(res, ms));