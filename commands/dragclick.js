const util = require('../utilities');
const config = require('../config.json');
const resources_folder_file_path = config.resources_folder_file_path;

module.exports = {
    name: 'dragclick',
    description: "Joins the voice channel you're in and plays some dragclicking noise.",
    usage: '',

    execute(bot, message, args) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            message.reply("You must be in a voice channel to use this command.");
            return;
        }
        util.sendMessage(message.channel, `Hear my awesome drag clicking, ${message.member.displayName}!`);
        voiceChannel.join()
            .then(connection => {
                const dispatcher = connection.play(`${resources_folder_file_path}dragclick_by_devforums_short.mp3`);
                dispatcher.on('finish', finish => {
                    connection.disconnect();
                    voiceChannel.leave();
                });
            })
            .catch(err => {
                message.reply(err.message);
                console.log(err)
            });
    }
}