const util = require('../utilities');
const config = require('../config.json');
const fetch = require('node-fetch');



module.exports = {
    name: ["checkguild","guildstatus"],
    description: "Check the time the guild was created, the amount of exp the guild is at and the current owner.",
    usage: ``,

    execute(bot,message,args) {
        try{
            fetch(`https://api.hypixel.net/guild?key&${config.API_KEY}&id=${config.GUILD_KEY}`)
            .then(result =>{
                let object = result.json()
                util.sendMessage(message.channel, object);
                if (result.success) {
                    var randomColor = Math.floor(Math.random()*16777215).toString(16);

                    function epochToDate(d){ 
                        var utcSeconds = Math.floor(1579568441957/1000)
                        var d = new Date(0);
                        return d.setUTCSeconds(utcSeconds);  
                    } 

                    const guildEmbed = new Discord.MessageEmbed()
                    .setColor("#" + randomColor)
                    .setTitle(`${result.guild.name}`)
                    .setDescription(`Hypixel Guild owned by FlexforFun`)
                    .addFields(
                        {name: "Date Created", value: `${epochToDate(result.guild.created)}`},
                        {name: "Guild Experience", value: `${result.guild.exp}`}
                    )
                    sendTimedMessage(message.channel, guildEmbed)
                } else {
                    message.channel, "An unknown error has occured running this command."
                }
            });
        } catch (err) {
            console.log(err.stack)
        }
    }
}