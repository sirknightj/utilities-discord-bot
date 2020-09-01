const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');

const toggleableOptions = [
    'self deafen afk',
    'track vc usage',
    'allow hypixel api commands'
]

module.exports = {
    name: ['toggle', 'settings'],
    description: "Switches the setting to the other state.",
    usage: `<${toggleableOptions.join('/').toLowerCase()}>`,
    requiredPermissions: 'ADMINISTRATOR',
    requiresArgs: true,

    async execute(bot, message, args) {
        util.safeDelete(message)

        var chosenOption = args.join(' ').toLowerCase();
        if (!toggleableOptions.includes(chosenOption)) {
            throw new InvalidUsageError('Invalid option.');
        }
        let updatedState;
        switch (chosenOption) {
            case toggleableOptions[0].toLowerCase():
                config.move_to_afk_on_self_deafen = !config.move_to_afk_on_self_deafen;
                updatedState = config.move_to_afk_on_self_deafen;
                break;
            case toggleableOptions[1].toLowerCase():
                config.track_and_award_vc_usage = !config.track_and_award_vc_usage;
                updatedState = config.track_and_award_vc_usage;
                break;
            case toggleableOptions[2].toLowerCase():
                config.enable_hypixel_api_required_commands = !config.enable_hypixel_api_required_commands;
                updatedState = config.enable_hypixel_api_required_commands;
                break;
            default:
                throw new IllegalStateException('This should never happen. toggle.js.');
        }

        fs.writeFile(`config.json`, JSON.stringify(config), 'utf-8', () => { });
        util.sendTimedMessage(message.channel, `Updated configuration option "${chosenOption}" to **${updatedState}**.`, config.longer_delete_delay);
    }
}