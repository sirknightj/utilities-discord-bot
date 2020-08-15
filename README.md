# Extra Utilities Discord Bot
With very simple, fun, and useful commands that are very easy-tu-use and intuitive!

## Instructions
* Set edit your configurations in the `example_config.json` file and rename it to `config.json`.
* The default prefix is '!' so this guide will be written with that in mind.

## Easy-to-use Commands!
* Tons of `(optional)` arguments, and helpful defaults if no arguments are provided.
** Required arguments are given in angle brackets `<required>`, while optional arguments are in parenthesis `(optional)`.
* `<user>` doesn't have to be a mention! Can be a mention `@spartan` or all or part of the user's name `spar`. Do note that the bot will find the first user that has `spar` in their name, so using a `@mention` is preferred when multiple users have `spar` in their name, such as `jealousparkingspot`.
* Note: `<channel-name>` can either be a mention `#general` or just the channel's name in plain text `general`. This will not search for channels containing your input such as `gen` for `#general`.
* Note: `<voice-channel-name>` however, can be partial, since it is very difficult to mention a voice channel. For example, `music` can find the voice channel `♬ Music Channel`.

## Helpful Commands

#### `!help`
* Prints the available commands, along with their usage and description.

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

#### `!purge (optional: channel-name) <number>`
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

## Misc. Commands

#### `!coinflip`
* Flips an imaginary coin, and tells you what it lands on.

#### `!ghostping <user> <channel-name>`
* Pings the user, and then deletes the message as fast as possible. Also deletes your command as fast as possible.
* Note: Requires the message author to have `ADMINISTRATOR` permissions.
