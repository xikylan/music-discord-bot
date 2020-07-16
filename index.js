const Discord = require("discord.js");
const youtube = require("ytdl-core");
const config = require("./config.js");

const bot = new Discord.Client();
let isPlaying = false;
const queue = [];

bot.on("ready", () => {
  console.log("Bot is online");
});

bot.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const userChannel = message.member.voice.channel;
  const userMessage = message.content.split(" ");

  async function play() {
    try {
      const connection = await userChannel.join();
      const dispatcher = connection.play(
        youtube(queue[0], {
          filter: "audioonly",
          quality: "highestaudio",
          highWaterMark: 1 << 25,
        })
      );
      dispatcher.on("finish", () => {
        queue.shift();
        if (queue[0]) {
          play();
        } else {
          isPlaying = false;
          connection.disconnect();
        }
      });
    } catch (error) {
      printError(userChannel, error);
    }
  }

  if (userMessage.length === 2) {
    const [command, url] = userMessage;
    if (command === "-play" && userChannel) {
      queue.push(url);
      if (!isPlaying) {
        play();
        isPlaying = true;
      }
    }
  } else {
    printUsage(message);
  }
});

bot.login(config.token);

function printError(channel, error) {
  console.log(error.message);
  channel.member.guild.channels.cache
    .get(channel.guild.systemChannelID)
    .send(error.message);
}

function printUsage(message) {
  message.channel.send(
    "Error: Wrong usage => Correct usage: -play [url]\n\nOther commands:\n\t-pause\n\t-resume\n\t-stop\n\n(note: you must be in a voice channel!)"
  );
}
