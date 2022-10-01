# Moderator/Extra Utilities Discord Bot
With very simple, fun, and useful commands that are very easy-to-use and intuitive!

## Instructions
* Set edit your configurations in the `example_config.json` file and rename it to `config.json`.
* The default prefix is '!' so this guide will be written with that in mind.

## Easy-to-use Commands!
* Tons of `(optional)` arguments, and helpful defaults if no arguments are provided.
** Required arguments are given in angle brackets `<required>`, while optional arguments are in parenthesis `(optional)`.
* `<user>` doesn't have to be a mention! Can be a mention `@spartan` or all or part of the user's name `spar`. Do note that the bot will find the first user that has `spar` in their name, so using a `@mention` is preferred when multiple users have `spar` in their name, such as <code>jealou**spar**kingspot</code>.
* Note: `<channel-name>` can either be a mention `#general` or just the channel's name in plain text `general`. This will not search for channels containing your input such as `gen` for `#general`.
* Note: `<voice-channel-name>` however, can be partial, since it is very difficult to mention a voice channel. For example, `music` can find the voice channel `♬ Music Channel`.

## Helpful Commands

#### `!help`
* Prints the available commands, along with their usage and description.

#### `!<command> help`
* Gives the usage of the command, aliases for the command, and the required permissions to use it!

#### `!avatar <user>`
* Returns a link to the `<user>`'s profile photo. 

#### `!ping`
* Replies with pong, and gives you the response time in ms.

## Moderation Commands

#### `!announce <channel-name> <message>`
* Says the `<message>` in a specified channel.
* Requires the message author to have the `MANAGE_MESSAGES` permission.

#### `!alert <user> (optional: channel-name) (optional: message)`
* Says `<@user>, <sender> says (message)` in the specified channel.
* If `(channel-name)` is unspecified, defaults to *this* channel.
* If `(message)` is unspecified, then says `<@user>, <sender> pinged you!`.

#### `!myperms (optional: user) (optional: channel-name)`
* Returns all of the `<user>`'s permissions in the `<channel>`.
* If `<user>` is unspecified, then it defaults to you.
* If `(channel-name)` is unspecified, defaults to *this* channel.

#### `!purge (optional: channel-name) <number>`2
* Deletes `<number>` of messages from `(channel-name)`.
* If `(channel-name)` is unspecified, defaults to *this* channel.
* Note: Requires the message author to have the `MANAGE_MESSAGES` permission.

#### `!userinfo <user>`
* Prints a bunch of useful information about the `<user>`, such as their highest role, server join date, and when their account was created.

#### `!warn <user> (optional: channel-name) (optional: message)`
* Warns the user in the format `@user This is a warning. (message)` in the specified channel.
* If `(channel-name)` is unspecified, then it will default to *this* channel.

## Fun Commands

#### `!activity (optional: playing/streaming/listening/watching) (optional: activity-name/twitch.tv/link)`
* Sets the bot's activity.
* If `(playing/streaming/listening/watching)` is unspecified, defaults to playing.
* If `(activity-name)` is unspecified, clears the activity.

#### `!annoy (optional: user or "voice channel name") (optional: number-of-times) (optional: slow/normal/fast/instant)`
* Joins and immediately leaves the specified voice channel.
* Double quotes around "voice channel name" are optional, but in case you have voice channels with numbers in them, this helps to differentiate.
* If `(voice-channel-name)` is unspecified, defaults to the voice channel the message author is in.
* If `(number-of-times)` is unspecified, defaults to the config option in the `config.json` file (default: 5).
* The maximum `(number-of-times)` can be specified in the `config.json` file (default: 10).
* If `(slow/normal/fast/instant)` is unspecified, defaults to `normal`.

#### `!hello`
* Says a randomized hello message, from the `config.json` file.

#### `!join (optional: voice-channel-name)`
* Joins and chills in the specified voice channel.
* If `(voice-channel-name)` is unspecified, defaults to the voice channel the message author is in.

#### `!leave`
* Disconnects from the current voice channel the bot is in.

#### `!say (optional: channel-name) <message>`
* Says `<message>` in the specified channel.
* If `(channel-name)` is unspecified, then it will default to *this* channel.
* Note: Requires the message author to have the `MANAGE_MESSAGES` permission.

#### `!status <online/idle/invisible/dnd>`
* Sets the bot's status.

#### `!slap (optional: user slapping) <user target being slapped> (optional: channel-name)`
* Says `<@target>, <user slapping> slapped you!` in the specified channel. If the `<target>` is in a voice channel, joins them and plays a slapping noise. 
* If `(user slapping)` is unspecified, then it defaults to you.
* If `(channel-name)` is unspecified, then it will default to *this* channel.

## Games!

#### `!connect4 <target>`
* Sets up a Connect 4 game between you and your target.
* You can even play against yourself!

#### `!tictactoe <target>`
* Sets up a Tic Tac Toe between you and your target.
* You can even play against yourself!

#### `!tttt <target>`
* 5x5 Tic Tac Toe!

#### `!roulette <bet> <guess>`
* Lets you play around with the coins the bot awards you for Discord participation!
* `bet` can be a number, `half`, or `all`.
* `guess` can be even/odd/red/black/high/low/green
* green (0 or 00) is a 17-to-1 multiplier. Columns and dozens are 2-to-1 multipliers. All the other guesses are a 1-to-1 multiplier.

#### `!blackjack <bet> (optional: dealerMovesInstantly? true/false`
* Plays blackjack against the bot!
* `bet` can be a number, `half`, or `all`. Uses the `coins` you earned from Discord participation.
* `(dealerMovesInstantly) defaults to false. If true, then the dealer won't wait 3 seconds in between its moves, allowing for faster games. 

## Keeps Track of Discord Participation!
* Coins system - spend coins on giveaway entry tickets!
* Points system - keep track of someone's total points!
* Leaderboards system - keep track of who has the most coins/points!

#### `!leaderboards (optional: stat-name)`
* Prints out the entire leaderboards, sorted from most to least.
* Defaults to `points` if no `(stat-name)` is provided. Some stat names include `points`, `coins`, and `tickets`. You can view the `stat-name` of every stat when using `!stats`.

#### `!stats (optional: user) (optional: dontDelete? true/false)`
* Prints out the stat card of a user (displaying their time spent in vc, coins, points, and more!)
* If `(user)` is unspecified, then it defaults to you.
* The stats embed deletes itself after 2 minutes. If you don't want to delete it, then `(dontDelete)` should be `true`.

#### `!addstats <user> <amount> <stat-name>`
* Adds a specific stat to the target. Requires the message author to have `KICK_MEMBERS` permission.

#### `!removestats <user/everyone> <amount/all> <stat-name> (optional: delete entry: true/false)`
* Removes a specific stat from the target. Requires the message author to have the `KICK_MEMBERS` permission.
* Delete entry: defaults to false. Essentially, stats.json will have "0" as the number for that stat. If delete entry is true, then the stat will not exist in stats.json.
* Example on how to clear tickets after a giveaway: `!removestats everyone all tickets true`.

#### `!shop purchase ticket (optional: amount/all)`
* Purchases a giveaway entry ticket from the shop. Requires the message author to have the `CHANGE_NICKNAME` permission. Costs the `coins` you got from Discord participation.
* If amount is unspecified, then defaults to 1. If all is specified, then purchases as many tickets as the user can.

#### `!shop upgrade`
* Takes you to the upgrades system. Costs the `coins` you got from Discord participation.
* Purchase upgrades to earn coins faster, improve your odds in roulette, and help you maintain your `!daily` streak!

#### `!giveaway (optional: numberOfWinners)`
* Randomly selects three unique winners from everyone who has giveaway entry tickets. Essentially, draws 3 names out of a hat, starting from 1st place, discarding duplicates. Also prints out the participants list. If you want a different number (say, 1), then specify.
* Note: this command does not change any user's ticket totals. If you want to clear all the tickets after each giveaway, then use `!removestats everyone all tickets true`.

## Misc. Commands

#### `!coinflip`
* Flips an imaginary coin, and tells you what it lands on.

#### `!slots`
* Rolls the slot machine. 
* There are 4 colors and 3 wheels.

#### `!ghostping <user> <channel-name>`
* Pings the user, and then deletes the message as fast as possible. Also deletes your command as fast as possible.
* Note: Requires the message author to have `ADMINISTRATOR` permissions.

## Hypixel Skyblock Role Management!
* Verification system with `!verify` - everyone's usernames will be set to their current IGN
** Server nickname will be set to their current `IGN (previousIGN)` if the name was changed within the last 2 weeks.
** Mods can `!forceverify <user> <IGN>` to forcefully link a Discord account to a Minecraft IGN
* Create roles in your server and set them in `config.json`.
** Whenever someone runs `!claim`, skyblock stats are fetched and roles are updated!
** Run `!updateeveryone` to update everyone's server nicknames.

## Guild Management
* Use `!guild set <guildName>` to initially set the Hypixel Guild the Discord Server is for.
* Use `!guild update` to update the bot's knowledge of the guild data.
* Use `!guild inguild <user>` to check if the user is in the guild or not.
* Use `!guild updateroles <user>` to update the guild membership roles (bridge role, retired/guild member, guest roles)
* Use `!guild updateeveryone` to run `!guild updateroles` for each individual verified user.
