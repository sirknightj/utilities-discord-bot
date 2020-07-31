# Extra Utilities Discord Bot
With very simple fun and useful commands!

## Instructions
* Set edit your configurations in the `example_config.json` file and rename it to `config.json`.
* The default prefix is '!' so this guide will be written with that in mind.

## Helpful Commands

#### `!help`
* Prints the available commands, along with their usage and description.

#### `!avatar <user>`
* Prints a link to the `user`'s profile photo. 

## Moderation Commands

#### `!announce <channel-name> <message>`
* Says the `<message>` in a specified channel.
* Note: `<channel-name>` can either be a mention `#general` or just the channel's name in plain text `general`.

#### `!purge (optional: channel-name) <number>`
* Deletes `<number>` of messages from `<channel-name>`.
* If `<channel-name>` is unspecified, then it will default to *this* channel.

#### `!warn <user> (optional: channel-name) (optional: message)`
* Warns the user in the format `@user This is a warning. <message>` in the specified channel.
* If `<channel-name>` is unspecified, then it will default to *this* channel.
* Note: `<user>` can be a mention `@spartan` or all or part of the user's name `spar`. Do note that the bot will find the first user that has `spar` in their name, so using a `@mention` is preferred when multiple users have `spar` in their name, such as `jealousparkingspot`.
* Note: `<channel-name>` can either be a mention `#general` or just the channel's name in plain text `general`.

## Fun Commands

#### `!hello`
* Says `Hello <message-sender>!`

#### `!ghostping <user> <channel-name>`
* Pings the user, and then deletes the message as fast as possible. Also deletes your command as fast as possible.
* Note: Requires the message author to have `ADMINISTRATOR` permissions.
* Note: `<user>` can be a mention `@spartan` or all or part of the user's name `spar`. Do note that the bot will find the first user that has `spar` in their name, so using a `@mention` is preferred when multiple users have `spar` in their name, such as `jealousparkingspot`.
