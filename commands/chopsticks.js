const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

var ChopsticksGameActive;

module.exports = {
    name: ["chopsticks", "ch"],
    description: "Play chopsticks with a friend!",
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
        if (ChopsticksGameActive) {
            util.safeDelete(message);
            util.sendTimedMessage(message.channel, "Sorry, I can only handle one game at a time. Please wait until that finishes.");
            return;
        }
        let challenger = message.member;
        util.sendMessage(message.channel, `<@${target.id}>, ${util.fixNameFormat(challenger.displayName)} challenges you to a game of chopsticks! Do you accept?`)
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
                                startChopsticksGame(bot, message.channel, challenger, target);
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

const CHOPSTICKS_REACTIONS = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
const CHOPSTICKS_TIMEOUT = 60000; // 60 seconds

startChopsticksGame = (bot, channel, challenger, target) => {
    if (ChopsticksGameActive) {
        util.sendTimedMessage(message.channel, `Sorry ${util.fixNameFormat(challenger.displayName)} and ${util.fixNameFormat(target.displayName)}, I can only handle one game at a time. Please wait until that finishes.`);
        return;
    }
    ChopsticksGameActive = true;
    const state = [1, 1, 1, 1];

    let turn = Math.floor(Math.random() * 2);

    util.sendMessage(channel, chopsticksGetSetupEmbed())
        .then(message => gameMessage = message)
        .then(async (message) => { // populate with reactions
            for (let i = 1; i <= 8; i++) {
                await message.react(CHOPSTICKS_REACTIONS[i]);
            }
            return message;
        })
        .then((gameMessage) => nextChopsticksTurn(gameMessage, state, turn, challenger, target, null));
}

nextChopsticksTurn = (gameMessage, state, turn, challenger, target, previousMove) => {
    let attacker = turn ? challenger : target;
    let defender = turn ? target : challenger;

    console.log("Attacker: " + attacker.displayName);
    console.log("Defender: " + defender.displayName);
    console.log("turn " + turn);
    // Perform win check

    // Calculate available moves
    console.log("Calculating moves with " + state);
    let moves = getAvailableChopsticksMoves(state, turn);
    console.log("Moves calculated.." + moves);

    // Update the display
    gameMessage.edit(chopsticksGameEmbed(state, attacker, defender, challenger, target, null, previousMove, moves, turn)).then(message => {
        message.awaitReactions((reaction, user) => {
            return user.id === attacker.id && CHOPSTICKS_REACTIONS.includes(reaction.emoji.name);
        }, { time: CHOPSTICKS_TIMEOUT, max: 1 })
            .then((collected) => {
                const reaction = collected.first();
                if (!reaction) {
                    message.edit(new Discord.MessageEmbed()
                        .setTitle(`Chopsticks game ended!`)
                        .setDescription(`${util.fixNameFormat(challenger.displayName)} vs.${util.fixNameFormat(target.displayName)}\n${util.fixNameFormat(attacker.displayName)} did not make a move within 60 seconds!\n${util.fixNameFormat(attacker.displayName)} has lost!`)
                        .addField(util.fixNameFormat(target.displayName) + "'s hands", numberToHand(state[0], target) + " " + numberToHand(state[1], target))
                        .addField(util.fixNameFormat(challenger.displayName) + "'s hands", numberToHand(state[2], challenger) + " " + numberToHand(state[3], challenger))
                        .setColor(Colors.DARK_GREEN));
                    message.reactions.removeAll();
                    ChopsticksGameActive = false;
                    return;
                }

                let moveIndex = CHOPSTICKS_REACTIONS.findIndex(element => reaction.emoji.name === element); // 1 to 8
                let previousMove = makeChopstickMove(state, moves, moveIndex, attacker, defender, turn);
                reaction.users.remove(reaction.users.cache.filter(user => user.id === attacker.id).first().id)
                    .then(() => {
                        if (previousMove && chopSticksWinnerCheck(state)) {
                            message.edit(new Discord.MessageEmbed()
                                .setTitle(`Chopsticks game ended!`)
                                .setDescription(`${util.fixNameFormat(challenger.displayName)} vs. ${util.fixNameFormat(target.displayName)}\n${util.fixNameFormat((turn ? target: challenger).displayName)} has lost chopsticks!`)
                                .addField(util.fixNameFormat(target.displayName) + "'s hands", numberToHand(state[0], target) + " " + numberToHand(state[1], target))
                                .addField(util.fixNameFormat(challenger.displayName) + "'s hands", numberToHand(state[2], challenger) + " " + numberToHand(state[3], challenger))
                                .setColor(Colors.DARK_GREEN))
                            message.reactions.removeAll()
                            ChopsticksGameActive = false;
                            return;
                        }
                        if (previousMove) {
                            turn = !turn;
                            nextChopsticksTurn(gameMessage, state, turn, challenger, target, previousMove);
                        } else {
                            nextChopsticksTurn(gameMessage, state, turn, challenger, target, "That move is not available. Please try again.");
                        }
                    });
            });
    })
}

chopSticksWinnerCheck = (state) => {
    return state[0] === 0 && state[1] === 0 || state[2] === 0 && state[3] === 0;
}

makeChopstickMove = (state, moves, moveIndex, attacker, defender, turn) => {
    let attackerLHIdx, attackerRHIdx, defenderLHIdx, defenderRHIdx;
    if (turn) {
        attackerLHIdx = 0;
        attackerRHIdx = 1;
        defenderLHIdx = 2;
        defenderRHIdx = 3;
    } else {
        attackerLHIdx = 2;
        attackerRHIdx = 3;
        defenderLHIdx = 0;
        defenderRHIdx = 1;
    }

    if (moves[moveIndex - 1] === null) {
        return "";
    }

    let rnd = Math.floor(Math.random() * 2);

    let result, ret;
    switch(moveIndex) {
        case 1:
            result = state[attackerLHIdx] + state[defenderLHIdx];
            ret = `${util.fixNameFormat(attacker.displayName)} LH (${state[attackerLHIdx]}) hit ${util.fixNameFormat(defender.displayName)}'s LH (${state[defenderLHIdx]})!`;
            if (result >= 5) {
                state[defenderLHIdx] = 0;
            } else {
                state[defenderLHIdx] = result;
            }
            break;
        case 2:
            result = state[attackerLHIdx] + state[defenderRHIdx];
            ret = `${util.fixNameFormat(attacker.displayName)} LH (${state[attackerLHIdx]}) hit ${util.fixNameFormat(defender.displayName)}'s RH (${state[defenderRHIdx]})!`;
            if (result >= 5) {
                state[defenderRHIdx] = 0;
            } else {
                state[defenderRHIdx] = result;
            }
            break;
        case 3:
            result = state[attackerRHIdx] + state[defenderLHIdx];
            ret = `${util.fixNameFormat(attacker.displayName)} RH (${state[attackerRHIdx]}) hit ${util.fixNameFormat(defender.displayName)}'s LH (${state[defenderLHIdx]})!`;
            if (result >= 5) {
                state[defenderLHIdx] = 0;
            } else {
                state[defenderLHIdx] = result;
            }
            break;
        case 4:
            result = state[attackerRHIdx] + state[attackerRHIdx];
            ret = `${util.fixNameFormat(attacker.displayName)} RH (${state[attackerRHIdx]}) hit ${util.fixNameFormat(defender.displayName)}'s RH (${state[defenderRHIdx]})!`;
            if (result >= 5) {
                state[attackerRHIdx] = 0;
            } else {
                state[attackerRHIdx] = result;
            }
            break;
        case 5:
            switch (moves[4]) {
                case ChopsticksMoves.Split11:
                    state[attackerLHIdx] = 1;
                    state[attackerRHIdx] = 1;
                    ret = `${util.fixNameFormat(attacker.displayName)} split their hand to 1-1!`;
                    break;
                case ChopsticksMoves.Split12:
                    if (rnd) {
                        state[attackerLHIdx] = 1;
                        state[attackerRHIdx] = 2;
                    } else {
                        state[attackerLHIdx] = 2;
                        state[attackerRHIdx] = 1;
                    }
                    ret = `${util.fixNameFormat(attacker.displayName)} split their hand to ${state[attackerLHIdx]}-${state[attackerRHIdx]}!`;
                    break;
                case ChopsticksMoves.Split22:
                    state[attackerLHIdx] = 2;
                    state[attackerRHIdx] = 2;
                    ret = `${util.fixNameFormat(attacker.displayName)} split their hand to 2-2!`;
                    break;
                default:
                    throw 'Unhandled case!';
            }
            break;
        case 6:
            switch (moves[5]) {
                case ChopsticksMoves.Split13:
                    if (rnd) {
                        state[attackerLHIdx] = 1;
                        state[attackerRHIdx] = 3;
                    } else {
                        state[attackerLHIdx] = 3;
                        state[attackerRHIdx] = 1;
                    }
                    ret = `${util.fixNameFormat(attacker.displayName)} split their hand to ${state[attackerLHIdx]}-${state[attackerRHIdx]}!`;
                    break;
                default:
                    throw 'Unhandled case!';
            }
            break;
        case 7:
            switch(moves[6]) {
                case ChopsticksMoves.Merge02:
                    if (rnd) {
                        state[attackerLHIdx] = 0;
                        state[attackerRHIdx] = 2;
                    } else {
                        state[attackerLHIdx] = 2;
                        state[attackerRHIdx] = 0;
                    }
                    ret = `${util.fixNameFormat(attacker.displayName)} merged their hand to ${state[attackerLHIdx]}-${state[attackerRHIdx]}!`;
                    break;
                case ChopsticksMoves.Merge03:
                    if (rnd) {
                        state[attackerLHIdx] = 0;
                        state[attackerRHIdx] = 3;
                    } else {
                        state[attackerLHIdx] = 3;
                        state[attackerRHIdx] = 0;
                    }
                    ret = `${util.fixNameFormat(attacker.displayName)} merged their hand to ${state[attackerLHIdx]}-${state[attackerRHIdx]}!`;
                    break;
                case ChopsticksMoves.Merge04:
                    if (rnd) {
                        state[attackerLHIdx] = 0;
                        state[attackerRHIdx] = 4;
                    } else {
                        state[attackerLHIdx] = 4;
                        state[attackerRHIdx] = 0;
                    }
                    ret = `${util.fixNameFormat(attacker.displayName)} merged their hand to ${state[attackerLHIdx]}-${state[attackerRHIdx]}!`;
                    break;
            }
            break;
        case 8:
            switch(moves[7]) {
                case ChopsticksMoves.Transfer22:
                    state[attackerLHIdx] = 0;
                    state[attackerRHIdx] = 4;
                    break;
                case ChopsticksMoves.Transfer13:
                    if (rnd) {
                        state[attackerLHIdx] = 1;
                        state[attackerRHIdx] = 3;
                    } else {
                        state[attackerLHIdx] = 3;
                        state[attackerRHIdx] = 1;
                    }
                    break;
                case ChopsticksMoves.Transfer14:
                    if (rnd) {
                        state[attackerLHIdx] = 1;
                        state[attackerRHIdx] = 4;
                    } else {
                        state[attackerLHIdx] = 4;
                        state[attackerRHIdx] = 1;
                    }
                    break;
                case ChopsticksMoves.Transfer23:
                    if (rnd) {
                        state[attackerLHIdx] = 2;
                        state[attackerRHIdx] = 3;
                    } else {
                        state[attackerLHIdx] = 3;
                        state[attackerRHIdx] = 2;
                    }
                    break;
                case ChopsticksMoves.Transfer33:
                    state[attackerLHIdx] = 3;
                    state[attackerRHIdx] = 3;
                    break;
                case ChopsticksMoves.Transfer24:
                    if (rnd) {
                        state[attackerLHIdx] = 2;
                        state[attackerRHIdx] = 4;
                    } else {
                        state[attackerLHIdx] = 4;
                        state[attackerRHIdx] = 2;
                    }
                    break;
            }
            ret = `${util.fixNameFormat(attacker.displayName)} transfered some fingers to ${state[attackerLHIdx]}-${state[attackerRHIdx]}!`;
            break;
    }
    return ret;
}

chopsticksGameEmbed = (state, attacker, defender, top, bottom, override, previousMove, moves, turn) => {
    return new Discord.MessageEmbed()
        .setTitle(`Playing Chopsticks`)
        .setThumbnail(attacker ? attacker.user.displayAvatarURL({ dynamic: true }) : '')
        .setDescription(override ? override : `${previousMove ? `${previousMove}\n` : ""}It is ${util.fixNameFormat(attacker.displayName)}'s ${attacker === defender ? (turn ? "(top) " : "(bottom) ") : ""}turn.`)
        .addField(util.fixNameFormat(top.displayName) + "'s hands", numberToHand(state[0], top) + " " + numberToHand(state[1], top))
        .addField(util.fixNameFormat(bottom.displayName) + "'s hands", numberToHand(state[2], bottom) + " " + numberToHand(state[3], bottom))
        .addField("Available moves", chopsticksMovesToWords(moves, defender, turn, state))
        .setColor(Colors.GREEN);
}

chopsticksMovesToWords = (moves, defender, turn, state) => {
    let opponent = util.fixNameFormat(defender.displayName);

    if (turn) {
        attackerLHIdx = 0;
        attackerRHIdx = 1;
        defenderLHIdx = 2;
        defenderRHIdx = 3;
    } else {
        attackerLHIdx = 2;
        attackerRHIdx = 3;
        defenderLHIdx = 0;
        defenderRHIdx = 1;
    }
    
    let result = "" + 
    CHOPSTICKS_REACTIONS[1] + ": " + (moves[0] ? `Attack ${opponent}'s LH (${state[defenderLHIdx]}) with your LH (${state[attackerLHIdx]}).` : ":x: Not available.") + "\n" +
    CHOPSTICKS_REACTIONS[2] + ": " + (moves[1] ? `Attack ${opponent}'s RH (${state[defenderRHIdx]}) with your LH (${state[attackerLHIdx]}).` : ":x: Not available.") + "\n" +
    CHOPSTICKS_REACTIONS[3] + ": " + (moves[2] ? `Attack ${opponent}'s LH (${state[defenderLHIdx]}) with your RH (${state[attackerRHIdx]}).` : ":x: Not available.") + "\n" +
    CHOPSTICKS_REACTIONS[4] + ": " + (moves[3] ? `Attack ${opponent}'s RH (${state[defenderRHIdx]}) with your RH (${state[attackerRHIdx]}).` : ":x: Not available.") + "\n";

    // Split moves.
    if (moves[4]) {
        switch(moves[4]) {
            case ChopsticksMoves.Split11:
                result += `${CHOPSTICKS_REACTIONS[5]}: Split your hands to 1-1.` + "\n";
                result += CHOPSTICKS_REACTIONS[6] + ": :x: Not available." + "\n";
                break;
            case ChopsticksMoves.Split12:
                result += `${CHOPSTICKS_REACTIONS[5]}: Split your hands to 1-2.` + "\n";
                result += CHOPSTICKS_REACTIONS[6] + ": :x: Not available." + "\n";
                break;
            case ChopsticksMoves.Split22:
                result += `${CHOPSTICKS_REACTIONS[5]}: Split your hands to 2-2.\n${CHOPSTICKS_REACTIONS[6]}: Split your hands to 1-3.\n`;
                break;
        }
    } else {
        result += CHOPSTICKS_REACTIONS[5] + ": :x: Not available." + "\n";
        result += CHOPSTICKS_REACTIONS[6] + ": :x: Not available." + "\n";
    }

    // Merge moves.
    if (moves[6]) {
        switch(moves[6]) {
            case ChopsticksMoves.Merge02:
                result += `${CHOPSTICKS_REACTIONS[7]}: Merge your hands to 0-2` + "\n";
                break;
            case ChopsticksMoves.Merge03:
                result += `${CHOPSTICKS_REACTIONS[7]}: Merge your hands to 0-3` + "\n";
                break;
            case ChopsticksMoves.Merge04:
                result += `${CHOPSTICKS_REACTIONS[7]}: Merge your hands to 0-4` + "\n";
                break;
        }
    } else {
        result += CHOPSTICKS_REACTIONS[7] + ": :x: Not available." + "\n";
    }

    // Transfer moves.
    if (moves[7]) {
        switch(moves[7]) {
            case ChopsticksMoves.Transfer22:
                result += `${CHOPSTICKS_REACTIONS[8]}: Transfer some fingers to 2-2`;
                break;
            case ChopsticksMoves.Transfer13:
                result += `${CHOPSTICKS_REACTIONS[8]}: Transfer some fingers to 2-2`;
                break;
            case ChopsticksMoves.Transfer14:
                result += `${CHOPSTICKS_REACTIONS[8]}: Transfer some fingers to 1-4`;
                break;
            case ChopsticksMoves.Transfer23:
                result += `${CHOPSTICKS_REACTIONS[8]}: Transfer some fingers to 2-3`;
                break;
            case ChopsticksMoves.Transfer33:
                result += `${CHOPSTICKS_REACTIONS[8]}: Transfer some fingers to 3-3`;
                break;
            case ChopsticksMoves.Transfer24:
                result += `${CHOPSTICKS_REACTIONS[8]}: Transfer some fingers to 2-4`;
                break;
        }
    } else {
        result += CHOPSTICKS_REACTIONS[8] + ": :x: Not available.";
    }
    return result;
}

const ChopsticksMoves = {
    // When attacking, each of your hands can attack either of the opponent's hands.
    OurLHAttacksOpponentLH: 1,
    OurLHAttacksOpponentRH: 2,
    OurRHAttacksOpponentLH: 3,
    OurRHAttacksOpponentRH: 4,

    // When splitting. Splitting 1 hand into two hands.
    // 1. One hand has value of 2. Only 1 way to split: 1-1.
    Split11: 5,
    // 2. One hand has value of 3. Only 1 way to split: 1-2 (or 2-1 but they're the same).
    Split12: 6,
    // 3. One hand has value of 4. Two ways to split: 2-2 and 1-3.
    Split22: 7,
    Split13: 8,

    // Merging hands. The result is that one of the hands will become inactive.
    // 1. Both hands have combined value of 2 (1-1). Only one way to merge: 0-2.
    Merge02: 9,
    // 2. Both hands have combined value of 3 (1-2). Only one way to merge: 0-3.
    Merge03: 10,
    // 3. Both hands have combined value of 4 (2-2, 1-3). Only one way to merge: 0-4. 
    Merge04: 11,

    // Transfer fingers from one hand to another.
    // 1. Both hands have combined value of 4. Can toggle between 2-2 and 1-3.
    Transfer22: 12,
    Transfer13: 13,
    // 2. Both hands have combined value of 5. Can toggle between 1-4 and 2-3.
    Transfer14: 14,
    Transfer23: 15,
    // 3. Both hands have combined value of 6. Can toggle between 3-3 and 2-4.
    Transfer33: 16,
    Transfer24: 17,
    // 4. Both hands have combined value of 7. Toggling between 3-4 and 4-3 is not allowed.
}

getAvailableChopsticksMoves = (state, turn) => {
    let attackerLH, attackerRH, defenderLH, defenderRH;
    if (turn) {
        attackerLH = state[0];
        attackerRH = state[1];
        defenderLH = state[2];
        defenderRH = state[3];
    } else {
        attackerLH = state[2];
        attackerRH = state[3];
        defenderLH = state[0];
        defenderRH = state[1];
    }
    let combinedValue = attackerLH + attackerRH;

    // Values containing what moves are available. If none of that category are available, then null.
    // 0-3: Attacking moves
    // 4-5: Splitting moves
    //   6: Merge moves
    //   7: Transfer moves
    let availableMoves = new Array(8).fill(null);

    // Attacking moves.
    if (attackerLH && defenderLH) {
        availableMoves[0] = ChopsticksMoves.OurLHAttacksOpponentLH;
    }

    if (attackerLH && defenderRH) {
        availableMoves[1] = ChopsticksMoves.OurLHAttacksOpponentRH;
    }

    if (attackerRH && defenderLH) {
        availableMoves[2] = ChopsticksMoves.OurRHAttacksOpponentLH;
    }

    if (attackerRH && defenderRH) {
        availableMoves[3] = ChopsticksMoves.OurRHAttacksOpponentRH;
    }

    // Splitting moves. Can only split if one of the hands is empty.
    if (!attackerLH || !attackerRH) {
        switch (combinedValue) {
            case 2:
                availableMoves[4] = ChopsticksMoves.Split11;
                break;
            case 3:
                availableMoves[4] = ChopsticksMoves.Split12;
                break;
            case 4:
                availableMoves[4] = ChopsticksMoves.Split22;
                availableMoves[5] = ChopsticksMoves.Split13;
                break;
        }
    }

    // Merging moves. Both hands must be active for this.
    if (attackerLH && attackerRH) {
        switch (combinedValue) {
            case 2:
                availableMoves[6] = ChopsticksMoves.Merge02;
                break;
            case 3:
                availableMoves[6] = ChopsticksMoves.Merge03;
                break;
            case 4:
                availableMoves[6] = ChopsticksMoves.Merge04;
                break;
        }
    }

    // Transfer moves. Both hands must be active for this.
    if (attackerLH && attackerRH) {
        switch (combinedValue) {
            case 4:
                if (attackerLH === 2) {
                    availableMoves[7] = ChopsticksMoves.Transfer13;
                } else {
                    availableMoves[7] = ChopsticksMoves.Transfer22;
                }
                break;
            case 5:
                if (attackerLH === 1 || attackerLH === 4) {
                    availableMoves[7] = ChopsticksMoves.Transfer23;
                } else {
                    availableMoves[7] = ChopsticksMoves.Transfer14;
                }
                break;
            case 6:
                if (attackerLH === 3) {
                    availableMoves[7] = ChopsticksMoves.Transfer24;
                } else {
                    availableMoves[7] = ChopsticksMoves.Transfer33;
                }
                break;
        }
    }
    return availableMoves;
}

// in the future, allow members to choose their own symbols, maybe as an upgrade?
numberToHand = (value, member) => {
    switch (value) {
        case 0:
            return ":fist:";
        case 1:
            return ":point_up:";
        case 2:
            return ":v:";
        case 3:
            return "<:threefingers:1059631066798903397>";
        case 4:
            return "<:fourfingers:1059631915897995436>";
        default:
            throw 'Unhandled case!!';
    }
}

// /**
//  * Gets the game embed.
//  * @param {Array} board the connect4 board
//  * @param {String} piece the current player
//  * @param {Discord.GuildMember} member the current player's guild member object
//  * @param {String} override optional, to override the description
//  */
//  TTTGameEmbed = (board, piece, member, override, previousMove) => {
//     return new Discord.MessageEmbed()
//         .setTitle(`Playing Tic Tac Toe`)
//         .setThumbnail(member ? member.user.displayAvatarURL({ dynamic: true }) : '')
//         .setDescription(override ? override : `${previousMove ? `${previousMove}\n` : ""}It is ${piece} ${util.fixNameFormat(member.displayName)}'s turn.\n\n${TTTBoardToString(board)}`)
//         .setColor(Colors.GREEN);
// }

chopsticksGetSetupEmbed = () => {
    return new Discord.MessageEmbed()
        .setTitle('Setting up the board...')
        .setDescription('Please wait...')
        .setColor(Colors.GREEN);
}
