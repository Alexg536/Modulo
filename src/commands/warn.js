const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");
const { bumpWarn } = require("../utils/punishStore");
const { buildTemplateSelect } = require("../utils/templateSelect");

const EPHEMERAL = 64;

async function respond(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Verwarnung vergeben (Dropdown + optionaler Grund)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("user").setDescription("Mitglied").setRequired(true))
    .addStringOption((o) => o.setName("grund").setDescription("Optional: eigener Grund (überschreibt Template)").setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const reasonOverride = interaction.options.getString("grund");

    const customId = `tmpl:warn:${interaction.user.id}:${target.id}:${Date.now()}`;
    const row = buildTemplateSelect(interaction.guildId, "warn", customId, "Warn-Vorlage auswählen");

    if (!row) {
      return respond(interaction, {
        content: "📭 Keine Warn-Vorlagen vorhanden. Nutze /modtemplate add type:warn ...",
        flags: EPHEMERAL,
      });
    }

    interaction.client.pendingMod.set(customId, { reasonOverride });

    interaction.client.selectHandlers.set(customId, async (menuInteraction) => {
      const parts = menuInteraction.customId.split(":");
      const modId = parts[2];

      if (menuInteraction.user.id !== modId) {
        return menuInteraction.reply({ content: "❌ Nicht dein Menü.", flags: EPHEMERAL });
      }

      const templateId = parseInt(menuInteraction.values[0], 10);
      const t = getTemplate(menuInteraction.guildId, templateId);
      if (!t || t.type !== "warn") {
        return menuInteraction.reply({ content: "❌ Template ungültig.", flags: EPHEMERAL });
      }

      const pending = menuInteraction.client.pendingMod.get(customId) || {};
      const finalReason = pending.reasonOverride?.trim() ? pending.reasonOverride.trim() : (t.reason || "—");
      const dmText = t.dmText || "—";

      bumpWarn(menuInteraction.guildId, target.id, {
        ts: Date.now(),
        moderatorId: modId,
        reason: finalReason,
        templateId,
      });

      try {
        await target.send(`⚠️ Verwarnung auf **${menuInteraction.guild.name}**\nGrund: ${finalReason}\n\n${dmText}`);
      } catch {}

      await menuInteraction.update({
        content: `✅ ${target} verwarnt (Vorlage: **${t.name}**)\nGrund: **${finalReason}**`,
        components: [],
      });

      menuInteraction.client.selectHandlers.delete(customId);
      menuInteraction.client.pendingMod.delete(customId);
    });

    return respond(interaction, {
      content: `Wähle eine Warn-Vorlage für ${target}.\n${reasonOverride ? `📝 Eigener Grund gesetzt: **${reasonOverride}**` : ""}`,
      components: [row],
      flags: EPHEMERAL,
    });
  },
};
