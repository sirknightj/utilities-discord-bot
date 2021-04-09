const config = require('../config.json');
const util = require('../utilities');

module.exports = {
    name: ['backup'],
    description: 'Sends `stats.json`.',
    usage: "",
    requiredPermissions: "ADMINISTRATOR",
    
    execute(bot, message, args) {
        if (!config) {
            console.log("Cannot locate config.json.");
            return;
        }
        if (!config.resources_folder_file_path) {
            console.log("Cannot locate greeting_messages_to_say in config.json.");
            return;
        }
        util.sendMessage(message.channel,
            'Here is the latest backup!', {files: [`${config.resources_folder_file_path}stats.json`]});
    }
}