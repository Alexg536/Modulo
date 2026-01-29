const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");
const { footer } = require("../utils/branding");

const EPHEMERAL = 64;

function panelEmbed() {
  return new EmbedBuilder()
    .setTitle("❓ Anonyme Fragen")
    .setDescription(
      "Du hast Fragen zur Community oder zu LGBTQ+ Themen?\n\n" +
      "➡️ Klicke unten auf **🎟️ Frage einreichen**\n" +
      "Unser Team versucht, so schnell wie möglich zu antworten."
    )
    .setFooter(footer())
    .setTimestamp(new Date());
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fragenpanel")
    .setDescription("Fragen-Panel verwalten")
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
      delete cfg.panels.questions;
      setGuildConfig(interaction.guildId, cfg);
      return interaction.reply({ content: "✅ Fragen-Panel wurde entfernt.", flags: EPHEMERAL });
    }

    const channel = interaction.options.getChannel("channel");

    if (!channel || !("send" in channel)) {
      return interaction.reply({ content: "❌ Bitte einen Text-Channel auswählen.", flags: EPHEMERAL });
    }

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
        .setCustomId("question:open")
        .setLabel("🎟️ Frage einreichen")
        .setStyle(ButtonStyle.Primary)
    );

    const msg = await channel.send({ embeds: [panelEmbed()], components: [row] });

    cfg.panels.questions = {
      channelId: channel.id,
      messageId: msg.id
    };

    setGuildConfig(interaction.guildId, cfg);

    return interaction.reply({
      content: `✅ Fragen-Panel wurde in ${channel} gepostet.`,
      flags: EPHEMERAL
    });
  }
};
