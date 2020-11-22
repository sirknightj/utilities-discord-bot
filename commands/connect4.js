const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');
const { trimEnd } = require('ffmpeg-static');

module.exports = {
    name: ["connect4", "4inarow"],
    description: "Play connect 4 with a friend!",
    usage: "<opponent>",
    requiresTarget: true,

    async execute(bot, message, args, target) {
        if (!message.channel.permissionsFor(message.guild.me).has("ADD_REACTIONS")) {
            util.sendMessage(`Missing required permission: 'ADD_REACTIONS'`);
            return;
        }
        if (!message.channel.permissionsFor(message.guild.me).has("MANAGE_MESSAGES")) {
            util.sendMessage(`Missing required permission: 'MANAGE_MESSAGES'`);
            return;
        }
        let challenger = message.member;
        util.sendMessage(message.channel, `<@${target.id}>, ${challenger.displayName} challenges you to a game of connect 4! Do you accept?`)
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
                                startGame(bot, message.channel, challenger, target);
                            } else {
                                util.sendMessage(message.channel, `${target.displayName} has declined your challenge.`);
                            }
                        });
                        collector.on('end', collected => {
                            if (collected.size === 0) {
                                util.sendMessage(message.channel, `${target.displayName} did not respond within 60 seconds. The connect 4 game has been cancelled.`);
                            }
                        });
                    });
            });
    }
}

const BOARD_HEIGHT = 6;
const BOARD_WIDTH = 7;
const EMPTY_CELL = '⚪';
const PLAYER_ONE = '🔴';
const WINNER_ONE = '🟠';
const PLAYER_TWO = '🔵';
const WINNER_TWO = '🟣';
const reactions = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];
const timeout = 60000; // 60 seconds

startGame = (bot, channel, challenger, target) => {
    const board = [];
    for (let i = 0; i < BOARD_HEIGHT * BOARD_WIDTH; i++) {
        board[i] = EMPTY_CELL;
    }

    let turn = Math.floor(Math.random() * 2);
    let player = turn ? challenger : target;
    let piece = turn ? PLAYER_ONE : PLAYER_TWO;

    util.sendMessage(channel, gameEmbed(board, piece, null, 'Setting up the board...'))
        .then(message => gameMessage = message)
        .then(async (message) => { // populate with reactions
            for (let i = 1; i <= BOARD_WIDTH; i++) {
                if (!isColFull(board, i)) {
                    await message.react(reactions[i]);
                }
            }
            return message;
        })
        .then((gameMessage) => nextTurn(gameMessage, board, turn, challenger, target, null));
}

nextTurn = (message, board, turn, challenger, target, previousMove) => {
    player = turn ? challenger : target;
    piece = turn ? PLAYER_ONE : PLAYER_TWO;
    message.edit(gameEmbed(board, piece, player, null, previousMove))
        .then((message) => {
            message.awaitReactions((reaction, user) => {
                return user.id === player.id && reactions.includes(reaction.emoji.name);
            }, { time: timeout, max: 1 })
                .then((collected) => {
                    const reaction = collected.first();
                    if (!reaction) {
                        message.edit(new Discord.MessageEmbed()
                            .setTitle(`Connect 4 game ended!`)
                            .setDescription(`${PLAYER_ONE} ${challenger.displayName} vs. ${PLAYER_TWO} ${target.displayName}\n
                                ${boardToString(board)}
                                ${player.displayName} did not make a move within 60 seconds! They have lost!`)
                            .setColor(Colors.DARK_GREEN));
                        message.reactions.removeAll();
                        return;
                    }
                    let column = reactions.findIndex(element => reaction.emoji.name === element); // 1 to BOARD_WIDTH
                    put(board, column, piece);
                    reaction.users.remove(reaction.users.cache.filter(user => user.id !== message.author.id).first().id)
                        .then(() => {
                            if (winnerCheck(board, column)) {
                                message.edit(new Discord.MessageEmbed()
                                    .setTitle(`Connect 4 game ended!`)
                                    .setDescription(`${PLAYER_ONE} ${challenger.displayName} vs. ${PLAYER_TWO} ${target.displayName}\n
                                ${boardToString(board)}
                                ${player.displayName} is the winner!`)
                                    .setColor(Colors.DARK_GREEN))
                                message.reactions.removeAll()
                                    .then(() => {
                                        setTimeout(() => {
                                            message.edit(new Discord.MessageEmbed()
                                                .setTitle(`Connect 4 game ended!`)
                                                .setDescription(`${PLAYER_ONE} ${challenger.displayName} vs. ${PLAYER_TWO} ${target.displayName}\n
                                        ${boardToString(board, true)}
                                        ${piece} ${player.displayName} is the winner!`)
                                                .setColor(Colors.DARK_GREEN))
                                        }, 7500);
                                    });

                                return;
                            }
                            turn = !turn;
                            nextTurn(message, board, turn, challenger, target, `${piece} ${player.displayName} placed a piece in column ${reaction.emoji.name}.`);
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
gameEmbed = (board, piece, member, override, previousMove) => {
    return new Discord.MessageEmbed()
        .setTitle(`Playing Connect 4`)
        .setThumbnail(member ? member.user.displayAvatarURL({ dynamic: true }) : '')
        .setDescription(override ? override : `${previousMove ? `${previousMove}\n` : ""}It is ${piece} ${member.displayName}'s turn.\n\n${boardToString(board)}${reactionsToString(reactions)}`)
        .setColor(Colors.GREEN);
}

/**
 * Returns the board in String format.
 * @param {Array} board the board to be turned into String format
 * @param {boolean} replace true if the pieces need to be replaced back to their original form
 * @returns {String} the board in String form
 */
boardToString = (board, replace) => {
    let result = "";
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        for (let j = 0; j < BOARD_WIDTH; j++) {
            if (replace) {
                if (board[getAbsolutePosition(i, j)] === WINNER_ONE) {
                    result += PLAYER_ONE + ' ';
                } else if (board[getAbsolutePosition(i, j)] === WINNER_TWO) {
                    result += PLAYER_TWO + ' ';
                } else {
                    result += board[getAbsolutePosition(i, j)] + ' ';
                }
            } else {
                result += board[getAbsolutePosition(i, j)] + ' ';
            }
        }
        result += '\n';
    }
    return result;
}

reactionsToString = () => {
    let result = "";
    for (let i = 1; i <= BOARD_WIDTH; i++) {
        result += reactions[i] + ' ';
    }
    return result;
}

/**
 * Puts the piece in the column.
 * @param {Array} board the board to be affected
 * @param {column} number the column number (1 to BOARD_WIDTH)
 * @param {String} piece the piece to put
 * @returns {boolean} true if the piece was successfully placed
 */
put = (board, column, piece) => {
    for (let i = BOARD_HEIGHT; i > 0; i--) {
        if (board[getAbsolutePosition(i, column - 1)] === EMPTY_CELL) {
            board[getAbsolutePosition(i, column - 1)] = piece;
            return true;
        }
    }
    return false;
}

/**
 * Returns the index of the array of the specified piece.
 * @param {number} row the row number of the piece (0 to BOARD_HEIGHT - 1)
 * @param {number} column the column number of the piece (0 to BOARD_WIDTH - 1)
 * @returns {number} the array index of the row and column. -1 if out of bounds.
 */
getAbsolutePosition = (row, column) => {
    if (row < 0 || row >= BOARD_HEIGHT || column < 0 || column >= BOARD_WIDTH) {
        return -1;
    }
    return row * BOARD_WIDTH + column;
}

/**
 * Checks if the column is full.
 * @param {Array} board the board to be checked
 * @param {number} the column number (1 to BOARD_WIDTH)
 * @returns {boolean} true if the column is full.
 */
isColFull = (board, column) => {
    return board[getAbsolutePosition(BOARD_HEIGHT - 1, column - 1)] !== EMPTY_CELL;
}

/**
 * Checks for a winner.
 * @param {Array} board the board to be checked
 * @param {number} col the column number of the most recent placed piece (1 to BOARD_WIDTH)
 */
winnerCheck = (board, col) => {
    col--;
    let row;
    for (let i = BOARD_HEIGHT; i > 0; i--) {
        if (board[getAbsolutePosition(i - 1, col)] === EMPTY_CELL) {
            row = i;
            break;
        }
    }
    let winner = board[getAbsolutePosition(row, col)];
    if (winner === PLAYER_ONE) {
        winningSymbol = WINNER_ONE;
    } else {
        winningSymbol = WINNER_TWO;
    }

    // Vertical Check
    // You can only win connect 4 if your piece is on top of 3 others. Thus, no loop is necessessary.
    if (winner === board[getAbsolutePosition(row + 1, col)] && winner === board[getAbsolutePosition(row + 2, col)] && winner === board[getAbsolutePosition(row + 3, col)]) {
        board[getAbsolutePosition(row + 1, col)] = winningSymbol;
        board[getAbsolutePosition(row + 2, col)] = winningSymbol;
        board[getAbsolutePosition(row + 3, col)] = winningSymbol;
        board[getAbsolutePosition(row, col)] = winningSymbol;
        return true;
    }

    for (let i = 0; i < 4; i++) {
        // Horizontal Check
        if (board[getAbsolutePosition(row, col - 3 + i)] === board[getAbsolutePosition(row, col - 2 + i)] && board[getAbsolutePosition(row, col - 1 + i)] === board[getAbsolutePosition(row, col + i)] && board[getAbsolutePosition(row, col - 2 + i)] === board[getAbsolutePosition(row, col - 1 + i)]) {
            board[getAbsolutePosition(row, col - 3 + i)] = winningSymbol;
            board[getAbsolutePosition(row, col - 2 + i)] = winningSymbol;
            board[getAbsolutePosition(row, col - 1 + i)] = winningSymbol;
            board[getAbsolutePosition(row, col + i)] = winningSymbol;
            return true;
        }
        // Descending Diagonal Check (when looking at the boardToString, since it's flipped vertically)
        if (board[getAbsolutePosition(row - 3 + i, col - 3 + i)] === board[getAbsolutePosition(row - 2 + i, col - 2 + i)] && board[getAbsolutePosition(row - 1 + i, col - 1 + i)] === board[getAbsolutePosition(row + i, col + i)] && board[getAbsolutePosition(row - 2 + i, col - 2 + i)] === board[getAbsolutePosition(row - 1 + i, col - 1 + i)]) {
            board[getAbsolutePosition(row - 3 + i, col - 3 + i)] = winningSymbol;
            board[getAbsolutePosition(row - 2 + i, col - 2 + i)] = winningSymbol;
            board[getAbsolutePosition(row - 1 + i, col - 1 + i)] = winningSymbol;
            board[getAbsolutePosition(row + i, col + i)] = winningSymbol;
            return true;
        }
        // Ascending Diagonal Check
        if (board[getAbsolutePosition(row + 3 - i, col - 3 + i)] === board[getAbsolutePosition(row + 2 - i, col - 2 + i)] && board[getAbsolutePosition(row + 1 - i, col - 1 + i)] === board[getAbsolutePosition(row - i, col + i)] && board[getAbsolutePosition(row + 2 - i, col - 2 + i)] === board[getAbsolutePosition(row + 1 - i, col - 1 + i)]) {
            board[getAbsolutePosition(row + 3 - i, col - 3 + i)] = winningSymbol;
            board[getAbsolutePosition(row + 2 - i, col - 2 + i)] = winningSymbol;
            board[getAbsolutePosition(row + 1 - i, col - 1 + i)] = winningSymbol;
            board[getAbsolutePosition(row - i, col + i)] = winningSymbol;
            return true;
        }
    }
    return false;
}