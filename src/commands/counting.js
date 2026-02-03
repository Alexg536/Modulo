const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { getGuild, setGuild } = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("counting")
    .setDescription("Setzt den Counting-Kanal")
    .addChannelOption(o =>
      o.setName("kanal")
        .setDescription("Counting-Kanal auswählen")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addBooleanOption(o =>
      o.setName("reset")
        .setDescription("Zähler zurücksetzen?")
        .setRequired(false)
    ),

  async execute(interaction) {
    const kanal = interaction.options.getChannel("kanal", true);
    const reset = interaction.options.getBoolean("reset") ?? false;

    const current = getGuild(interaction.guild.id) || {};
    const counting = current.counting || { channelId: null, lastNumber: 0, lastUserId: null, seenNumbers: [] };

    setGuild(interaction.guild.id, {
      ...current,
      counting: {
        ...counting,
        channelId: kanal.id,
        ...(reset ? { lastNumber: 0, lastUserId: null, seenNumbers: [] } : {})
      }
    });

    await interaction.editReply(`✅ Counting ist jetzt in ${kanal}${reset ? " (reset ✅)" : ""}.`);
  }
};
