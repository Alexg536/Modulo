const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");
const { buildTemplateSelect } = require("../utils/templateSelect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick (mit Dropdown)")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName("user").setDescription("Mitglied").setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser("user");

    const customId = `tmpl:kick:${interaction.user.id}:${target.id}`;
    const row = buildTemplateSelect(interaction.guildId, "kick", customId, "Kick-Vorlage auswählen");

    if (!row) return interaction.reply({ content: "📭 Keine Kick-Vorlagen vorhanden. Nutze /modtemplate add type:kick ...", flags: 64 });

    interaction.client.selectHandlers.set(customId, async (menuInteraction) => {
      const [, type, modId, targetId] = menuInteraction.customId.split(":");
      if (menuInteraction.user.id !== modId) return menuInteraction.reply({ content: "❌ Nicht dein Menü.", flags: 64 });

      const templateId = parseInt(menuInteraction.values[0], 10);
      const t = getTemplate(menuInteraction.guildId, templateId);
      if (!t || t.type !== "kick") return menuInteraction.reply({ content: "❌ Template ungültig.", flags: 64 });

      const member = await menuInteraction.guild.members.fetch(targetId).catch(()=>null);
      if (!member) return menuInteraction.reply({ content: "❌ Member nicht gefunden.", flags: 64 });

      try { await target.send(`👢 Kick von **${menuInteraction.guild.name}**\n${t.dmText}`); } catch {}
      await member.kick(t.reason).catch(async () => {
        await menuInteraction.reply({ content: "❌ Kick fehlgeschlagen (Rechte?).", flags: 64 }).catch(()=>{});
      });

      await menuInteraction.update({ content: `✅ ${target} gekickt (Vorlage: **${t.name}**)`, components: [] });
      menuInteraction.client.selectHandlers.delete(customId);
    });

    return interaction.reply({ content: `Wähle eine Kick-Vorlage für ${target}:`, components: [row], flags: 64 });
  }
};
