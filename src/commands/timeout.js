const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");
const { bumpTimeout } = require("../utils/punishStore");
const { buildTemplateSelect } = require("../utils/templateSelect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout setzen (mit Dropdown)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("Mitglied").setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser("user");

    const customId = `tmpl:timeout:${interaction.user.id}:${target.id}`;
    const row = buildTemplateSelect(interaction.guildId, "timeout", customId, "Timeout-Vorlage auswählen");

    if (!row) return interaction.reply({ content: "📭 Keine Timeout-Vorlagen vorhanden. Nutze /modtemplate add type:timeout ... minutes:60", flags: 64 });

    interaction.client.selectHandlers.set(customId, async (menuInteraction) => {
      const [, type, modId, targetId] = menuInteraction.customId.split(":");
      if (menuInteraction.user.id !== modId) return menuInteraction.reply({ content: "❌ Nicht dein Menü.", flags: 64 });

      const templateId = parseInt(menuInteraction.values[0], 10);
      const t = getTemplate(menuInteraction.guildId, templateId);
      if (!t || t.type !== "timeout") return menuInteraction.reply({ content: "❌ Template ungültig.", flags: 64 });

      const member = await menuInteraction.guild.members.fetch(targetId).catch(()=>null);
      if (!member) return menuInteraction.reply({ content: "❌ Member nicht gefunden.", flags: 64 });

      const ms = (t.durationMinutes || 0) * 60 * 1000;
      if (!ms) return menuInteraction.reply({ content: "❌ Timeout Template hat keine minutes.", flags: 64 });

      await member.timeout(ms, t.reason).catch(async () => {
        await menuInteraction.reply({ content: "❌ Timeout fehlgeschlagen (Rechte?).", flags: 64 }).catch(()=>{});
      });

      bumpTimeout(menuInteraction.guildId, targetId, { ts: Date.now(), moderatorId: modId, reason: t.reason, templateId });

      try { await target.send(`⏳ Timeout auf **${menuInteraction.guild.name}**\nDauer: ${t.durationMinutes} Minuten\n${t.dmText}`); } catch {}

      await menuInteraction.update({ content: `✅ Timeout gesetzt: ${target} (**${t.durationMinutes}m**, Vorlage: **${t.name}**)`, components: [] });
      menuInteraction.client.selectHandlers.delete(customId);
    });

    return interaction.reply({ content: `Wähle eine Timeout-Vorlage für ${target}:`, components: [row], flags: 64 });
  }
};
