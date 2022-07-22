const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');
const uuid = require('./uuid.js');
const updateRoles = require('./updateroles.js');

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
    "blaze": {1: 10, 2: 30, 3: 250, 4: 1500, 5: 5000, 6: 20000, 7: 100000, 8: 400000, 9: 1000000, 10: 2000000, 11: 3000000, 12: 4000000, 13: 5000000, 14: 6000000, 15: 7000000, 16: 8000000, 17: 9000000, 18: 10000000, 19: 11000000, 20: 12000000, 21: 13000000, 22: 14000000, 23: 15000000, 24: 16000000, 25: 17000000, 26: 18000000, 27: 19000000, 28: 20000000, 29: 21000000, 30: 22000000, 31: 23000000, 32: 24000000, 33: 25000000, 34: 26000000, 35: 27000000, 36: 28000000, 37: 29000000, 38: 30000000},
    "enderman": {1: 10, 2: 30, 3: 250, 4: 1500, 5: 5000, 6: 20000, 7: 100000, 8: 400000, 9: 1000000, 10: 2000000, 11: 3000000, 12: 4000000, 13: 5000000, 14: 6000000, 15: 7000000, 16: 8000000, 17: 9000000, 18: 10000000, 19: 11000000, 20: 12000000, 21: 13000000, 22: 14000000, 23: 15000000, 24: 16000000, 25: 17000000, 26: 18000000, 27: 19000000, 28: 20000000, 29: 21000000, 30: 22000000, 31: 23000000, 32: 24000000, 33: 25000000, 34: 26000000, 35: 27000000, 36: 28000000, 37: 29000000, 38: 30000000}
}

// Level -> Total XP
const CATACOMBS_LEVELS_DATABASE = {
    1: 50, 2: 125, 3: 235, 4: 395, 5: 625, 6: 955, 7: 1425, 8: 2095, 9: 3045, 10: 4385, 11: 6275, 12: 8940, 13: 12700, 14: 17960, 15: 25340, 16: 35640, 17: 50040, 18: 70040, 19: 97640, 20: 135640, 21: 188140, 22: 259640, 23: 356640, 24: 488640, 25: 668640, 26: 911640, 27: 1239640, 28: 1684640, 29: 2284640, 30: 3084640, 31: 4149640, 32: 5559640, 33: 7459640, 34: 9959640, 35: 13259640, 36: 17559640, 37: 23159640, 38: 30359640, 39: 39559640, 40: 51559640, 41: 66559640, 42: 85559640, 43: 109559640, 44: 139559640, 45: 177559640, 46: 225559640, 47: 285559640, 48: 360559640, 49: 453559640, 50: 569809640
}

module.exports = {
    name: ['claim', 'c', 'claimall'],
    description: 'Automatically claims points from skills you level up!',
    usage: '',

    async execute(bot, message, args) {
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

        let target = message.member;

        if (!util.getStats(message, target, 'skyblock_skills')) {
            util.sendMessage(message.channel, `Your skills aren't initialized yet. Run ${config.prefix}verify first!`);
            return;
        }

        let targetUuid = util.getStats(message, target, 'mc_uuid');

        if (!targetUuid) {
            util.sendMessage(message.channel, `You aren't verified. Run \`${config.prefix}verify\` first!`);
            return;
        }

        this.forceClaim(bot, message, target, targetUuid, false, false);
    },

    forceClaim(bot, message, target, targetUuid, returnValue = false, updateGuildMembers = true) {
        try {
            if (!skills) {
                this.setupSkills();
            }
            fetch(`https://api.hypixel.net/skyblock/profiles?key=${config.API_KEY}&uuid=${targetUuid}`)
                .then(response => {
                    if (response.ok) {
                        response.json().then(data => {
                            let skillMap, slayerMap;
                            let totalSlayerXp = 0;
                            let catacombsLv = 0;

                            let saved_skills = util.getStats(message, target, 'skyblock_skills');
                            if (saved_skills) {
                                let skills = saved_skills.skills;
                                let slayers = saved_skills.slayers;
                                skillMap = skills.reduce((map, arr) => {
                                    map.set(arr[0], arr[1]);
                                    return map;
                                }, new Map());
                        
                                slayerMap = slayers.reduce((map, arr) => {
                                    map.set(arr[0], arr[1]);
                                    return map;
                                }, new Map());
                            } else {
                                skillMap = new Map();
                                slayerMap = new Map();
                            }

                            if (!data.profiles) {
                                for (const skillName in SKILLS_DATABASE) {
                                    this.chooseLargerInMap(skillMap, skillName, 0);
                                }
                                for (const slayerName in SLAYER_LEVELS_DATABASE) {
                                    this.chooseLargerInMap(slayerMap, slayerName, 0);
                                }
                                let curStats = util.getStats(message, message.member, "skyblock_stats");
                                if (curStats && curStats.catacombs && curStats.totalSlayerXp) {
                                    util.sendMessage(message.channel, new Discord.MessageEmbed()
                                        .setColor(Colors.RED)
                                        .setTitle('Notice!')
                                        .setDescription(`${target} has no skyblock profiles.`)
                                        .setTimestamp());
                                }
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

                    

                            return this.updateStats(bot, message, target, skillMap, slayerMap, catacombsLv, totalSlayerXp, returnValue, updateGuildMembers);
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
            util.sendMessage(message.channel, err);
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

    updateStats(bot, message, target, skillMap, slayerMap, cataLv, slayerXP, returnValue, updateGuildMembers = true) {
        let claimed = false;
        let oldStats = util.getStats(message, target, 'skyblock_skills');
        skillMap = Array.from(skillMap);
        slayerMap = Array.from(slayerMap);
        for (let i = 0; i < skillMap.length; i++) {
            for (let j = (oldStats.skills[i] ? oldStats.skills[i][1] : 0) + 1; j <= skillMap[i][1]; j++) {
                this.awardCoins(bot, message, target, skillMap[i][0], j);
                claimed = true;
            }
        }
        for (let i = 0; i < slayerMap.length; i++) {
            for (let j = (oldStats.slayers[i] ? oldStats.slayers[i][1] : 0) + 1; j <= slayerMap[i][1]; j++) {
                this.awardCoins(bot, message, target, slayerMap[i][0], j);
                claimed = true;
            }
        }
        for (let j = (oldStats.catacombs ? oldStats.catacombs : 0) + 1; j <= cataLv; j++) {
            this.awardCoins(bot, message, target, 'cata', j);
            claimed = true;
        }
        util.writeStats(target.guild, target, {skills: skillMap, slayers: slayerMap, catacombs: Math.max(cataLv, oldStats.catacombs), totalSlayerXp: Math.max(slayerXP, oldStats.totalSlayerXp)}, 'skyblock_skills');
        updateRoles.updateMemberRoles(bot, message, target, null, updateGuildMembers);
        if (returnValue) {
            return claimed;
        }
        if (claimed) {
            util.sendMessage(message.channel, 'Done.');
        } else {
            util.sendTimedMessage(message.channel, 'Nothing to claim. Your skills are up-to-date. If you _just_ leveled something up, you may have to wait for the Hypixel API to update.', config.delete_delay);
            util.safeDelete(message, config.delete_delay);
        }
    },

    awardCoins(bot, message, target, skillName, skillLevel) {
        console.log(target.displayName + ' ' + skillName + ' ' + skillLevel);
        if (!target.roles.cache.some(role => role.id === config.role_id_required_to_use_shop)) {
            return;
        }
        let showLevel = false;
        skillName = skillName.toLowerCase();
        let coinsToAdd;
        let additionalInfo;
        if (skillLevel <= 0) {
            util.sendMessage(message.channel, `Invalid skill level \`${skillName} ${skillLevel}\`. No coins were awarded.`);
        }
        if (skillName === 'rev' || skillName === 'zombie' || skillName === 'tara' || skillName === 'enderman' || skillName==='eman'|| skillName === 'endermen' || skillName === 'ender' || skillName === 'tarantula' || skillName === 'spider' || skillName === 'wolf' || skillName === 'sven' || skillName === 'blaze') {
            let xp_per_level = 0;
            let XP_TABLE;
            if (skillName === 'zombie' || skillName === 'revenant') {
                XP_TABLE = [0, 5, 10, 185, 800, 4000, 15000, 80000, 300000, 800000, 1000000];
                xp_per_level = 150;
            } else if (skillName === 'spider' || skillName === 'tarantula') {
                XP_TABLE = [0, 5, 20, 175, 800, 4000, 15000, 80000, 300000, 800000, 1000000];
                xp_per_level = 90;
            } else if (skillName === 'sven' || skillName === 'wolf') {
                XP_TABLE = [0, 10, 20, 230, 1250, 3500, 15000, 80000, 300000, 800000, 1000000];
                xp_per_level = 60;
            } else if (skillName === 'enderman') {
                XP_TABLE = [0, 10, 20, 230, 1250, 3500, 15000, 80000, 300000, 800000, 1000000];
                xp_per_level = 25;
            } else {
                XP_TABLE = [0, 10, 20, 230, 1250, 3500, 15000, 80000, 300000, 800000, 1000000];
                xp_per_level = 16;
            }
            if (skillLevel > 0) {
                coinsToAdd = Math.round(XP_TABLE[Math.min(skillLevel, 10)] / xp_per_level * 100) / 100;
                if (skillLevel <= 6) {
                    coinsToAdd = Math.round(coinsToAdd * 2 * 100) / 100;
                }
            } else {
                util.sendMessage(message.channel, `Invalid skill level \`${skillName} ${skillLevel}\`. No coins were awarded.`);
                return;
            }
            // additionalInfo = 'Hypixel 20% XP Boost!';
            // coinsToAdd *= 1.2; // TODO REMOVE LATER
        } else if (skillName === 'cata' || skillName === 'catacombs') { // handle catacombs
            let XP_TABLE = [0,50,75,110,160,230,330,470,670,950,1340,1890,2665,3760,5260,7380,10300,14400,20000,27600,38000,52500,71500,97000,132000,180000,243000,328000,445000,600000,800000,1065000,1410000,1900000,2500000,3300000,4300000,5600000,7200000,9200000,12000000,15000000,19000000,24000000,30000000,38000000,48000000,60000000,75000000,93000000,116250000]
            let xp_per_coin;
            if (skillLevel <= 30) {
                xp_per_coin = 750; 
            } else if (skillLevel <= 32) {
                xp_per_coin = 900;
            } else if (skillLevel <= 34) { 
                xp_per_coin = 1250;
            } else if (skillLevel <= 40) {
                xp_per_coin = 1500;
            } else if (skillLevel <= 50) {
                xp_per_coin = 1850;
            } else {
                util.sendMessage(message.channel, `Invalid skill level \`${skillName} ${skillLevel}\`. No coins were awarded.`);
                return;
            }
            coinsToAdd = Math.round(XP_TABLE[skillLevel] / xp_per_coin * 100) / 100;
            // additionalInfo = 'Hypixel 20% XP Boost';
            // coinsToAdd *= 1.2; // TODO REMOVE LATER
        } else if (skillName === 'hotm') {
            if (skillLevel === 1) {
                coinsToAdd = 75;
            } else if (skillLevel === 2) {
                coinsToAdd = 150;
            } else if (skillLevel === 3) {
                coinsToAdd = 225;
            } else if (skillLevel === 4) {
                coinsToAdd = 300;
            } else if (skillLevel === 5) {
                coinsToAdd = 375;
            } else if (skillLevel === 6) {
                coinsToAdd = 450;
            } else if (skillLevel === 7) {
                coinsToAdd = 525;
            }
        } else if (skillName === 'alchemy' || skillName === 'foraging' || skillName === 'enchanting' || skillName === 'combat' || skillName === 'taming' || skillName === 'farming' || skillName === 'mining' || skillName === 'fishing') { // handle skills 
            showLevel = true;
            let multiplier = (skillName === 'alchemy' || skillName === 'enchanting');
            let boost = (skillName === 'fishing' || skillName === 'foraging')
            let XP_TABLE = [0,50,125,200,300,500,750,1000,1500,2000,3500,5000,7500,10000,15000,20000,30000,50000,75000,100000,200000,300000,400000,500000,600000,700000,800000,900000,1000000,1100000,1200000,1300000,1400000,1500000,1600000,1700000,1800000,1900000,2000000,2100000,2200000,2300000,2400000,2500000,2600000,2750000,2900000,3100000,3400000,3700000,4000000,4300000,4600000,4900000,5200000,5500000,5800000,6100000,6400000,6700000,7000000];
            if (skillLevel > 0 && skillLevel <= 60) {
                let upgradeLevel = util.getStats(message, target, 'upgrade_skill_xp');
                let xp_per_coin = Math.round(8000 * (1 - 0.05 * upgradeLevel));
                coinsToAdd = Math.round(XP_TABLE[skillLevel] / xp_per_coin * 100) / 100;
            } else {
                util.sendMessage(message.channel, `Invalid skill level \`${skillName} ${skillLevel}\`. No coins were awarded.`);
                return;
            }
            if (multiplier) {
                coinsToAdd = Math.floor(coinsToAdd / 3 * 100) / 100;
            } else if (boost) {
                coinsToAdd = Math.floor(coinsToAdd * 3 * 100) / 100;
            }
            // additionalInfo = 'Hypixel 20% XP Boost!';
            // coinsToAdd *= 1.2; // TODO: REMOVE LATER
        } else if (skillName === 'runecrafting' || skillName === 'carpentry') {
            coinsToAdd = 0;
        } else {
            util.sendMessage(message.channel, `Invalid skill name \`${skillName}\`. No coins were awarded.`);
            return;
        }
        coinsToAdd = Math.round(coinsToAdd * 100) / 100;
        let embed = new Discord.MessageEmbed()
            .setTitle(`Congrats to ${util.fixNameFormat(target.displayName)} on hitting ${util.capitalizeFirstLetter(skillName)} ${skillLevel}!`)
            .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`${util.fixNameFormat(target.displayName)} has been awarded ${util.addCommas(coinsToAdd)} coins${showLevel ? ` (lv ${util.getStats(message, target, 'upgrade_skill_xp')})` : ''}.\nReason: ${util.capitalizeFirstLetter(skillName)} ${skillLevel}.`)
            .setColor(skillLevel === 50 || skillLevel === 60 ? Colors.RED : Colors.GOLD)
            .setTimestamp();
        if (additionalInfo) {
            embed.addField('Additional Info', additionalInfo);
        }
        util.sendMessage(message.channel, embed);
        let coinResult = util.addStats(message, target, coinsToAdd, "coins");
        let additional_info = [
            `Coins: ${util.addCommas(coinResult.oldPoints)} » ${util.addCommas(coinResult.newPoints)}`,
            `Date Awarded: ${new Date(Date.now())}`
        ];
        if (additionalInfo) {
            additional_info.push(additionalInfo);
        }
        util.sendMessage(util.getLogChannel(message), new Discord.MessageEmbed()
            .setColor(Colors.GOLD)
            .setTitle("Awarded Coins")
            .setAuthor(target.displayName, target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`${bot.user.username} (bot) manually awarded ${target.displayName} ${util.addCommas(coinsToAdd)} coins${showLevel ? ` (lv ${util.getStats(message, target, 'upgrade_skill_xp')})` : ''} for ${util.capitalizeFirstLetter(skillName)} ${skillLevel}!`)
            .addField('Additional Info', additional_info));
    }
}