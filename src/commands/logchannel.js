const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");
const { respond } = require("../utils/respond");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logchannel")
    .setDescription("Setzt den Log-Channel für Fragen/Vorschläge")
    .addSubcommand(sub =>
      sub.setName("set")
        .setDescription("Log-Channel setzen")
        .addChannelOption(opt =>
          opt.setName("channel")
            .setDescription("Log-Channel (nur Team)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const cfg = getGuildConfig(interaction.guildId);
    cfg.logChannelId = channel.id;
    setGuildConfig(interaction.guildId, cfg);

    return respond(interaction, { content: `✅ Log-Channel gesetzt: ${channel}`, flags: 64 });
  }
};
