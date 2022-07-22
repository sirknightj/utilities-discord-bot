const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ['guild'],
    description: 'Manage the guild setup.',
    usage: ['set <GuildName>', 'update', 'inguild <user>', 'updateroles <user>', 'updateeveryone'],
    requiresArgs: true,

    execute(bot, message, args) {
        switch(args[0].toLowerCase()) {
            case 'set':
                if (!this.checkAdminPermissions(message.member)) {
                    throw 'You do not have permission to use this command.';
                }
                if (!args[1]) {
                    throw 'Missing arguments.';
                }
                this.setGuild(bot, message, args[1]);
                break;
            case 'update':
                if (!this.checkAdminPermissions(message.member)) {
                    throw 'You do not have permission to use this command.';
                }
                let guild_uuid = util.getStats(message, message.guild.me, 'guild_uuid');
                if (!guild_uuid) throw 'Use `set` first!';
                this.saveGuild(bot, message, guild_uuid);
                break;
            case 'inguild':
                if (!args[1]) {
                    throw 'Missing arguments.';
                }
                let userInQuestion = util.getUserFromMention(message, args[1]);
                if (!userInQuestion) throw `Unknown user: \`${args[1]}\``
                let guildName = util.getStats(message, message.guild.me, 'guild_name');
                util.sendMessage(message.channel, `\`${userInQuestion.displayName}\` is${this.inGuild(bot, message, userInQuestion) ? '' : ' not'} a member of \`${guildName}\`.`);         
                break;
            case 'updateroles':
                if (!args[1]) {
                    throw 'Missing arguments.';
                }
                let userToUpdate = util.getUserFromMention(message, args[1]);
                if (!userToUpdate) throw `Unknown user: \`${args[1]}\``
                this.updateRoles(bot, message, userToUpdate);
                break;
            case 'updateeveryone':
                if (!this.checkAdminPermissions(message.member)) {
                    throw 'You do not have permission to use this command.';
                }
                if (this.inUse) {
                    util.sendMessage(message.channel, 'Already in use.');
                }
                this.inUse = true;
                this.updateEveryone(bot, message, args);
                break;
            default:
                throw `Unknown command: \`${args[0]}\``;
        }
    },

    /**
     * Check if the member is an administrator
     * 
     * @param {Discord.GuildMember} member the member to check
     * @returns true iff the member has administrator permissions
     */
    checkAdminPermissions(member) {
        return member.hasPermission('ADMINISTRATOR');
    },

    /**
     * Check if the member has KICK_MEMBERS
     * 
     * @param {Discord.GuildMember} member the member to check
     * @returns true iff the member has KICK_MEMBERS permission
     */
    checkAdminPermissions(member) {
        return member.hasPermission('KICK_MEMBERS', true);
    },

    async updateEveryone(bot, message, args) {
        util.sendMessage(message.channel, "Working on it... this may take a while.");
        let first = true;

        for (const member of message.guild.members.cache) { // member = [userID, Discord.GuildMember]
            let uuid = util.getStats(message, member[1], 'mc_uuid');
            if (uuid) {
                await this.updateRoles(bot, message, member[1], false, first);
                first = false;
            }
        }
        this.inUse = false;

        util.sendMessage(message.channel, 'Done going through everyone.');
    },

    /**
     * Updates membership roles
     * 
     * @param {Discord.Client} bot 
     * @param {Discord.Message} message 
     * @param {Discord.GuildMember} user 
     * @param {boolean} sendMessage true iff this should send a message when done updating. false otherwise.
     * @returns true when done
     */
    async updateRoles(bot, message, user, sendMessage = true, refreshGuildMembers = true) {

        let rolesToAssign = [];
        let rolesNotAwarded = [];

        if (refreshGuildMembers) {
            try {
                let guild_uuid = util.getStats(message, message.guild.me, 'guild_uuid');
                if (!guild_uuid) throw 'Use `set` first!';
                await this.saveGuild(bot, message, guild_uuid);
            } catch (e) {
                console.log(`Error in guild.updateRoles! ${e}`);
            }
        }
        
        if (this.inGuild(bot, message, user)) {
            rolesToAssign.push(config.guild_member_role) // guild member role
            rolesToAssign.push(config.bridge_role); // bridge role
            rolesNotAwarded.push(config.guest_role); // guest role
            rolesNotAwarded.push(config.retired_guild_member_role); // retired guild member
        } else {
            rolesToAssign.push(config.guest_role); // guest role
            rolesNotAwarded.push(config.guild_member_role); // guild member role
        }

        let rolesAlreadyHave = [];
        let rolesAdded = [];
        let rolesRemoved = [];
        let rolesNotQualifiedFor = [];

        rolesToAssign.sort((o1, o2) => Discord.Role.comparePositions(o1, o2));
        rolesToAssign.forEach((roleId) => {
            if (user.roles.cache.has(`${roleId}`)) {
                rolesAlreadyHave.push(roleId);
            } else {
                rolesAdded.push(roleId);
            }
        })
        rolesNotAwarded.sort((o1, o2) => Discord.Role.comparePositions(o1, o2));
        rolesNotAwarded.forEach((roleId) => {
            if (user.roles.cache.has(`${roleId}`)) {
                rolesRemoved.push(roleId);
                if (roleId === config.guild_member_role) {
                    rolesAdded.push(config.retired_guild_member_role); // retired guild member
                }
            } else {
                rolesNotQualifiedFor.push(roleId);
            }
        })

        await this.rm(message, user, rolesAdded, rolesRemoved);

        const embed = new Discord.MessageEmbed().setDescription(`${user}'s role update!`)
            .setAuthor(user.displayName, user.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setColor(Colors.YELLOW);

        if (rolesAdded.length) {
            rolesAdded.sort((o1, o2) => Discord.Role.comparePositions(o1, o2));
            embed.addField('Added roles:', rolesAdded.map((roleId) => `<@&${roleId}>`));
        }
        if (rolesRemoved.length) {
            rolesRemoved.sort((o1, o2) => Discord.Role.comparePositions(o1, o2));
            embed.addField('Removed roles:', rolesRemoved.map((roleId) => `<@&${roleId}>`));
        }

        if (!rolesAdded.length && !rolesRemoved.length) {
            embed.setDescription(`No roles updated. User already has the correct roles.`);
            embed.addField('Already has:', rolesToAssign.map((roleId) => `<@&${roleId}>`).join(', '));
            embed.addField(`Doesn't have:`, rolesNotAwarded.map((roleId) => `<@&${roleId}>`));
        }
        if (sendMessage || rolesAdded.length || rolesRemoved.length) {
            await util.sendMessage(message.channel, embed);
        }
        return true;
    },

    /**
     * Checks whether this user is in the guild.
     * 
     * @param {Discord.Client} bot 
     * @param {Discord.Message} message 
     * @param {Discord.GuildMember} user the user to check. Must be verified already.
     */
    inGuild(bot, message, user) {
        let gmembers = util.getStats(message, message.guild.me, 'guild_members');
        if (!gmembers) throw 'Use `update` first!';
        let userInQuestionUUID = util.getStats(message, user, 'mc_uuid');
        if (!userInQuestionUUID) throw `\`${userInQuestion.displayName}\` is not verified yet!`;
        return gmembers.some((membObject) => membObject.uuid === userInQuestionUUID);
    },

    /**
     * Gets and saves this guild's ID.
     * 
     * @param {Discord.Client} bot 
     * @param {Discord.Message} message 
     * @param {string} name the guild's name
     */
    async setGuild(bot, message, name) {
        try {
            console.log(`fetching ${`https://api.hypixel.net/guild?key=${config.API_KEY}&name=${name}`}`);
            let response = await fetch(`https://api.hypixel.net/guild?key=${config.API_KEY}&name=${name}`);
            if (!response.ok) {
                throw 'Unsuccessful response';
            }
            let json = await response.json();
            if (!json.guild.members) {
                throw 'Invalid guild name!';
            }
            util.writeStats(message.guild, message.guild.me, json.guild._id, 'guild_uuid');
            util.writeStats(message.guild, message.guild.me, json.guild.name, 'guild_name');
            util.sendMessage(message.channel, `Guild successfully updated to \`${json.guild.name}\`!`)
        } catch (e) {
            console.log(e);
        }
    },

    /**
     * Saves this guild's members into this bot's stats.
     * 
     * @param {Discord.Client} bot 
     * @param {Discord.Message} message 
     * @param {string} id the guild's id
     */
    async saveGuild(bot, message, id) {
        try {
            console.log(`fetching ${`https://api.hypixel.net/guild?key=${config.API_KEY}&id=${id}`}`);
            let response = await fetch(`https://api.hypixel.net/guild?key=${config.API_KEY}&id=${id}`);
            if (!response.ok) {
                throw 'Unsuccessful response';
            }
            let json = await response.json();
            if (!json.guild.members) {
                throw 'Invalid guild name!';
            }
            util.writeStats(message.guild, message.guild.me, json.guild.ranks, 'guild_ranks');
            util.writeStats(message.guild, message.guild.me, json.guild.members, 'guild_members');
            util.sendTimedMessage(message.channel, `Guild members of \`${json.guild.name}\` have been updated!`, config.delete_delay);
        } catch (e) {
            console.log(e);
        }
    },

    async rm(message, target, rolesAdded, rolesRemoved) {
        try {
            if (rolesAdded.length > 0) {
                await target.roles.add(rolesAdded, 'Add Guild Roles');
            }
            if (rolesRemoved.length > 0) {
                await target.roles.remove(rolesRemoved, 'Remove Guild Role');
            }
        } catch (e) {
            util.sendMessage(message.channel, new Discord.MessageEmbed().setTitle('Error with guild updateRoles!').setDescription(e));
        }
        return 1;
    }
}