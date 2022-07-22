const util = require('../utilities');
const config = require('../config.json');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const Colors = require('../resources/colors.json');
const uuid = require('./uuid.js');

const alphabet = ['', '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿']
const player_one_symbol = ':x:';
const player_two_symbol = ':o:';

class four_ttt_game {
    #board;

    constructor() {
        this.#board = Array.from(Array(5), () => new Array(5))
    }

    /**
     * Puts the piece in the specified location. Returns true if successful, false if not.
     * 
     * @param {number} row (1-5) the row to put this piece in
     * @param {number} col (1-5) the column to put this piece in
     * @param {string} piece the piece to place
     * @returns false if that space is already occupied. true if the piece was successfully placed.
     */
    put(row, col, piece) {
        if (this.#board[--row][--col]) {
            return false;
        }
        this.#board[row][col] = piece;
        return true;
    }

    /**
     * Checks whether this board is full or not.
     * 
     * @returns true if the board is full. false if not.
     */
    isFull() {
        return !this.#board.some((row) => row.includes(undefined));
    }

    /**
     * Returns a winner, if any. Returns null otherwise.
     * @param {number} row the row (1-5) that the person last placed their move at
     * @param {number} col the column (1-5) that the person last placed their move at
     * @returns a string representing the winner. null otherwise.
     */
    winnerCheck(row, col) {
        let player = this.getPiece(row, col);
        let streak = 0;
        // Check rows
        for (let j = 0; j < 4 && streak < 4; j++) {
            streak = 0;
            for (let i = 0; i < 4; i++) {
                if (this.getPiece(row, col + i - j) === player) streak++;
            }
        }

        // Check columns
        for (let j = 0; j < 4 && streak < 4; j++) {
            streak = 0;
            for (let i = 0; i < 4; i++) {
                if (this.getPiece(row + i - j, col) === player) streak++;
            }
        }

        // Check descending diagonal
        for (let j = 0; j < 4 && streak < 4; j++) {
            streak = 0;
            for (let i = 0; i < 4; i++) {
                if (this.getPiece(row + i - j, col + i - j) === player) streak++;
            }
        }

        // Check ascending diagonal
        for (let j = 0; j < 4 && streak < 4; j++) {
            streak = 0;
            for (let i = 0; i < 4; i++) {
                if (this.getPiece(row + i - j, col - (i - j)) === player) streak++;
            }
        }

        if (streak >= 4) {
            return player;
        } else {
            return null;
        }
    }

    /**
     * Returns the piece at the row or column. null if out of bounds.
     * 
     * @param {number} row the row (1-5) to check 
     * @param {number} col the column (1-5) to check
     * @returns the piece, if any
     */
    getPiece(row, col) {
        if (row <= 0 || 6 <= row || col <= 0 || 6 <= col) {
            return null;
        }
        row--;
        col--;
        return this.#board[row][col];
    }

    /**
     * Returns this board in string format.
     * 
     * @returns a string representation of this board
     */
    boardToString() {
        let output = ''
        for (let i = 0; i < this.#board.length; i++) {
            for (let j = 0; j < this.#board[i].length; j++) {
                if (this.#board[i][j]) {
                    output += this.#board[i][j] + ' ';
                } else {
                    output += alphabet[i * 5 + j + 1] + ' ';
                }
            }
            output = output.trim();
            if (i !== this.#board.length - 1) {
                output += '\n';
            }
        }
        return output;
    }
}

module.exports = {
    name: ['tttt', '4ttt', '5ttt'],
    description: 'Play 5x5 tic tac toe with someone!',
    usage: '<opponent>',
    requiresTarget: true,

    async execute(bot, message, args, target) {
        if (!message.channel.permissionsFor(message.guild.me).has("ADD_REACTIONS")) {
            util.sendMessage(message.channel, `Missing required permission: 'ADD_REACTIONS'`);
            return;
        }
        if (!message.channel.permissionsFor(message.guild.me).has("MANAGE_MESSAGES")) {
            util.sendMessage(message.channel, `Missing required permission: 'MANAGE_MESSAGES'`);
            return;
        }

        await util.sendMessage(message.channel, `${target}`);
        let response = await util.askUser(message.channel, target, new Discord.MessageEmbed()
            .setTitle('Challenge!')
            .setDescription(`${util.fixNameFormat(message.member.displayName)} challenges you to a game of 5x5 tic tac toe.\nYou need to get 4 in a row to win.\nDo you accept?`)
            .setColor(Colors.MEDIUM_GREEN)
            .setTimestamp())
        
        if (!response) {
            util.sendMessage(message.channel, `${message.member}, ${util.fixNameFormat(target.displayName)} has declined your challenge or did not respond within 60 seconds. Must be scared.`);
            return;
        }

        let game = new four_ttt_game();
        let winner;
        let turn = Math.round(Math.random()); // 0 or 1
        let gameMsg = await util.sendMessage(message.channel, new Discord.MessageEmbed()
            .setTitle('Setting up the board...')
            .setDescription('Please wait...'));
        let previousMove;
        let didNotRespondInTime = false;

        while (!winner && !game.isFull()) {
            let currentPlayer = turn ? message.member : target;
            let currentSymbol = turn ? player_one_symbol : player_two_symbol;
            gameMsg.edit(new Discord.MessageEmbed()
                .setColor(Colors.DARK_GREEN)
                .setTitle('Playing Tic Tac Toe!')
                .setAuthor(currentPlayer.displayName, currentPlayer.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`${previousMove ? previousMove + '\n' : ''}It is ${currentSymbol} ${currentPlayer}'s turn.\n\n${game.boardToString()}\n\n4 in a row to win. Type the position you want your piece to go in.`)
                .setTimestamp());
            let response = await util.askUserForCharacter(message.channel, currentPlayer, 60000, true);
            if (!response) {
                didNotRespondInTime = true;
                winner = currentSymbol;
                turn = (turn + 1) % 2;
                break;
            }
            
            if (response.length !== 1) {
                util.sendMessage(message.channel, `I don't understand \`${response}\`!`);
                continue;
            }
            response = response.toLowerCase();

            let placement = response.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);

            let row = Math.floor(placement / 5) + 1;
            let col = placement % 5 + 1;

            if (row <= 0 || 6 <= row || col <= 0 || 6 <= col) {
                util.sendTimedMessage(message.channel, `I don't understand \`${response}\`!`, config.delete_delay);
                continue;
            }
            
            let success = game.put(row, col, currentSymbol);

            if (!success) {
                util.sendMessage(message.channel, 'That space is already occupied, please try again.');
                continue;
            }

            previousMove = `${currentSymbol} ${currentPlayer} placed a piece at position :regional_indicator_${response}:.`;

            winner = game.winnerCheck(row, col);
            turn = (turn + 1) % 2;
        }

        console.log(turn)

        if (!winner) {
            gameMsg.edit(new Discord.MessageEmbed()
                .setColor(Colors.DARK_GREEN)
                .setTitle('Tic Tac Toe game ended!')
                .setDescription(`${player_one_symbol} ${util.fixNameFormat(message.member.displayName)} vs. ${player_two_symbol} ${util.fixNameFormat(target.displayName)}\n\n${game.boardToString()}\n\nGame ended in a draw!`)
                .setTimestamp());
        } else {
            gameMsg.edit(new Discord.MessageEmbed()
                .setColor(Colors.DARK_GREEN)
                .setTitle('Tic Tac Toe game ended!')
                .setDescription(`${player_one_symbol} ${util.fixNameFormat(message.member.displayName)} vs. ${player_two_symbol} ${util.fixNameFormat(target.displayName)}\n\n${game.boardToString()}\n\n${didNotRespondInTime ? (turn ? util.fixNameFormat(message.member.displayName) : util.fixNameFormat(target.displayName)) + ' did not make a move within 60 seconds.\n' : ''}${turn ? util.fixNameFormat(message.member.displayName) : util.fixNameFormat(target.displayName)} has lost tic tac toe! **YIKES!**`)
                .setTimestamp());
        }


        // console.log(result);

        
        
        // let nonVerified = [];
        // for (const member of message.guild.members.cache) { // member = [userID, Discord.GuildMember]
        //     if (!member[1].roles.cache.some(role => role.id === config.role_id_required_to_use_shop)) {
        //         continue;
        //     }
        //     member[1].roles.add('872984015362203688');
        //     // let uuid = util.getStats(message, member[1], 'mc_uuid');
        //     // if (!uuid) {
        //     //     nonVerified.push(`${util.fixNameFormat(member[1].displayName)}`);
        //     // }
        // }

        // const num_per = 20;
        // for (let i = 0; i < Math.ceil(nonVerified.length / num_per); i++) {
        //     util.sendMessage(message.channel, new Discord.MessageEmbed()
        //         .setTitle('Here are people who still need verification.')
        //         .setDescription(nonVerified.slice(i * num_per, (i + 1) * num_per))
        //         .setColor(Colors.GREEN)
        //         .setTimestamp());
        // }
        
        // util.sendMessage(message.channel, "You chose " + await util.askUser(message.channel, 
        //     message.member.user, 
        //     new Discord.MessageEmbed().setTitle("Yes or no"),
        //     30000));
    }
};