const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");

const LOG_TYPES = [
  { name: "Join", value: "join" },
  { name: "Leave", value: "leave" },
  { name: "Role update", value: "role" },
  { name: "Message delete", value: "msg_delete" },
  { name: "Message edit", value: "msg_edit" },
  { name: "Voice join", value: "voice_join" },
  { name: "Voice leave", value: "voice_leave" },
  { name: "Timeout", value: "timeout" },
  { name: "Kick", value: "kick" },
  { name: "Ban", value: "ban" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logchannel")
    .setDescription("Setze pro Logtyp einen eigenen Kanal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName("typ")
        .setDescription("Welcher Logtyp?")
        .setRequired(true)
        .addChoices(...LOG_TYPES)
    )
    .addChannelOption(opt =>
      opt.setName("kanal")
        .setDescription("Kanal für diesen Logtyp")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName("off")
        .setDescription("Logtyp deaktivieren")
        .setRequired(false)
    ),

  async execute(interaction) {
    const typ = interaction.options.getString("typ");
    const kanal = interaction.options.getChannel("kanal");
    const off = interaction.options.getBoolean("off") || false;

    const cfg = getGuildConfig(interaction.guildId);

    if (off) {
      delete cfg.logChannels[typ];
      setGuildConfig(interaction.guildId, cfg);
      return interaction.reply({ content: `✅ Logtyp **${typ}** ist jetzt **aus**.`, flags: 64 });
    }

    if (!kanal) {
      const current = cfg.logChannels[typ] ? `<#${cfg.logChannels[typ]}>` : "—";
      return interaction.reply({ content: `ℹ️ Aktueller Kanal für **${typ}**: ${current}\nSetze ihn mit: /logchannel typ:${typ} kanal:#dein-kanal`, flags: 64 });
    }

    cfg.logChannels[typ] = kanal.id;
    setGuildConfig(interaction.guildId, cfg);
    return interaction.reply({ content: `✅ Logtyp **${typ}** → ${kanal}`, flags: 64 });
  }
};
