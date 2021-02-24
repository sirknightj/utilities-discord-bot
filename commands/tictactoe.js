const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

var TTTGameActive;

module.exports = {
    name: ["tictactoe", "ttt"],
    description: "Play tic tac toe with a friend!",
    usage: "<opponent>",
    requiresTarget: true,

    execute(bot, message, args, target) {
        if (!message.channel.permissionsFor(message.guild.me).has("ADD_REACTIONS")) {
            util.sendMessage(message.channel, `Missing required permission: 'ADD_REACTIONS'`);
            return;
        }
        if (!message.channel.permissionsFor(message.guild.me).has("MANAGE_MESSAGES")) {
            util.sendMessage(message.channel, `Missing required permission: 'MANAGE_MESSAGES'`);
            return;
        }
        if (TTTGameActive) {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "Sorry, I can only handle one game at a time. Please wait until that finishes.");
            return;
        }
        let challenger = message.member;
        util.sendMessage(message.channel, `<@${target.id}>, ${util.fixNameFormat(challenger.displayName)} challenges you to a game of tic tac toe! Do you accept?`)
            .then(message => {
                message.react('✅')
                    .then(() => {
                        message.react('❌');
                    })
                    .then(() => {
                        const collector = message.createReactionCollector((reaction, user) => {
                            return user.id === target.id;
                        }, { time: 60000, max: 1 })

                        collector.on('collect', reaction => {
                            if (reaction.emoji.name === '✅') {
                                util.safeDelete(message);
                                startTTTGame(bot, message.channel, challenger, target);
                            } else {
                                util.sendMessage(message.channel, `${util.fixNameFormat(target.displayName)} has declined your challenge.`);
                                message.reactions.removeAll();
                            }
                        });
                        collector.on('end', collected => {
                            if (collected.size === 0) {
                                util.sendMessage(message.channel, `${util.fixNameFormat(target.displayName)} did not respond within 60 seconds. The tic tac toe game has been cancelled.`);
                                message.reactions.removeAll();
                            }
                        });
                    });
            });
    }
}

const TTT_BOARD_HEIGHT = 3;
const TTT_BOARD_WIDTH = 3;
const TTT_PLAYER_ONE = '❌';
const TTT_PLAYER_TWO = '⭕';
const TTT_REACTIONS = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const TTT_TIMEOUT = 60000; // 60 seconds

startTTTGame = (bot, channel, challenger, target) => {
    if (TTTGameActive) {
        util.sendTimedMessage(message.channel, `Sorry ${util.fixNameFormat(challenger.displayName)} and ${util.fixNameFormat(target.displayName)}, I can only handle one game at a time. Please wait until that finishes.`);
        return;
    }
    TTTGameActive = true;
    const board = [...TTT_REACTIONS];

    let turn = Math.floor(Math.random() * 2);
    let player = turn ? challenger : target;
    let piece = turn ? TTT_PLAYER_ONE : TTT_PLAYER_TWO;

    util.sendMessage(channel, TTTGameEmbed(board, piece, null, 'Setting up the board...'))
        .then(message => gameMessage = message)
        .then(async (message) => { // populate with reactions
            for (let i = 1; i <= 9; i++) {
                await message.react(TTT_REACTIONS[i]);
            }
            return message;
        })
        .then((gameMessage) => nextTTTTurn(gameMessage, board, turn, challenger, target, null));
}

nextTTTTurn = (message, board, turn, challenger, target, previousMove) => {
    player = turn ? challenger : target;
    piece = turn ? TTT_PLAYER_ONE : TTT_PLAYER_TWO;
    message.edit(TTTGameEmbed(board, piece, player, null, previousMove))
        .then((message) => {
            message.awaitReactions((reaction, user) => {
                return user.id === player.id && TTT_REACTIONS.includes(reaction.emoji.name);
            }, { time: TTT_TIMEOUT, max: 1 })
                .then((collected) => {
                    const reaction = collected.first();
                    if (!reaction) {
                        message.edit(new Discord.MessageEmbed()
                            .setTitle(`Tic Tac Toe game ended!`)
                            .setDescription(`${TTT_PLAYER_ONE} ${util.fixNameFormat(challenger.displayName)} vs. ${TTT_PLAYER_TWO} ${util.fixNameFormat(target.displayName)}\n\n${TTTBoardToString(board)}\n${util.fixNameFormat(player.displayName)} did not make a move within 60 seconds!\n${util.fixNameFormat(player.displayName)} has lost tic tac toe! **YIKES!**`)
                            .setColor(Colors.DARK_GREEN));
                        message.reactions.removeAll();
                        TTTGameActive = false;
                        return;
                    }
                    let column = TTT_REACTIONS.findIndex(element => reaction.emoji.name === element); // 1 to BOARD_WIDTH
                    let placed = TTTPut(board, column, piece);
                    reaction.users.remove(reaction.users.cache.filter(user => user.id === message.author.id).first().id);
                    reaction.users.remove(reaction.users.cache.filter(user => user.id !== message.author.id).first().id)
                        .then(() => {
                            if (placed && TTTWinnerCheck(board, column)) {
                                message.edit(new Discord.MessageEmbed()
                                    .setTitle(`Tic Tac Toe game ended!`)
                                    .setDescription(`${TTT_PLAYER_ONE} ${util.fixNameFormat(challenger.displayName)} vs. ${TTT_PLAYER_TWO} ${util.fixNameFormat(target.displayName)}\n\n${TTTBoardToString(board)}\n${util.fixNameFormat((turn ? target: challenger).displayName)} has lost tic tac toe! **YIKES!**`)
                                    .setColor(Colors.DARK_GREEN))
                                message.reactions.removeAll()
                                TTTGameActive = false;
                                return;
                            } else if (placed && TTTTieCheck(board)) {
                                message.edit(new Discord.MessageEmbed()
                                    .setTitle(`Tic Tac Toe game ended!`)
                                    .setDescription(`${TTT_PLAYER_ONE} ${util.fixNameFormat(challenger.displayName)} vs. ${TTT_PLAYER_TWO} ${util.fixNameFormat(target.displayName)}\n\n${TTTBoardToString(board)}\nThe game ended in a draw!`)
                                    .setColor(Colors.DARK_GREEN))
                                message.reactions.removeAll();
                                TTTGameActive = false;
                                return;
                            }
                            if (placed) {
                                turn = !turn;
                                nextTTTTurn(message, board, turn, challenger, target, `${piece} ${util.fixNameFormat(player.displayName)} placed a piece in position ${reaction.emoji.name}.`);
                            } else {
                                nextTTTTurn(message, board, turn, challenger, target, `${piece} ${util.fixNameFormat(player.displayName)} attempted to place a piece in full position ${reaction.emoji.name}.`);
                            }
                        });
                });
        });
}

/**
 * Gets the game embed.
 * @param {Array} board the connect4 board
 * @param {String} piece the current player
 * @param {Discord.GuildMember} member the current player's guild member object
 * @param {String} override optional, to override the description
 */
TTTGameEmbed = (board, piece, member, override, previousMove) => {
    return new Discord.MessageEmbed()
        .setTitle(`Playing Tic Tac Toe`)
        .setThumbnail(member ? member.user.displayAvatarURL({ dynamic: true }) : '')
        .setDescription(override ? override : `${previousMove ? `${previousMove}\n` : ""}It is ${piece} ${util.fixNameFormat(member.displayName)}'s turn.\n\n${TTTBoardToString(board)}`)
        .setColor(Colors.GREEN);
}

/**
 * Returns the board in String format.
 * @param {Array} board the board to be turned into String format
 * @returns {String} the board in String form
 */
TTTBoardToString = (board) => {
    let result = "";
    for (let i = 0; i < TTT_BOARD_HEIGHT; i++) {
        for (let j = 1; j <= TTT_BOARD_WIDTH; j++) {
            result += board[i * TTT_BOARD_WIDTH + j];
        }
        if (i < TTT_BOARD_HEIGHT) {
            result += '\n';
        }
    }
    return result;
}

/**
 * Puts the piece in the space, if possible.
 * @param {Array} board the board to be affected
 * @param {number} position the board position to place the piece (1-9)
 * @param {String} piece the piece to put
 * @returns {boolean} true if the piece was successfully placed
 */
TTTPut = (board, position, piece) => {
    if (board[position] !== TTT_PLAYER_ONE && board[position] !== TTT_PLAYER_TWO) {
        board[position] = piece;
        return true;
    }
    return false;
}


/**
 * Checks for a winner.
 * @param {Array} board the board to be checked
 * @param {number} position the column number of the most recent placed piece (1-9)
 */
TTTWinnerCheck = (board, position) => {
    // Horizontal Check
    let row = (Math.floor((position - 1) / 3) * 3) + 1; // 1-3
    if (board[row] === board[row + 1] && board[row + 1] === board[row + 2]) {
        return true;
    }

    // Vertical Check
    let column = (position % 3); // 1-3
    if (column === 0) {
        column = 3;
    }
    if (board[column] === board[column + 3] && board[column + 3] === board[column + 6]) {
        return true;
    }

    // Ascending Diagonal
    if (position === 7 || position === 5 || position === 3) {
        if (board[7] === board[5] && board[5] === board[3]) {
            return true;
        }
    }

    // Descending Diagonal
    if (position === 1 || position === 5 || position === 9) {
        if (board[1] === board[5] && board[5] === board[9]) {
            return true;
        }
    }
    return false;
}

/**
 * Checks the board for a tie.
 * @param {Array} board the board to check
 * @returns {boolean} true if the board is in a draw
 */
TTTTieCheck = (board) => {
    for (let i = 1; i <= TTT_BOARD_WIDTH * TTT_BOARD_WIDTH; i++) {
        if (TTTIsEmpty(board[i])) {
            return false;
        }
    }
    return true;
}

/**
 * Checks if the piece is an empty piece or not
 * @param {string} piece the piece occupying the position to check
 * @returns {boolean} true if the piece is an empty piece
 */
TTTIsEmpty = (piece) => {
    return piece !== TTT_PLAYER_ONE && piece !== TTT_PLAYER_TWO;
}