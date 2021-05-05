const config = require('../config.json');
const util = require('../utilities');
const Discord = require('discord.js');
const Colors = require('../resources/colors.json');

module.exports = {
    name: ["snakesandladders", "sal", "chutesandladders", 'cal'],
    description: "Play snakes and ladders!",
    usage: "(optional: list of users to play with, excluding yourself)",

    execute(bot, message, args) {
        util.sendMessage(message.channel, 'Coming soon.');
        return;

        this.SNAKES_AND_LADDERS_TIMEOUT = 60000;

        const players = [];
        if (args.length > 0) {
            players.push(message.member);
            while (args.length > 0) {
                let lookingFor = args.shift();
                let memberFound = util.getUserFromMention(message, lookingFor);
                if (memberFound) {
                    players.push(memberFound);
                } else {
                    util.sendMessage(message.channel, `Count not find user \`${lookingFor}\`!`);
                }
                if ((new Set(players)).size !== players.length) {
                    util.sendMessage(message.channel, `Duplicate user: \`${util.fixNameFormat(memberFound.displayName)}\`!`);
                    players.pop();
                }
            }
        } else {
            players.push(message.guild.members.cache.get(bot.user.id));
            players.push(message.member);
        }

        if (players.length > 1) {
            let playerString = '';
            for (let player of players) {
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
                                    this.startGame(bot, msg, message.channel, players);
                                } else {
                                    util.sendMessage(message.channel, 'Game cancelled!');
                                    msg.reactions.removeAll();
                                }
                            })

                            collector.on('end', collected => {
                                if (collected.size === 0) {
                                    util.sendMessage(message.channel, `Unfortunately, ${util.fixNameFormat(message.member.displayName)} did not press ✅ within ${this.SNAKES_AND_LADDERS_TIMEOUT / 1000} seconds. The game has been automatically aborted.`);
                                    message.reactions.removeAll();
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
            const positions = new Array(players.length).fill(0); // everyone starts on Square 0 (not on the board).
            const autoPlay = new Array(players.length).fill(false); // everyone is by default not autoplaying.

            // Determine the move order.
            // Shuffle players in-place using Durstenfeld shuffle algorithm
            for (let i = players.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                let temp = players[i];
                players[i] = players[j];
                players[j] = temp;
            }

            let playerTurn = 0;
            let turnCount = 0;
            gameMessage.edit(this.getGameEmbed(bot, players, positions, null, playerTurn, turnCount, autoPlay))
                .then(msg => {
                    msg.react('↩️')
                        .then(() => {
                            msg.react('🔄')
                        })
                        .then(() => {
                            msg.react('❌')
                        })
                        .then(() => {
                            const collector = msg.createReactionCollector((reaction, user) => {
                                if (reaction.emoji.name === '🔄') {
                                    return players.some(player => player.id === user.id);
                                }
                                return false;
                            }, { dispose: true })

                            collector.on('collect', (reaction, user) => {
                                let pos = players.map((member) => { return member.id; }).indexOf(user.id);
                                autoPlay[pos] = true;
                                util.sendMessage(message.channel, `Autoplay enabled for ${user.username}`);
                                console.log(autoPlay)
                            })

                            collector.on('remove', (reaction, user) => {
                                let pos = players.map((member) => { return member.id; }).indexOf(user.id);
                                autoPlay[pos] = false;
                                util.sendMessage(message.channel, `Autoplay disabled for ${user.username}`);
                                console.log(autoPlay)
                            })

                            setTimeout(() => {
                                turnCount = 1;
                                this.nextTurn(bot, msg, channel, players, collector, positions, playerTurn, turnCount, autoPlay);
                            }, 5000)
                        })
                })
        };

        this.nextTurn = (bot, gameMessage, channel, players, collector, positions, playerTurn, turn, autoPlay, previousMove = "") => {
            gameMessage.edit(this.getGameEmbed(bot, players, positions, collector, playerTurn, turn, autoPlay, previousMove))
            if (players[playerTurn].id === bot.user.id || autoPlay[playerTurn]) {

                let moveResult = this.move(players[playerTurn], positions[playerTurn]);
                positions[playerTurn] = moveResult.newSpace;

                setTimeout(() => { 
                    this.nextTurn(bot, gameMessage, channel, players, collector, 
                        positions, (playerTurn + 1) % players.length, turn + (playerTurn + 1 === players.length ? 1 : 0), autoPlay, moveResult.message) 
                    }, 5000);
            } else {
                gameMessage.awaitReactions((reaction, user) => {
                    return user.id === players[playerTurn].id && reaction.emoji.name === '↩️';
                }, {time: this.SNAKES_AND_LADDERS_TIMEOUT, max: 1})
                    .then((collected) => {
                        const reaction = collected.first();
                        if (!reaction) {
                            // player did not react, so they quit
                        }

                        // Clear reactions except for the bot's reaction
                        reaction.users.remove(reaction.users.cache.filter(user => user.id !== gameMessage.author.id).first().id)
                        .then(() => {
                            let moveResult = this.move(players[playerTurn], positions[playerTurn]);
                            positions[playerTurn] = moveResult.newSpace;

                            this.nextTurn(bot, gameMessage, channel, players, collector, positions, (playerTurn + 1) % players.length,
                            turn + (playerTurn + 1 === players.length? 1 : 0), autoPlay, moveResult.message);
                        })
                    })
            }
        }

        this.move = (playerMember, oldSpace) => {
            let spinner = this.spinner();
            oldSpace += spinner;
            let newSpace = this.autoMove(oldSpace);

            let message = `<@${playerMember.id}> spun a ${spinner}! They move to square ${oldSpace}.`;
            if (oldSpace < newSpace) {
                message += `\nYay! They landed on a ladder and advance to square ${newSpace}.`;
            } else if (oldSpace > newSpace) {
                message += `\nYikes! They landed on a snake and move back to square ${newSpace}.`
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

        this.getGameEmbed = (bot, players, positions, collector, playerTurn, turnCount, autoPlay, previousMove) => {
            if (playerTurn === 0 && turnCount === 0) {
                let playerString = '';
                for (let player of players) {
                    playerString += `${util.fixNameFormat(player.displayName)}\n`
                }
                return new Discord.MessageEmbed()
                    .setTitle('Snakes and Ladders')
                    .setDescription(`Randomized Move Order:\n\n${playerString}\nSetting up the game...`)
                    .setColor(Colors.BLUE)
                    .setTimestamp()
            } else {
                let places = [];
                for (let i = 0; i < players.length; i++) {
                    places.push(`<@${players[i].id}> is on square ${positions[i]}`);
                }
                return new Discord.MessageEmbed()
                    .setTitle(`Snakes and Ladders (Turn ${turnCount})`)
                    .setDescription(`${previousMove ? `${previousMove}\n\n` : ''}It is <@${players[playerTurn].id}>'s turn.`)
                    .setImage('https://media.discordapp.net/attachments/686289621986181133/836329750569811988/ChutesAndLadders-board.png?width=620&height=630')
                    .addField('Positions', places)
                    .addField('Actions', ["Press ↩️ to spin the spinner!", "Press 🔄 to enable autoplay.", "Press ❌ to resign."])
            }
        };
    }
}