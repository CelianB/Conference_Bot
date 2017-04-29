# Conference Bot
Discord bot that allow you to manage a conference. 

## Requirements
The bot need some permissions to work correctly :
- Manage channels (Optionnal) : You can also create channels with the same name as "ChanVoice" and "ChanText" variables.
- Make mute.
A role can be specified in the "RoleAdmin" variable : this role wont get muted.

## How does it works
- The program will create 2 channels : 
	* A vocal channel : joinnable by everyone and where everyone is muted except a specified role.
	* A text channel : where everyone can type commands.
- A queue system with a configurable rotation timing.

## Commands

### *!start* (defined role only)
Start the rotation and unmute the first member of the queue.
### *!pause* (defined role only)
Stop the rotation : Pause the timer.
### *!resume* (defined role only)
Resume the timer where he stopped.
### *!reset* (defined role only)
Emply the queue.
### *!set time x* (defined role only)
*(x as seconds)*
Set the timer of the rotation.
### *!QueueON*
Join the queue.
### *!QueueOFF*
Leave the queue.
### *!statut*
Get the position in the queue (message).

## How to use
You have to authorise the bot on your discord here :
`https://discordapp.com/oauth2/authorize?&client_id=305758468596563969&scope=bot`
