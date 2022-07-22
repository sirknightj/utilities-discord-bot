const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');
const guild = require('./guild');
const NAME = require('./name');

module.exports = {
    name: ['gonline', 'online', 'go', 'guildonline'],
    description: "Displays everyone online.",
    usage: ['', 'forcerefresh'],

    execute(bot, message, args) {
        if (args[0] && args[0].toLowerCase() === 'forcerefresh') {
            if (!message.member.hasPermission('MANAGE_MESSAGES')) {
                util.sendMessage(message.channel, 'You do not have permission to use this command.');
                return;
            }
            if (this.inUse) {
                util.sendMessage(message.channel, 'This command is already in use. Please try again later.');
                return;
            }
            this.inUse = true;
            util.sendMessage(message.channel, 'starting the refresh process...');
            this.updateAccurately(bot, message, args);
            return;
        }

        let guildName = util.getStats(message, message.guild.me, 'guild_name');
        if (!guildName) {
            util.sendMessage(message.channel, `\`${config.prefix}guild set\` has not been used yet!`);
            return;
        }

        let res = [];
        let uuidMap = new Map();
        for (const member of message.guild.members.cache) { // member = [userID, Discord.GuildMember]
            let onlineStatus = util.getStats(message, member[1], 'online_status');
            let uuid = util.getStats(message, member[1], 'mc_uuid');
            if (onlineStatus && uuid) {
                res.push(util.fixNameFormat(member[1].displayName));
                if (uuid) {
                    uuidMap.set(uuid, member[1].displayName);
                }
            }
        }

        let rankMap = new Map();
        let ranks = util.getStats(message, message.guild.me, 'guild_ranks');
        let gMembers = util.getStats(message, message.guild.me, 'guild_members');
        if (!ranks || !gMembers) throw '`update` has not been used yet!';
        rankMap.set('Guild Master', []); // Guild Master rank is not included in api request for guild info
        for (let rank of ranks) {
            rankMap.set(rank.name, []);
        }

        for (let uuid of Array.from(uuidMap.keys())) {
            let gMemberObj = gMembers.find(gMemb => gMemb.uuid === uuid)
            if (!gMemberObj) {
                NAME.getName(bot, message, uuid).then((name) => {
                    util.sendMessage(message.channel, `Member with uuid \`${uuid}\` (\`${name}\`) is marked online but not in the guild. Removing online status...`);
                    let user = util.getUserFromMention(message, name);
                    if (!user) {
                        util.sendMessage(message.channel, `This error should never happen. Report immediately.`);
                        return;
                    }
                    util.setStats(message, user, 0, "online_status");
                })
            }
            let arr = rankMap.get(gMemberObj.rank);
            if (!arr) {
                util.sendMessage(message.channel, `Could not locate the guild rank \`${gMemberObj.rank}\`. The cached guild data is probably outdated. Try using \`${config.prefix} guild update\`.`);
                return;
            }
            arr.push(uuid);
        }

        let embed = new Discord.MessageEmbed()
            .setTitle(`${res.length} member${res.length === 1 ? '' : 's'} online in ${guildName}!`)
            .setColor(Colors.DARK_GREEN)
            .setTimestamp();

        rankMap.forEach((membersOnline, rank) => {
            if (membersOnline.length) {
                embed.addField(`${rank} (${membersOnline.length})`, util.fixNameFormat(membersOnline.map(_uuid => uuidMap.get(_uuid)).join(', ')));
            }
        })
        
        util.sendMessage(message.channel, embed);
    },

    async updateAccurately(bot, message, args) {
        for (const member of message.guild.members.cache) { // member = [userID, Discord.GuildMember]
            let uuid = util.getStats(message, member[1], 'mc_uuid');
            if (!uuid) continue;

            if (guild.inGuild(bot, message, member[1])) {
                try {
                    console.log(`fetching https://api.hypixel.net/status?key=${config.API_KEY}&uuid=${uuid}`)
                    let response = await fetch(`https://api.hypixel.net/status?key=${config.API_KEY}&uuid=${uuid}`);
                    if (!response.ok) {
                        throw response;
                    }
                    let data = await response.json();
                    if (data.session.online) {
                        util.setStats(message, member[1], 1, 'online_status');
                    } else {
                        util.setStats(message, member[1], 0, 'online_status');
                    }
                    await new Promise(res => setTimeout(res, 5000));
                } catch (response) {
                    console.log(response);
                    util.sendMessage(message.channel, new Discord.MessageEmbed()
                        .setColor(Colors.BRIGHT_RED)
                        .setTitle(`Error code ${response.status}: ${response.statusText}`)
                        .setDescription(`While requesting endpoint \`/status\` with uuid=${uuid}\n(${util.fixNameFormat(member[1].displayName)})`)
                        .setTimestamp());
                }
            }
        }
        this.inUse = false;
        util.sendMessage(message.channel, 'Done refreshing.');
    }
};