const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");
const { respond } = require("../utils/respond");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vorschlagpanel")
    .setDescription("Panel für Vorschläge")
    .addSubcommand(sub =>
      sub.setName("set")
        .setDescription("Panel senden und Channel speichern")
        .addChannelOption(opt =>
          opt.setName("channel")
            .setDescription("Channel, wo das Panel hin soll")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName("threadchannel")
            .setDescription("Channel, in dem Threads erstellt werden sollen")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
    ),

  async execute(interaction, helpers) {
    const panelChannel = await interaction.options.getChannel("channel");
    const threadChannel = await interaction.options.getChannel("threadchannel");

    const cfg = getGuildConfig(interaction.guildId);
    cfg.suggestion.panelChannelId = panelChannel.id;
    cfg.suggestion.threadChannelId = threadChannel.id;

    const msg = await panelChannel.send({
      embeds: [helpers.buildPanelEmbed("suggestion")],
      components: [helpers.buildPanelButtons("suggestion")]
    });

    cfg.suggestion.panelMessageId = msg.id;
    setGuildConfig(interaction.guildId, cfg);

    return respond(interaction, { content: `✅ Vorschlags-Panel gesendet in ${panelChannel}`, flags: 64 });
  }
};
