const util = require('../utilities');
const config = require('../config.json');
const fetch = require('node-fetch');
const { endsWith } = require('ffmpeg-static');

module.exports = {
    name: ["checkplayer", "playerstatus"],
    description: "Checks the player's Guild Experience gained in the past 7 days, the time they joined and their rank.",
    usage: `<player>`,
    requiresArgs = true,

    execute(bot,message,args) {
        try{
            fetch(`https://api.mojang.com/profiles/minecraft/${args}`)
            .then (result =>{
                let targetUUID = result.json()
                fetch(`https://api.hypixel.net/guild?key=${config.API_KEY}&id=${config.GUILD_KEY}`)
                .then (result =>{
                    let object = result.json()
                    if (result.success) {
                        for (i = 0; i < object.guild.members.length; i++) {
                            if (object.guild.members[i].uuid == targetUUID) {
                                console.log(object.guild.members[i]);
                                util.sendMessage(message.channel, object);
                                const checkPlayerEmbed = new Discord.MessageEmbed()
                                .setColor("#ff0000")
                                function getPlayersLastLetter(args) {
                                    if (args.endsWith("s")) {
                                        return (`${args}'`);
                                    } else {
                                        return (`${args}'s`);
                                    }
                                }
                                function epochToDate(d){ 
                                    var utcSeconds = Math.floor(d/1000)
                                    var s = new Date(0);
                                    return s.setUTCSeconds(utcSeconds);  
                                } 
                                checkPlayerEmbed.setTitle(`${getPlayersLastLetter(args)} Guild Statistics`)
                                checkPlayerEmbed.setDescription(`Rank: ${object.guild.members[i].rank}`)
                                checkPlayerEmbed.addFields(
                                    {name: "Joined", value: `${epochToDate(object.guild.members[i].joined)}`},
                                    {name: "Experience Today", value: `${object.guild.members[i].expHistory[1]} Guild experience.`}
                                )
                            } else {
                                util.sendTimedMessage(message.channel, `Error: Couldn't find the player!`, 10000)
                            }
                        }
                    }
                });
            });
        } catch (err) {
            console.log(err.stack)
        }
    }
}