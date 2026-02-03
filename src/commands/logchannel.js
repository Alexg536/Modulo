const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { getGuild, setGuild } = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logchannel")
    .setDescription("Setzt den Log-Kanal für einen Logtyp")
    .addStringOption(o =>
      o.setName("typ")
        .setDescription("Welcher Logtyp?")
        .setRequired(true)
        .addChoices(
          { name: "Join/Leave", value: "join_leave" },
          { name: "Role Updates", value: "role_updates" },
          { name: "Message Log", value: "message_log" },
          { name: "Mod Actions (timeout/ban/kick)", value: "mod_actions" }
        )
    )
    .addChannelOption(o =>
      o.setName("kanal")
        .setDescription("In welchen Kanal sollen die Logs?")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    const typ = interaction.options.getString("typ", true);
    const kanal = interaction.options.getChannel("kanal", true);

    const current = getGuild(interaction.guild.id) || {};
    const updated = setGuild(interaction.guild.id, {
      ...current,
      logChannels: { ...(current.logChannels || {}), [typ]: kanal.id }
    });

    await interaction.editReply(`✅ Logtyp **${typ}** sendet jetzt nach ${kanal}.`);
  }
};
