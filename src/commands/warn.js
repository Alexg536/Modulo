const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");
const { bumpWarn } = require("../utils/punishStore");
const { buildTemplateSelect } = require("../utils/templateSelect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Verwarnung vergeben (mit Dropdown)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("Mitglied").setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser("user");

    const customId = `tmpl:warn:${interaction.user.id}:${target.id}`;
    const row = buildTemplateSelect(interaction.guildId, "warn", customId, "Warn-Vorlage auswählen");

    if (!row) return interaction.reply({ content: "📭 Keine Warn-Vorlagen vorhanden. Nutze /modtemplate add type:warn ...", flags: 64 });

    // Handler registrieren
    interaction.client.selectHandlers.set(customId, async (menuInteraction) => {
      // nur der Moderator darf klicken
      const [, type, modId, targetId] = menuInteraction.customId.split(":");
      if (menuInteraction.user.id !== modId) return menuInteraction.reply({ content: "❌ Nicht dein Menü.", flags: 64 });

      const templateId = parseInt(menuInteraction.values[0], 10);
      const t = getTemplate(menuInteraction.guildId, templateId);
      if (!t || t.type !== "warn") return menuInteraction.reply({ content: "❌ Template ungültig.", flags: 64 });

      bumpWarn(menuInteraction.guildId, targetId, { ts: Date.now(), moderatorId: modId, reason: t.reason, templateId });

      try { await target.send(`⚠️ Verwarnung auf **${menuInteraction.guild.name}**\n${t.dmText}`); } catch {}

      await menuInteraction.update({ content: `✅ ${target} verwarnt (Vorlage: **${t.name}**)`, components: [] });

      // handler cleanup
      menuInteraction.client.selectHandlers.delete(customId);
    });

    return interaction.reply({ content: `Wähle eine Warn-Vorlage für ${target}:`, components: [row], flags: 64 });
  }
};
