const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");
const { buildTemplateSelect } = require("../utils/templateSelect");

const EPHEMERAL = 64;

async function respond(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban (Dropdown + optionaler Grund)")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName("user").setDescription("Mitglied").setRequired(true))
    .addIntegerOption((o) => o.setName("delete_days").setDescription("Nachrichten löschen (0-7 Tage)").setRequired(false))
    .addStringOption((o) => o.setName("grund").setDescription("Optional: eigener Grund (überschreibt Template)").setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const delDays = interaction.options.getInteger("delete_days") ?? 0;
    const reasonOverride = interaction.options.getString("grund");

    if (delDays < 0 || delDays > 7) {
      return respond(interaction, { content: "❌ delete_days muss 0-7 sein.", flags: EPHEMERAL });
    }

    const customId = `tmpl:ban:${interaction.user.id}:${target.id}:${Date.now()}:${delDays}`;
    const row = buildTemplateSelect(interaction.guildId, "ban", customId, "Ban-Vorlage auswählen");

    if (!row) {
      return respond(interaction, { content: "📭 Keine Ban-Vorlagen vorhanden. Nutze /modtemplate add type:ban ...", flags: EPHEMERAL });
    }

    interaction.client.pendingMod.set(customId, { reasonOverride });

    interaction.client.selectHandlers.set(customId, async (menuInteraction) => {
      const parts = menuInteraction.customId.split(":");
      const modId = parts[2];
      const deleteDays = parseInt(parts[5] || "0", 10);

      if (menuInteraction.user.id !== modId) {
        return menuInteraction.reply({ content: "❌ Nicht dein Menü.", flags: EPHEMERAL });
      }

      const templateId = parseInt(menuInteraction.values[0], 10);
      const t = getTemplate(menuInteraction.guildId, templateId);
      if (!t || t.type !== "ban") {
        return menuInteraction.reply({ content: "❌ Template ungültig.", flags: EPHEMERAL });
      }

      const pending = menuInteraction.client.pendingMod.get(customId) || {};
      const finalReason = pending.reasonOverride?.trim() ? pending.reasonOverride.trim() : (t.reason || "—");
      const dmText = t.dmText || "—";

      try {
        await target.send(`🔨 Ban von **${menuInteraction.guild.name}**\nGrund: ${finalReason}\n\n${dmText}`);
      } catch {}

      await menuInteraction.guild.members.ban(target.id, {
        reason: finalReason,
        deleteMessageSeconds: deleteDays * 86400,
      }).catch(async () => {
        await menuInteraction.reply({ content: "❌ Ban fehlgeschlagen (Rechte?).", flags: EPHEMERAL }).catch(() => {});
      });

      await menuInteraction.update({
        content: `✅ ${target} gebannt (Vorlage: **${t.name}**)\nGrund: **${finalReason}**`,
        components: [],
      });

      menuInteraction.client.selectHandlers.delete(customId);
      menuInteraction.client.pendingMod.delete(customId);
    });

    return respond(interaction, {
      content: `Wähle eine Ban-Vorlage für ${target}.\n${reasonOverride ? `📝 Eigener Grund gesetzt: **${reasonOverride}**` : ""}`,
      components: [row],
      flags: EPHEMERAL,
    });
  },
};
