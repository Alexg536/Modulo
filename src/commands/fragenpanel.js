const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");
const { respond } = require("../utils/respond");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fragenpanel")
    .setDescription("Panel für anonyme Fragen")
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
    const panelChannel = interaction.options.getChannel("channel");
    const threadChannel = interaction.options.getChannel("threadchannel");

    const cfg = getGuildConfig(interaction.guildId);
    cfg.question.panelChannelId = panelChannel.id;
    cfg.question.threadChannelId = threadChannel.id;

    const msg = await panelChannel.send({
      embeds: [helpers.buildPanelEmbed("question")],
      components: [helpers.buildPanelButtons("question")]
    });

    cfg.question.panelMessageId = msg.id;
    setGuildConfig(interaction.guildId, cfg);

    return respond(interaction, { content: `✅ Fragen-Panel gesendet in ${panelChannel}`, flags: 64 });
  }
};
