const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");
const { buildTemplateSelect } = require("../utils/templateSelect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban (mit Dropdown)")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("user").setDescription("Mitglied").setRequired(true))
    .addIntegerOption(o => o.setName("delete_days").setDescription("Nachrichten löschen (0-7 Tage)").setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const delDays = interaction.options.getInteger("delete_days") ?? 0;
    if (delDays < 0 || delDays > 7) return interaction.reply({ content: "❌ delete_days muss 0-7 sein.", flags: 64 });

    const customId = `tmpl:ban:${interaction.user.id}:${target.id}:${delDays}`;
    const row = buildTemplateSelect(interaction.guildId, "ban", customId, "Ban-Vorlage auswählen");

    if (!row) return interaction.reply({ content: "📭 Keine Ban-Vorlagen vorhanden. Nutze /modtemplate add type:ban ...", flags: 64 });

    interaction.client.selectHandlers.set(customId, async (menuInteraction) => {
      const parts = menuInteraction.customId.split(":");
      const modId = parts[2];
      const targetId = parts[3];
      const deleteDays = parseInt(parts[4] || "0", 10);

      if (menuInteraction.user.id !== modId) return menuInteraction.reply({ content: "❌ Nicht dein Menü.", flags: 64 });

      const templateId = parseInt(menuInteraction.values[0], 10);
      const t = getTemplate(menuInteraction.guildId, templateId);
      if (!t || t.type !== "ban") return menuInteraction.reply({ content: "❌ Template ungültig.", flags: 64 });

      try { await target.send(`🔨 Ban von **${menuInteraction.guild.name}**\n${t.dmText}`); } catch {}

      await menuInteraction.guild.members.ban(targetId, {
        reason: t.reason,
        deleteMessageSeconds: deleteDays * 86400
      }).catch(async () => {
        await menuInteraction.reply({ content: "❌ Ban fehlgeschlagen (Rechte?).", flags: 64 }).catch(()=>{});
      });

      await menuInteraction.update({ content: `✅ ${target} gebannt (Vorlage: **${t.name}**)`, components: [] });
      menuInteraction.client.selectHandlers.delete(customId);
    });

    return interaction.reply({ content: `Wähle eine Ban-Vorlage für ${target}:`, components: [row], flags: 64 });
  }
};
