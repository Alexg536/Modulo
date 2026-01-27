const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("modlogs")
    .setDescription("Setzt den Log-Channel für Server- & Moderations-Logs")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName("set")
        .setDescription("Log-Channel setzen")
        .addChannelOption(opt =>
          opt.setName("channel")
            .setDescription("Channel für Logs")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const ch = interaction.options.getChannel("channel");
    const cfg = getGuildConfig(interaction.guildId);
    cfg.modLogChannelId = ch.id;
    setGuildConfig(interaction.guildId, cfg);
    await interaction.reply({ content: `✅ Mod-Logs Channel gesetzt: ${ch}`, flags: 64 });
  }
};
