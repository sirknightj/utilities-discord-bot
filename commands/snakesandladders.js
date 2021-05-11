const config = require('../config.json');
const util = require('../utilities');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ["snakesandladders", "sal", "chutesandladders", 'cal'],
    description: "Play snakes and ladders!",
    usage: "(optional: list of users to play with, excluding yourself)",

    execute(bot, message, args) {
        this.SNAKES_AND_LADDERS_TIMEOUT = 60000;
        this.INITIAL_SNAKES_AND_LADDERS_TIMEOUT = 30000;
        this.AUTOPLAY_DELAY = 2500;

        this.players = [message.member];
        if (args.length > 0) {
            while (args.length > 0) {
                let lookingFor = args.shift();
                let memberFound = util.getUserFromMention(message, lookingFor);
                if (memberFound) {
                    this.players.push(memberFound);
                } else {
                    util.sendMessage(message.channel, `Count not find user \`${lookingFor}\`!`);
                }
                if ((new Set(this.players)).size !== this.players.length) {
                    util.sendMessage(message.channel, `Duplicate user: \`${memberFound.displayName}\`!`);
                    this.players.pop();
                }
            }
        } else {
            this.players.push(message.guild.members.cache.get(bot.user.id));
        }

        if (this.players.length > 1) {
            let playerString = '';
            for (let player of this.players) {
                playerString += `${util.fixNameFormat(player.displayName)}\n`
            }
            util.sendMessage(message.channel, new Discord.MessageEmbed()
                .setTitle('Snakes and Ladders')
                .setDescription(`List of players:\n\n${playerString}\n**${util.fixNameFormat(message.member.displayName)}** is this correct?`)
                .setColor(Colors.BLUE)
                .setTimestamp()
            )
                .then(msg => {
                    msg.react('✅')
                        .then(() => {
                            msg.react('❌')
                        })
                        .then(() => {
                            const collector = msg.createReactionCollector((reaction, user) => {
                                return user.id === message.member.id;
                            }, { time: this.SNAKES_AND_LADDERS_TIMEOUT, max: 1 })

                            collector.on('collect', reaction => {
                                if (reaction.emoji.name === '✅') {
                                    msg.reactions.removeAll();
                                    this.startGame(bot, msg, message.channel, this.players);
                                } else {
                                    util.sendMessage(message.channel, 'Game cancelled!');
                                    msg.reactions.removeAll();
                                }
                            })

                            collector.on('end', collected => {
                                if (collected.size === 0) {
                                    util.sendMessage(message.channel, `Unfortunately, ${util.fixNameFormat(message.member.displayName)} did not press ✅ within ${this.SNAKES_AND_LADDERS_TIMEOUT / 1000} seconds. The game has been automatically aborted.`);
                                    msg.reactions.removeAll();
                                }
                            })
                        })
                })
        } else {
            util.sendMessage(message.channel, 'Unfortunately, you cannot play with just yourself.')
        }

        this.ladderSquares = new Map([
            [1, 38],
            [4, 14],
            [9, 31],
            [21, 42],
            [28, 84],
            [36, 44],
            [51, 67],
            [71, 91],
            [80, 100]
        ]);
        this.snakeSquares = new Map([
            [16, 6],
            [47, 26],
            [49, 11],
            [56, 53],
            [62, 19],
            [64, 60],
            [87, 24],
            [93, 73],
            [95, 75],
            [98, 78]
        ]);

        this.startGame = (bot, gameMessage, channel, players) => {
            this.positions = new Array(players.length).fill(0); // everyone starts on Square 0 (not on the board).
            this.autoPlay = new Array(players.length).fill(false); // everyone is by default not autoplaying.
            this.inGame = new Array(players.length).fill(true); // everyone is by default in the game.
            this.winnerOrder = [];

            // Determine the move order.
            // Shuffle players in-place using Durstenfeld shuffle algorithm
            for (let i = this.players.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                let temp = players[i];
                this.players[i] = players[j];
                this.players[j] = temp;
            }

            this.playerTurn = 0;
            this.turnCount = 0;
            gameMessage.edit(this.getGameEmbed(bot, players, this.positions, null, this.playerTurn, this.turnCount, this.autoPlay, this.inGame, this.winnerOrder))
                .then(msg => {
                    msg.react('↩️')
                        .then(() => {
                            msg.react('🔄')
                        })
                        .then(() => {
                            msg.react('❌')
                        })
                        .then(() => {
                            this.collector = msg.createReactionCollector((reaction, user) => {
                                if (reaction.emoji.name === '🔄') {
                                    return players.some(player => player.id === user.id && player.id !== bot.user.id);
                                }
                                return false;
                            }, { dispose: true })

                            this.collector.on('collect', (reaction, user) => {
                                let pos = players.map((member) => member.id).indexOf(user.id);
                                this.autoPlay[pos] = true;
                                util.sendTimedMessage(message.channel, `Autoplay enabled for ${util.fixNameFormat(user.username)}. If you enabled it after your turn has started, then you'll have to spin to end your turn.`, config.longer_delete_delay);
                            })

                            this.collector.on('remove', (reaction, user) => {
                                let pos = players.map((member) => member.id).indexOf(user.id);
                                this.autoPlay[pos] = false;
                                util.sendMessage(message.channel, `Autoplay disabled for ${util.fixNameFormat(user.username)}.`);
                            })

                            setTimeout(() => {
                                this.turnCount = 1;
                                this.nextTurn(bot, msg, channel, players, this.collector, this.positions, this.playerTurn, this.turnCount, this.autoPlay, this.inGame, this.winnerOrder);
                            }, this.AUTOPLAY_DELAY)
                        })
                })
        };

        this.nextTurn = (bot, gameMessage, channel, players, collector, positions, playerTurn, turn, autoPlay, inGame, winnerOrder, previousMove = "") => {
            // Perform the action
            if (inGame[playerTurn]) {
                // Check for a winner
                if (inGame.filter(Boolean).length <= 1) {
                    // Game ended!
                    winnerOrder.push(players[playerTurn]);
                    gameMessage.edit(this.getGameEmbed(bot, players, positions, collector, playerTurn, turn, autoPlay, inGame, winnerOrder, previousMove, true))
                    gameMessage.reactions.removeAll();
                    return;
                }
                gameMessage.edit(this.getGameEmbed(bot, players, positions, collector, playerTurn, turn, autoPlay, inGame, winnerOrder, previousMove))
                // Autoplay move.
                if (players[playerTurn].id === bot.user.id || autoPlay[playerTurn]) {

                    let moveResult = this.move(players[playerTurn], positions[playerTurn]);
                    positions[playerTurn] = moveResult.newSpace;

                    if (moveResult.newSpace === 100) {
                        inGame[playerTurn] = false;
                        winnerOrder.push(players[playerTurn]);
                    }

                    setTimeout(() => { 
                        this.nextTurn(bot, gameMessage, channel, players, collector, 
                            positions, (playerTurn + 1) % players.length, turn + (playerTurn + 1 === players.length ? 1 : 0), autoPlay, inGame, winnerOrder, moveResult.message) 
                        }, this.AUTOPLAY_DELAY);
                // Actual spin move.
                } else {
                    gameMessage.awaitReactions((reaction, user) => {
                        return user.id === players[playerTurn].id && (reaction.emoji.name === '↩️' || reaction.emoji.name === '❌');
                    }, {time: turn === 1 ? this.INITIAL_SNAKES_AND_LADDERS_TIMEOUT : this.SNAKES_AND_LADDERS_TIMEOUT, max: 1})
                        .then((collected) => {
                            const reaction = collected.first();
                            if (!reaction) {
                                let msg = `${util.fixNameFormat(players[playerTurn].displayName)} did not make a move within ${(turn === 1 ? this.INITIAL_SNAKES_AND_LADDERS_TIMEOUT : this.SNAKES_AND_LADDERS_TIMEOUT) / 1000} seconds! They have automatically quit.`
                                // remove this player from the game.
                                inGame[playerTurn] = false;
                                this.nextTurn(bot, gameMessage, channel, players, collector, 
                                    positions, (playerTurn + 1) % players.length, turn + (playerTurn + 1 === players.length ? 1 : 0), autoPlay, inGame, winnerOrder, msg);
                                return;
                            } else if (reaction.emoji.name === '❌') {
                                let msg = `${util.fixNameFormat(players[playerTurn].displayName)} has resigned.`
                                // remove this player from the game.
                                inGame[playerTurn] = false;
                                this.nextTurn(bot, gameMessage, channel, players, collector, 
                                    positions, (playerTurn + 1) % players.length, turn + (playerTurn + 1 === players.length ? 1 : 0), autoPlay, inGame, winnerOrder, msg);
                                return;
                            }

                            // Clear reactions except for the bot's reaction
                            reaction.users.remove(reaction.users.cache.filter(user => user.id !== gameMessage.author.id).first().id)
                            .then(() => {
                                let moveResult = this.move(players[playerTurn], positions[playerTurn]);
                                positions[playerTurn] = moveResult.newSpace;

                                if (moveResult.newSpace === 100) {
                                    inGame[playerTurn] = false;
                                    winnerOrder.push(players[playerTurn]);
                                }

                                this.nextTurn(bot, gameMessage, channel, players, collector, positions, (playerTurn + 1) % players.length,
                                turn + (playerTurn + 1 === players.length? 1 : 0), autoPlay, inGame, winnerOrder, moveResult.message);
                            })
                        })
                }
            } else {
                this.nextTurn(bot, gameMessage, channel, players, collector, positions, (playerTurn + 1) % players.length, turn + (playerTurn + 1 === players.length? 1 : 0), autoPlay, inGame, winnerOrder, previousMove);
            }
        }

        this.move = (playerMember, oldSpace) => {
            let spinner = this.spinner();
            let message = `<@${playerMember.id}> spun a ${spinner}!`;
            if (oldSpace + spinner <= 100) {
                oldSpace += spinner;
                message += ` They move to square ${oldSpace}.`;
            } else {
                message += ` It's too high, so they stay on square ${oldSpace}.`
            }
            let newSpace = this.autoMove(oldSpace);

            if (oldSpace < newSpace) {
                message += `\n:ladder: They landed on a ladder and advance to square ${newSpace}.`;
            } else if (oldSpace > newSpace) {
                message += `\n:snake: They landed on a snake and move back to square ${newSpace}.`
            }
            return {
                message: message,
                newSpace: newSpace,
                spin: spinner
            }
        } 

        this.autoMove = (oldPosition) => {
            if (this.snakeSquares.has(oldPosition)) { // you landed on a snake square
                return this.snakeSquares.get(oldPosition);
            } else if (this.ladderSquares.has(oldPosition)) { // you landed on a ladder square
                return this.ladderSquares.get(oldPosition);
            }
            return oldPosition; // you landed on a normal square
        }

        this.spinner = () => {
            return Math.ceil(Math.random() * 6);
        }

        this.getGameEmbed = (bot, players, positions, collector, playerTurn, turnCount, autoPlay, inGame, winnerOrder, previousMove, gameOver = false) => {
            if (!gameOver) {
                if (playerTurn === 0 && turnCount === 0) {
                    let playerString = '';
                    for (let i = 0; i < players.length; i++) {
                        playerString += `${i + 1}. ${util.fixNameFormat(players[i].displayName)}\n`
                    }
                    return new Discord.MessageEmbed()
                        .setTitle('Snakes and Ladders')
                        .setDescription(`Randomized Move Order:\n\n${playerString}\nSetting up the game...`)
                        .setColor(Colors.BLUE)
                        .setTimestamp()
                } else {
                    let places = [];
                    for (let i = 0; i < players.length; i++) {
                        places.push(`<@${players[i].id}> is on square ${positions[i]}${positions[i] === 100 ? ' :medal:' : (inGame[i] ? (` ${autoPlay[i] || players[i].id === bot.user.id ? ' 🔄' : ''}`) : ' ❌')}`);
                    }
                    return new Discord.MessageEmbed()
                        .setTitle(`Snakes and Ladders (Turn ${turnCount})`)
                        .setAuthor(players[playerTurn].displayName, players[playerTurn].user.displayAvatarURL({ dynamic: true }))
                        .setDescription(`${previousMove ? `${previousMove}\n\n` : ''}It is <@${players[playerTurn].id}>'s turn.`)
                        .setImage('https://media.discordapp.net/attachments/686289621986181133/836329750569811988/ChutesAndLadders-board.png?width=620&height=630')
                        .addField('Positions', places)
                        .setColor(Colors.BLUE)
                        .addField('Actions', ["Press ↩️ to spin the spinner!", "Press 🔄 to enable autoplay.", "Press ❌ to resign."])
                }
            } else {
                let playerString = '';
                let index = 1;
                for (let i = 0; i < winnerOrder.length; i++) {
                    playerString += `${index++}. ${util.fixNameFormat(winnerOrder[i].displayName)} [${positions[players.map(p => p.id).indexOf(winnerOrder[i].id)]}] ${this.getMedal(i+1)}\n`
                }
                for (let player of players.filter(lastPlace => !winnerOrder.some(alreadyPrinted => lastPlace.id === alreadyPrinted.id)).sort((p1, p2) => {
                    return positions[players.map(p => p.id).indexOf(p2.id)] - positions[players.map(p => p.id).indexOf(p1.id)]
                })) {
                    playerString += `${index++}. ${util.fixNameFormat(player.displayName)} [${positions[players.map(p => p.id).indexOf(player.id)]}] ❌\n`
                }
                return new Discord.MessageEmbed()
                    .setTitle('Snakes and Ladders')
                    .setDescription(`${turnCount} turns`)
                    .setColor(Colors.BLUE)
                    .addField('Congratulations!', playerString)
                    .setImage('https://media.discordapp.net/attachments/686289621986181133/836329750569811988/ChutesAndLadders-board.png?width=620&height=630')
                    .setTimestamp()
            }
        };

        this.getMedal = (number) => {
            switch (number) {
                case 1:
                    return ':first_place:';
                case 2:
                    return ':second_place:';
                case 3:
                    return ':third_place:';
                default:
                    return ':medal:';
            }
        };
    }
}