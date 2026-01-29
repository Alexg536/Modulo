const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");

const EPHEMERAL = 64;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("counting")
    .setDescription("Counting Kanal festlegen")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(opt =>
      opt.setName("channel")
        .setDescription("Channel für das Counting")
        .setRequired(true)
    )
    .addBooleanOption(opt =>
      opt.setName("reset")
        .setDescription("Setzt den Counting Fortschritt zurück (Start wieder bei 1)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const reset = interaction.options.getBoolean("reset") ?? false;

    const cfg = getGuildConfig(interaction.guildId);

    cfg.counting = cfg.counting || {};
    cfg.counting.channelId = channel.id;

    if (reset) {
      cfg.counting.lastNumber = 0;
      cfg.counting.lastUserId = null;
      cfg.counting.maxNumber = 0;
    } else {
      cfg.counting.lastNumber = cfg.counting.lastNumber ?? 0;
      cfg.counting.lastUserId = cfg.counting.lastUserId ?? null;
      cfg.counting.maxNumber = cfg.counting.maxNumber ?? cfg.counting.lastNumber ?? 0;
    }

    setGuildConfig(interaction.guildId, cfg);

    const msg = reset
      ? `✅ Counting Kanal gesetzt: ${channel}\n🔁 Fortschritt wurde zurückgesetzt. Start wieder bei **1**.`
      : `✅ Counting Kanal gesetzt: ${channel}\nAktueller Stand: **${cfg.counting.lastNumber || 0}**`;

    return interaction.reply({ content: msg, flags: EPHEMERAL });
  }
};
