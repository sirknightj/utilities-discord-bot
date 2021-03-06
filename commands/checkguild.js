const util = require('../utilities');
const config = require('../config.json');
const fetch = require('node-fetch');
const { sendTimedMessage } = require('../utilities');

module.exports = {
    name: ["checkguild", "guildstatus", "guildstats"],
    description: "Checks the time the guild was created, the amount of exp the guild is at, and the current owner.",
    usage: ``,

    execute(bot,message,args) {
        if (!config.enable_hypixel_api_required_commands) {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "This command is disabled.");
            return;
        }
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
                    sendTimedMessage(message.channel, `Error: ${error.message}`);
                    console.log(err.stack);
                }
            });
        } catch (err) {
            console.log(err.stack)
        }
    }
}