const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");
const { bumpWarn, boardWarn } = require("../utils/punishStore");
const { footer } = require("../utils/branding");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Verwarnungen")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

    .addSubcommand(sub =>
      sub.setName("add")
        .setDescription("Warn hinzufügen (per Template-ID)")
        .addUserOption(o => o.setName("user").setDescription("Mitglied").setRequired(true))
        .addIntegerOption(o => o.setName("template").setDescription("Template-ID (type=warn)").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("list")
        .setDescription("Warn-Liste (Top)")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === "add") {
      const user = interaction.options.getUser("user");
      const templateId = interaction.options.getInteger("template");
      const t = getTemplate(guildId, templateId);

      if (!t || t.type !== "warn") return interaction.reply({ content: "❌ Warn-Template-ID ungültig.", flags: 64 });

      // speichern count
      bumpWarn(guildId, user.id, { ts: Date.now(), moderatorId: interaction.user.id, reason: t.reason, templateId });

      // DM
      try { await user.send(`⚠️ Verwarnung auf **${interaction.guild.name}**\nGrund: ${t.dmText}`); } catch {}

      // Response
      return interaction.reply({ content: `✅ ${user} verwarnt (Template: **${t.name}**)`, flags: 64 });
    }

    if (sub === "list") {
      const board = boardWarn(guildId).sort((a,b)=>b.count-a.count).slice(0, 15);
      if (!board.length) return interaction.reply({ content: "📭 Keine Verwarnungen gespeichert.", flags: 64 });

      const lines = board.map((x,i)=>`${i+1}. <@${x.userId}> — **${x.count}**`).join("\n");
      const e = new EmbedBuilder().setTitle("⚠️ Warn-Liste (Top 15)").setDescription(lines).setFooter(footer()).setTimestamp(new Date());
      return interaction.reply({ embeds: [e], flags: 64 });
    }
  }
};
