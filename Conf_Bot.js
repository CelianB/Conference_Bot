const config = require('./config.js')
const Discord = require("discord.js");
const bot = new Discord.Client();

const ChanText = 'conference_cmd';
const ChanVoice = 'Conference';
const RoleAdmin = 'CHEF';

var guildID = null;
var IDVoice = null; //save ID channel voice
var IDselected = null; // save ID of the last member selected

var ConfBot = {
  statut: false,
  time: 30,
  queue: []
};

bot.on('ready', function () {
  SetupChannels(); // Create channels if they dont existe as nasmes :"ChanText" and "ChanVoice"
  bot.channels.forEach(value => {
    if (value.name == ChanVoice) {
      IDVoice = value.id;//Set the ID channel voice 
    }
  })
});

bot.on('message', msg => {
  guildID = msg.guild.id;
  if (msg.channel.name == ChanText) {
    if (msg.member.roles.find("name", RoleAdmin)) {
      switch (msg.content) {
        //cases for admin role only : "RoleAdmin" name
        case "!start":
          if (ConfBot.queue.length != 0) { //Check if the queue isnt emply
            if (ConfBot.statut == false) {
              ConfBot.statut = true;
              msg.reply('BOT_conf est démarré');
              MuteAll();//Mute all the members in the channel exept role
              PickMember(); //Pick the first memmber;
              Clock.start(); //Start clock : Pick member every x secondes
            }
            else msg.reply('BOT_conf est déjà demarré');
          }
          else msg.reply('La file d\'attente est vide, impossible de commencer la conférence');
          break;
        case "!resume":
          Clock.resume();
          SendMessage("resume");
          break;
        case "!pause":
          Clock.pause();
          SendMessage("pause");
          break;
        case "!stop":
          Clock.pause();
          if (ConfBot.statut == true) {
            ConfBot.statut = false;
            msg.reply('BOT_conf bien été stoppé');
          }
          else if (ConfBot.statut == false) msg.reply('BOT_conf n\'est pas démarré');
          break;
        case "!reset":
          //Reset the queue
          ConfBot.queue = [];
          msg.reply('La file d\'attente a bien été reset');
          break;
        case "!statut" || "!QueueOFF" || "!QueueON":
          msg.reply('Vous avez déjà le droit à la parole !');
          break;
      }
      if (msg.content.startsWith("!set time")) {
        if (ConfBot.statut == false) {
          var time = parseInt(msg.content.split("!set time")[1]);
          if (time != NaN && time > 5) {
            ConfBot.time = time;
            msg.reply("Le temps de parole à bien été mis à jour à " + time + " secondes.");
          }
          else {
            msg.reply("Erreur dans la commande, veuillez saisir une valeur numérique en seconde supérieur à 5 : \"!set time 30\"");
          }
        }
        else msg.reply("Le bot doit être stopper pour changer le temps de parole : !stop (la file d'attente ne sera pas reset)");
      }
    }
    else {
      switch (msg.content) {
        case "!statut":
          //send a message with the position in the Queue
          //'Vous êtes actuellement index of(token.user)/.length)'
          if (ConfBot.queue.includes(msg.author.id)) {
            let pos = ConfBot.queue.indexOf(msg.author.id) + 1;
            msg.reply("Vous êtes actuellement " + pos + "/" + ConfBot.queue.length + ".");
          }
          else {
            msg.reply('Vous n\'êtes pas dans la file d\'attente : "!QueueON" pour rejoindre');
          }
          break;
        case "!QueueOFF":
          if (ConfBot.queue.includes(msg.author.id)) {
            var ind = ConfBot.queue.indexOf(msg.author.id);
            ConfBot.queue.splice(ind, 1);
            msg.reply('Vous avez bien été retiré de la file d\'attente');

          }
          else {
            msg.reply('Vous n\'êtes pas dans la file d\'attente : "!QueueON" pour rejoindre');
          }
          break;
        case "!QueueON":
          if (ConfBot.queue.includes(msg.author.id)) {
            msg.reply('Vous êtes déjà dans la file d\'attente : "!QueueOFF" pour en sortir');
          }
          else {
            ConfBot.queue.push(msg.author.id);
            msg.reply('Vous êtes bien dans la file d\'attente');
          }
          break;
      }
    }
  }
});
bot.on('voiceStateUpdate', (oldMember, newMember) => {
  if (oldMember.voiceChannelID != newMember.voiceChannelID) {
    if (IDVoice != null) {
      if (oldMember.voiceChannelID == null || newMember.voiceChannelID == null)
        //Unmute when an user go out of the channel
        oldMember.setMute(false);
      else if (oldMember.voiceChannelID == IDVoice) {
        //If a user go out of the channel 
        oldMember.setMute(false);
      }
      if (newMember.voiceChannelID == IDVoice && !newMember.roles.find("name", RoleAdmin)) {
        //Mute if a user join the channel and isnt roled
        newMember.setMute(true);
      }
    }
  }


});
bot.login(config.botToken);

var Clock = {
  totalSeconds: 0,
  start: function () {
    this.interval = setInterval(function () {
      PickMember();
    }, ConfBot.time * 1000);
  },

  pause: function () {
    clearInterval(this.interval);
    delete this.interval;
  },

  resume: function () {
    if (!this.interval) this.start();
  }
};
function PickMember() {
  if (IDselected != null) {
    Mute(IDselected); // Mute the last selected memeber
  }
  bot.guilds.forEach(guild => {
    if (guild.id == guildID) {
      guild.channels.forEach(value => {
        if (value.name == ChanVoice) {
          if (ConfBot.queue.length == 0) SendMessage(false);//If noone is in the liste : send a message saying it
          else {
            var selected = false;
            do {
              //Check all members in the channel
              value.members.forEach(value => {
                if (selected==false && value.user.id == ConfBot.queue[0]) {
                  //if a member is the first on the queue
                  value.setMute(false);
                  selected = true;
                  SendMessage(ConfBot.queue[0]);//"You are selected" message"
                  IDselected = ConfBot.queue[0];//Save his id to re-mute him after that
                  ConfBot.queue.shift();
                }
              });
              if (selected == false) ConfBot.queue.shift();
              //if the fist on the list isnt in the channel : shift him
            }
            while (selected == false && ConfBot.queue.length != 0);
          }
        }
      });
    }
  });
}

function SetupChannels() {
  bot.guilds.forEach(guild => {
    var ChantextExist = false;
    var ChanVoiceExist = false;
    guild.channels.forEach(channel => {
      if (channel.name == ChanText) {
        ChantextExist = true;
      }
      if (channel.name == ChanVoice) {
        ChanVoiceExist = true;
      }
      if (ChantextExist && ChanVoiceExist) return;
    });
    if (ChantextExist == false) { guild.createChannel(ChanText, 'text').catch(console.error); }
    if (ChanVoiceExist == false) { guild.createChannel(ChanVoice, 'voice').catch(console.error); }
  });
}
function MuteAll() {
  bot.guilds.forEach(guild => {
    if (guild.id == guildID) {
      guild.channels.forEach(value => {
        if (value.name == ChanVoice) {
          value.members.forEach(value => {
            if (!value.roles.find("name", RoleAdmin)) {
              value.setMute(true);
            };
          });
        };
      });
    };
  });
};
function Mute(id) {
  bot.guilds.forEach(guild => {
    if (guild.id == guildID) {
      guild.channels.forEach(value => {
        if (value.name == ChanVoice) {
          value.members.forEach(value => {
            if (value.user.id == id) {
              if (!value.roles.find("name", RoleAdmin)) {
                value.setMute(true);
              };
            };
          });
        };
      });
    };
  });
};

function SendMessage(param) {
  bot.guilds.forEach(guild => {
    if (guild.id == guildID) {
      guild.channels.forEach(value => {
        if (value.name == ChanText) {
          switch (param) {
            case false:
              value.send("Personne ne souhaitant participer n'a été trouvé dans le channel \"Conference\"\, utilisez la commande \"QueueON\" pour rejoindre !");
              break;
            case "pause":
              value.send("Le timer a été mis en pause");
              break;
            case "resume":
              value.send("Le timer est reparti !");
              break;
            default:
              value.send("<@" + param + "> est selectionné !");
              break;
          };
        };
      });
    };
  });
};