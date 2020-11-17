const util = require('../utilities');
const config = require('../config.json');
const jsonFile = require('jsonfile');
const fs = require('fs');
const Colors = require('../resources/colors.json');
const Discord = require('discord.js');

module.exports = {
    name: ['givaway'],
    description: "Randomly selects 3 unique winners from everyone who has tickets. Requires ADMINISTRATOR.",
    usage: ``,
    requiredPermissions: 'ADMINISTRATOR',

    execute(bot, message, args) {
        // Coming soon.
    }
}