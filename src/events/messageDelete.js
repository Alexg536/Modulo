const { Events } = require("discord.js");
const { makeLogEmbed } = require("../utils/logEmbed");
const { sendLog } = require("../features/logger");

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild) return;
    if (message.author?.bot) return;

    const embed = makeLogEmbed({
      title: "🗑️ Nachricht gelöscht",
      description: `In <#${message.channelId}> wurde eine Nachricht gelöscht.`,
      user: message.author,
      color: 0xed4245,
      fields: [
        { name: "Autor", value: `${message.author} (${message.author.tag})`, inline: false },
        { name: "Inhalt", value: message.content?.slice(0, 1000) || "*(kein Text / Embed / Anhang)*", inline: false }
      ]
    });

    await sendLog(message.guild, "message_log", embed);
  }
};
