const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");
const { footer } = require("../utils/branding");

const EPHEMERAL = 64;

function panelEmbed() {
  return new EmbedBuilder()
    .setTitle("💡 Vorschläge")
    .setDescription(
      "Hier kannst du Vorschläge für den Server einreichen.\n\n" +
      "➡️ Klicke unten auf **🎟️ Vorschlag einreichen**"
    )
    .setFooter(footer())
    .setTimestamp(new Date());
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vorschlagpanel")
    .setDescription("Vorschlag-Panel verwalten")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sc =>
      sc.setName("set")
        .setDescription("Panel in einem Channel posten")
        .addChannelOption(o => o.setName("channel").setDescription("Channel für das Panel").setRequired(true))
    )
    .addSubcommand(sc =>
      sc.setName("remove")
        .setDescription("Panel-Einstellungen löschen")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const cfg = getGuildConfig(interaction.guildId);
    cfg.panels = cfg.panels || {};

    if (sub === "remove") {
      delete cfg.panels.suggestions;
      setGuildConfig(interaction.guildId, cfg);
      return interaction.reply({ content: "✅ Vorschlag-Panel wurde entfernt.", flags: EPHEMERAL });
    }

    const channel = interaction.options.getChannel("channel");

    // Nur Textkanäle / Ankündigung / Forum etc. erlauben
    if (!channel || !("send" in channel)) {
      return interaction.reply({ content: "❌ Bitte einen Text-Channel auswählen.", flags: EPHEMERAL });
    }

    // Rechte check
    const me = interaction.guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has(["ViewChannel", "SendMessages", "EmbedLinks"])) {
      return interaction.reply({
        content: "❌ Ich brauche im Ziel-Channel: **ViewChannel**, **SendMessages**, **EmbedLinks**.",
        flags: EPHEMERAL
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("suggest:open")
        .setLabel("🎟️ Vorschlag einreichen")
        .setStyle(ButtonStyle.Primary)
    );

    const msg = await channel.send({ embeds: [panelEmbed()], components: [row] });

    cfg.panels.suggestions = {
      channelId: channel.id,
      messageId: msg.id
    };

    setGuildConfig(interaction.guildId, cfg);

    return interaction.reply({
      content: `✅ Vorschlag-Panel wurde in ${channel} gepostet.`,
      flags: EPHEMERAL
    });
  }
};
