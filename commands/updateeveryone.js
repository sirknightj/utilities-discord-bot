const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');
const updatename = require('./updatename.js');

module.exports = {
    name: ['updateeveryone'],
    description: "Updates everyone that has verified's names.",
    usage: '',
    requiredPermissions: 'ADMINISTRATOR',

    execute(bot, message, args) {
        this.executor(bot, message, args).catch(err => console.log(err));
    },

    executor: async function (bot, message, args) {
        util.sendMessage(message.channel, "Working on it... this may take a while.");
        let res = [];
        for (const member of message.guild.members.cache) { // member = [userID, Discord.GuildMember]
            let uuid = util.getStats(message, member[1], 'mc_uuid');
            if (uuid) {
                let result = await updatename.execute(bot, message, [ member[0] ], true)
                if (result) {
                    res.push(result);
                }
            }
        }

        if (res.length === 0) {
            util.sendMessage(message.channel, 'Done. No name updates were performed, everything up to date.');
            return;
        }
        
        const num_per = 20;
        for (let i = 0; i < Math.ceil(res.length / num_per); i++) {
            util.sendMessage(message.channel, new Discord.MessageEmbed()
                .setTitle('Name Updates!')
                .setDescription(res.slice(i * num_per, num_per))
                .setColor(Colors.GREEN)
                .setTimestamp());
        }
    }
};