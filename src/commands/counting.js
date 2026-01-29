const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("counting")
    .setDescription("Counting Game verwalten")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName("set")
        .setDescription("Counting Channel setzen")
        .addChannelOption(opt =>
          opt.setName("channel")
            .setDescription("Channel für das Counting")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName("reset")
        .setDescription("Counting zurücksetzen (Start wieder bei 1)")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const cfg = getGuildConfig(interaction.guildId);

    if (sub === "set") {
      const ch = interaction.options.getChannel("channel");
      cfg.counting.channelId = ch.id;
      cfg.counting.lastNumber = 0;
      cfg.counting.lastUserId = null;
      setGuildConfig(interaction.guildId, cfg);
      return interaction.reply({ content: `✅ Counting Channel gesetzt: ${ch}\nStart ist jetzt wieder bei **1**.`, flags: 64 });
    }

    if (sub === "reset") {
      cfg.counting.lastNumber = 0;
      cfg.counting.lastUserId = null;
      setGuildConfig(interaction.guildId, cfg);
      return interaction.reply({ content: "✅ Counting wurde zurückgesetzt. Nächste Zahl ist **1**.", flags: 64 });
    }
  }
};
