const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');
const uuid = require('./uuid.js');
const updateRoles = require('./updateroles.js');
const guild = require('./guild');

var skills;

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

// Level -> Total XP
const SLAYER_LEVELS_DATABASE = {
    "zombie": {1: 5, 2: 15, 3: 200, 4: 1000, 5: 5000, 6: 20000, 7: 100000, 8: 400000, 9: 1000000, 10: 2000000, 11: 3000000, 12: 4000000, 13: 5000000, 14: 6000000, 15: 7000000, 16: 8000000, 17: 9000000, 18: 10000000, 19: 11000000, 20: 12000000, 21: 13000000, 22: 14000000, 23: 15000000, 24: 16000000, 25: 17000000, 26: 18000000, 27: 19000000, 28: 20000000, 29: 21000000, 30: 22000000, 31: 23000000, 32: 24000000, 33: 25000000, 34: 26000000, 35: 27000000, 36: 28000000, 37: 29000000, 38: 30000000},
    "spider": {1: 5, 2: 25, 3: 200, 4: 1000, 5: 5000, 6: 20000, 7: 100000, 8: 400000, 9: 1000000, 10: 2000000, 11: 3000000, 12: 4000000, 13: 5000000, 14: 6000000, 15: 7000000, 16: 8000000, 17: 9000000, 18: 10000000, 19: 11000000, 20: 12000000, 21: 13000000, 22: 14000000, 23: 15000000, 24: 16000000, 25: 17000000, 26: 18000000, 27: 19000000, 28: 20000000, 29: 21000000, 30: 22000000, 31: 23000000, 32: 24000000, 33: 25000000, 34: 26000000, 35: 27000000, 36: 28000000, 37: 29000000, 38: 30000000},
    "wolf": {1: 10, 2: 30, 3: 250, 4: 1500, 5: 5000, 6: 20000, 7: 100000, 8: 400000, 9: 1000000, 10: 2000000, 11: 3000000, 12: 4000000, 13: 5000000, 14: 6000000, 15: 7000000, 16: 8000000, 17: 9000000, 18: 10000000, 19: 11000000, 20: 12000000, 21: 13000000, 22: 14000000, 23: 15000000, 24: 16000000, 25: 17000000, 26: 18000000, 27: 19000000, 28: 20000000, 29: 21000000, 30: 22000000, 31: 23000000, 32: 24000000, 33: 25000000, 34: 26000000, 35: 27000000, 36: 28000000, 37: 29000000, 38: 30000000},
    "enderman": {1: 10, 2: 30, 3: 250, 4: 1500, 5: 5000, 6: 20000, 7: 100000, 8: 400000, 9: 1000000, 10: 2000000, 11: 3000000, 12: 4000000, 13: 5000000, 14: 6000000, 15: 7000000, 16: 8000000, 17: 9000000, 18: 10000000, 19: 11000000, 20: 12000000, 21: 13000000, 22: 14000000, 23: 15000000, 24: 16000000, 25: 17000000, 26: 18000000, 27: 19000000, 28: 20000000, 29: 21000000, 30: 22000000, 31: 23000000, 32: 24000000, 33: 25000000, 34: 26000000, 35: 27000000, 36: 28000000, 37: 29000000, 38: 30000000},
    "blaze": {1: 10, 2: 30, 3: 250, 4: 1500, 5: 5000, 6: 20000, 7: 100000, 8: 400000, 9: 1000000, 10: 2000000, 11: 3000000, 12: 4000000, 13: 5000000, 14: 6000000, 15: 7000000, 16: 8000000, 17: 9000000, 18: 10000000, 19: 11000000, 20: 12000000, 21: 13000000, 22: 14000000, 23: 15000000, 24: 16000000, 25: 17000000, 26: 18000000, 27: 19000000, 28: 20000000, 29: 21000000, 30: 22000000, 31: 23000000, 32: 24000000, 33: 25000000, 34: 26000000, 35: 27000000, 36: 28000000, 37: 29000000, 38: 30000000}
}

// Level -> Total XP
const CATACOMBS_LEVELS_DATABASE = {
    1: 50, 2: 125, 3: 235, 4: 395, 5: 625, 6: 955, 7: 1425, 8: 2095, 9: 3045, 10: 4385, 11: 6275, 12: 8940, 13: 12700, 14: 17960, 15: 25340, 16: 35640, 17: 50040, 18: 70040, 19: 97640, 20: 135640, 21: 188140, 22: 259640, 23: 356640, 24: 488640, 25: 668640, 26: 911640, 27: 1239640, 28: 1684640, 29: 2284640, 30: 3084640, 31: 4149640, 32: 5559640, 33: 7459640, 34: 9959640, 35: 13259640, 36: 17559640, 37: 23159640, 38: 30359640, 39: 39559640, 40: 51559640, 41: 66559640, 42: 85559640, 43: 109559640, 44: 139559640, 45: 177559640, 46: 225559640, 47: 285559640, 48: 360559640, 49: 453559640, 50: 569809640
}

module.exports = {
    name: ['initskills', 'saveskills'],
    description: 'Sets your initial skills. Only sirknightj should use this.',
    usage: '<user>',
    requiredPermissions: 'ADMINISTRATOR',

    execute(bot, message, args) {
        if (!config.enable_hypixel_api_required_commands) {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "This command is disabled.");
            return;
        }

        if (!config.API_KEY || config.API_KEY === 'YOUR_HYPIXEL_API_KEY_HERE') {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "This command requires a Hypixel API Key.");
            return;
        }

        let target = util.getUserFromMention(message, args[0]);
        if (!target) throw `Could not find user \`${args[0]}\``;

        let targetUuid = util.getStats(message, target, 'mc_uuid');

        if (!targetUuid) {
            console.log(targetUuid)
            throw 'Failed to get UUID';
        }

        try {
            if (!skills) {
                this.setupSkills();
            }
            fetch(`https://api.hypixel.net/skyblock/profiles?key=${config.API_KEY}&uuid=${targetUuid}`)
                .then(response => {
                    if (response.ok) {
                        response.json().then(data => {
                            let skillMap = new Map();
                            let slayerMap = new Map();
                            let totalSlayerXp = 0;
                            let catacombsLv = 0;

                            if (!data.profiles) {
                                for (const skillName in SKILLS_DATABASE) {
                                    this.chooseLargerInMap(skillMap, skillName, 0);
                                }
                                for (const slayerName in SLAYER_LEVELS_DATABASE) {
                                    this.chooseLargerInMap(slayerMap, slayerName, 0);
                                }
                                util.sendMessage(message.channel, new Discord.MessageEmbed()
                                    .setColor(Colors.RED)
                                    .setTitle('Notice!')
                                    .setDescription(`${target} has no skyblock profiles.`)
                                    .setTimestamp())
                            } else {
                                for (let i = 0; i < data.profiles.length; i++) {
                                    let profile = data.profiles[i].members[targetUuid];
                                    for (const skillName in SKILLS_DATABASE) {
                                        let skillxp = profile['experience_skill_' + skillName.toLowerCase()] || 0;
                                        let thisLevel = this.getSkillLevel(skillName, skillxp);
                                        this.chooseLargerInMap(skillMap, skillName, thisLevel);
                                    }
    
                                    let slayerXPForThisProfile = 0;
                                    for (const slayerName in SLAYER_LEVELS_DATABASE) {
                                        if (profile.slayer_bosses && profile.slayer_bosses.zombie && profile.slayer_bosses[slayerName] && profile.slayer_bosses[slayerName].xp) {
                                            slayerXPForThisProfile += profile.slayer_bosses[slayerName].xp;
                                            let thisLevel = this.getSlayerLevel(slayerName, profile.slayer_bosses[slayerName].xp);
                                            this.chooseLargerInMap(slayerMap, slayerName, thisLevel);
                                        } else {
                                            this.chooseLargerInMap(slayerMap, slayerName, 0);
                                        }
                                    }
                                    totalSlayerXp = Math.max(totalSlayerXp, slayerXPForThisProfile);
    
                                    if (profile.dungeons && profile.dungeons.dungeon_types && profile.dungeons.dungeon_types.catacombs && profile.dungeons.dungeon_types.catacombs.experience) {
                                        catacombsLv = Math.max(catacombsLv, this.getCatacombsLevel(profile.dungeons.dungeon_types.catacombs.experience));
                                    }
                                }
                            }
                            this.saveStats(message, target, skillMap, slayerMap, catacombsLv, totalSlayerXp);
                            updateRoles.updateMemberRoles(bot, message, target, {skills: Array.from(skillMap), slayers: Array.from(slayerMap), catacombs: catacombsLv, totalSlayerXp: totalSlayerXp});
                        });
                    } else {
                        response.json().then(data => {
                            util.sendMessage(message.channel, new Discord.MessageEmbed()
                                .setTitle(`Error ${response.status}: ${response.statusText}`)
                                .setDescription(data.cause)
                            );
                        });
                    }
                });
        } catch (err) {
            util.sendTimedMessage(message, message.channel, 'Error fetching the API.');
        }
    },

    setupSkills() {
        fetch(`https://api.hypixel.net/resources/skyblock/skills?key=${config.API_KEY}`)
            .then(response => {
                if (response.ok) {
                    response.json().then(data => {
                        skills = data.skills;
                    });
                } else {
                    response.json().then(data => {
                        util.sendMessage(message.channel, new Discord.MessageEmbed()
                            .setTitle(`Error ${response.status}: ${response.statusText}`)
                            .setDescription(data.cause)
                        );
                    });
                }
            });
    },

    getSkillLevel(skillName, xp) {
        let lv = 0;
        if (xp > 0) {
            for (const lev in skills[skillName].levels) {
                let l = skills[skillName].levels[lev];
                if (xp >= l.totalExpRequired) {
                    lv = l.level;
                }
            }
        }
        return lv;
    },

    getSlayerLevel(slayerName, xp) {
        let lv = 0;
        if (xp > 0) {
            for (const lev of Object.keys(SLAYER_LEVELS_DATABASE[slayerName])) {
                let l = SLAYER_LEVELS_DATABASE[slayerName][lev];
                if (xp >= l) {
                    lv = lev;
                }
            }
        }
        return lv;
    },

    getCatacombsLevel(xp) {
        let lv = 0;
        if (xp > 0) {
            for (const lev of Object.keys(CATACOMBS_LEVELS_DATABASE)) {
                let l = CATACOMBS_LEVELS_DATABASE[lev];
                if (xp >= l) {
                    lv = lev;
                }
            }
        }
        return lv;
    },

    chooseLargerInMap(map, key, value) {
        map.set(key, map.has(key) ? Math.max(map.get(key), value) : value);
    },

    saveStats(message, target, skillMap, slayerMap, cataLv, slayerXP) {
        util.writeStats(message.member.guild, target, {skills: Array.from(skillMap), slayers: Array.from(slayerMap), catacombs: cataLv, totalSlayerXp: slayerXP}, 'skyblock_skills');
    }
}