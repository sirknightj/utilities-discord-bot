const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');
const name = require('./name.js');
const guild = require('./guild.js');

// Roles to assign for hitting specific skill milestones
const SKILLS_DATABASE = config.skills;

// Roles to assign for hitting avg skill level milestones
const AVG_SKILL_LEVELS_DATABASE = config.avg_skills;

// Roles to assign for hitting slayer level milestones
const SLAYERS_DATABASE = config.slayers;

// Roles to assign for hitting total slayer xp milestones
const SLAYER_XP_DATABASE = config.slayer_xp_totals;

// Roles to assign for hitting total catacombs level milestones
const CATACOMBS_DATABASE = config.catacombs;

module.exports = {
    name: ['updateroles', 'roleupdate'],
    description: "Updates a player's roles.",
    usage: '(optional: user/everyone)',

    execute(bot, message, args) {
        let target;
        if (args.length === 0) {
            // User wants to update themselves.
            target = message.member;
        } else if (args[0] && args[0].toLowerCase() !== 'everyone') {
            target = util.getUserFromMention(message, args[0]);
            if (!target) {
                throw `Invalid target: \`${args[0]}\``;
            }
        }

        if (args[0] && args[0].toLowerCase() === 'everyone') {
            if (!message.member.permissions.has('ADMINISTRATOR')) {
                util.sendMessage(message.channel, "You don't have permission to use this command. Missing `ADMINISTRATOR`");
                return;
            }
            let wasAnyoneUpdated = false;
            for (const member of message.guild.members.cache) { // member = [userID, Discord.GuildMember]
                let skills = util.getStats(message, member[1], 'skyblock_skills');
                if (skills && skills.skills && skills.slayers && skills.catacombs && skills.totalSlayerXp) {
                    if (this.updateMemberRoles(bot, message, member[1], skills)) {
                        wasAnyoneUpdated = true;
                    }
                }
            }
            if (!wasAnyoneUpdated) {
                util.sendMessage(message.channel, "Everyone's roles were up to date. No changes were done.");
            } else {
                util.sendMessage(message.channel, "Done performing role updates.");
            }
        } else {
            if (!this.updateMemberRoles(bot, message, target)) {
                util.sendMessage(message.channel, 'Your roles are up to date. No changes were done.');
            }
        }
    },

    updateMemberRoles(bot, message, target, skills, updateGuildMembers = true) {
        if (!skills) {
            skills = util.getStats(message, target, 'skyblock_skills');
            if (!skills) {
                throw `${util.fixNameFormat(target.displayName)} isn't verified yet! Get them to \`${config.prefix}verify\` or use \`${config.prefix}forceverify\`.`;
            }
        }
        let skillMap = skills.skills;
        let slayerMap = skills.slayers;
        let cataLv = skills.catacombs;
        let totalSlayerXp = skills.totalSlayerXp;
        return this.updateRoles(bot, message, target, skillMap, slayerMap, totalSlayerXp, cataLv, true, updateGuildMembers);
    },

    // Updates the target's roles. Returns true if role updates were performed. False if not.
    updateRoles(bot, message, target, skills, slayers, totalSlayerXp, catacombsLv, sendMessage = true, updateGuildMembers = true) {
        let skillMap = skills.reduce((map, arr) => {
            map.set(arr[0], arr[1]);
            return map;
        }, new Map());

        let slayerMap = slayers.reduce((map, arr) => {
            map.set(arr[0], arr[1]);
            return map;
        }, new Map());

        let rolesToAssign = [];
        let rolesNotAwarded = [];
        let avg_skill_level = 0;
        for (let skillName of [...skillMap.keys()]) {
            let highestRole;
            for (let level of Object.keys(SKILLS_DATABASE[skillName])) {
                if (skillMap.get(skillName) >= level) {
                    highestRole = SKILLS_DATABASE[skillName][level];
                } 
            }
            for (let level of Object.keys(SKILLS_DATABASE[skillName])) {
                if (SKILLS_DATABASE[skillName][level] === highestRole) {
                    rolesToAssign.push(SKILLS_DATABASE[skillName][level]);
                } else {
                    rolesNotAwarded.push(SKILLS_DATABASE[skillName][level]);
                }
            }
            if (skillName !== 'RUNECRAFTING' && skillName !== 'CARPENTRY') {
                avg_skill_level += skillMap.get(skillName);
            }
        }
        avg_skill_level /= ([...skillMap.keys()].length - 2);
        let highestRole;
        for (let level of Object.keys(AVG_SKILL_LEVELS_DATABASE)) {
            if (avg_skill_level >= level) {
                highestRole = AVG_SKILL_LEVELS_DATABASE[level];
            }
        }
        for (let level of Object.keys(AVG_SKILL_LEVELS_DATABASE)) {
            if (AVG_SKILL_LEVELS_DATABASE[level] === highestRole) {
                rolesToAssign.push(AVG_SKILL_LEVELS_DATABASE[level])
            } else {
                rolesNotAwarded.push(AVG_SKILL_LEVELS_DATABASE[level])
            }
        }

        for (const slayerName in SLAYERS_DATABASE) {
            let highestRole;
            for (let level of Object.keys(SLAYERS_DATABASE[slayerName])) {
                if (slayerMap.get(slayerName) >= level) {
                    highestRole = SLAYERS_DATABASE[slayerName][level];
                }
            }
            for (let level of Object.keys(SLAYERS_DATABASE[slayerName])) {
                if (SLAYERS_DATABASE[slayerName][level] === highestRole) {
                    rolesToAssign.push(SLAYERS_DATABASE[slayerName][level]);
                } else {
                    rolesNotAwarded.push(SLAYERS_DATABASE[slayerName][level]);
                }
            }
        }

        highestRole = undefined;
        for (let xp of Object.keys(SLAYER_XP_DATABASE)) {
            if (totalSlayerXp >= xp) {
                highestRole = SLAYER_XP_DATABASE[xp];
            }
        }
        for (let xp of Object.keys(SLAYER_XP_DATABASE)) {
            if (SLAYER_XP_DATABASE[xp] === highestRole) {
                rolesToAssign.push(SLAYER_XP_DATABASE[xp])
            } else {
                rolesNotAwarded.push(SLAYER_XP_DATABASE[xp])
            }
        }

        highestRole = undefined;
        for (let cataLv of Object.keys(CATACOMBS_DATABASE)) {
            if (catacombsLv >= cataLv) {
                highestRole = CATACOMBS_DATABASE[cataLv];
            }
        }
        for (let cataLv of Object.keys(CATACOMBS_DATABASE)) {
            if (CATACOMBS_DATABASE[cataLv] === highestRole) {
                rolesToAssign.push(CATACOMBS_DATABASE[cataLv]);
            } else {
                rolesNotAwarded.push(CATACOMBS_DATABASE[cataLv]);
            }
        }

        let rolesAlreadyHave = [];
        let rolesAdded = [];
        let rolesRemoved = [];
        let rolesNotQualifiedFor = [];

        rolesToAssign.sort((o1, o2) => Discord.Role.comparePositions(o1, o2));
        rolesToAssign.forEach((roleId) => {
            if (target.roles.cache.has(`${roleId}`)) {
                rolesAlreadyHave.push(roleId);
            } else {
                rolesAdded.push(roleId);
            }
        })
        rolesNotAwarded.sort((o1, o2) => Discord.Role.comparePositions(o1, o2));
        rolesNotAwarded.forEach((roleId) => {
            if (target.roles.cache.has(`${roleId}`)) {
                rolesRemoved.push(roleId);
            } else {
                rolesNotQualifiedFor.push(roleId);
            }
        })

        roleManagement = async () => {
            try {
                if (rolesAdded.length > 0) {
                    await target.roles.add(rolesAdded, 'Add Skill Roles');
                }
                if (rolesRemoved.length > 0) {
                    await target.roles.remove(rolesRemoved, 'Remove Skill Roles');
                }
                if (updateGuildMembers) {
                    await guild.updateRoles(bot, message, target);
                }
            } catch (e) {
                util.sendMessage(message.channel, new Discord.MessageEmbed().setTitle('Error with updateRoles!').setDescription(e));
            }
        }

        roleManagement();

        const embed = new Discord.MessageEmbed().setDescription(`${target}'s role update!`)
            .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
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

        if (sendMessage && (rolesAdded.length || rolesRemoved.length)) {
            util.sendMessage(message.channel, embed);
        }
        return (rolesAdded.length > 0 || rolesRemoved.length > 0);
    }
}