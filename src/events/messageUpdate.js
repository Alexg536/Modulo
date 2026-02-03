const { Events } = require("discord.js");
const { makeLogEmbed } = require("../utils/logEmbed");
const { sendLog } = require("../features/logger");

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMsg, newMsg) {
    if (!newMsg.guild) return;
    if (newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;

    const embed = makeLogEmbed({
      title: "✏️ Nachricht bearbeitet",
      description: `In <#${newMsg.channelId}> wurde eine Nachricht bearbeitet.`,
      user: newMsg.author,
      color: 0xfee75c,
      fields: [
        { name: "Autor", value: `${newMsg.author} (${newMsg.author.tag})`, inline: false },
        { name: "Vorher", value: oldMsg.content?.slice(0, 1000) || "*(leer)*", inline: false },
        { name: "Nachher", value: newMsg.content?.slice(0, 1000) || "*(leer)*", inline: false }
      ]
    });

    await sendLog(newMsg.guild, "message_log", embed);
  }
};
