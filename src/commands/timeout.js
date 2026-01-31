const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");
const { bumpTimeout } = require("../utils/punishStore");
const { buildTemplateSelect } = require("../utils/templateSelect");

const EPHEMERAL = 64;

async function respond(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout setzen (Dropdown + optionaler Grund)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("user").setDescription("Mitglied").setRequired(true))
    .addStringOption((o) => o.setName("grund").setDescription("Optional: eigener Grund (überschreibt Template)").setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const reasonOverride = interaction.options.getString("grund");

    const customId = `tmpl:timeout:${interaction.user.id}:${target.id}:${Date.now()}`;
    const row = buildTemplateSelect(interaction.guildId, "timeout", customId, "Timeout-Vorlage auswählen");

    if (!row) {
      return respond(interaction, {
        content: "📭 Keine Timeout-Vorlagen vorhanden. Nutze /modtemplate add type:timeout ... minutes:10",
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
      if (!t || t.type !== "timeout") {
        return menuInteraction.reply({ content: "❌ Template ungültig.", flags: EPHEMERAL });
      }

      const member = await menuInteraction.guild.members.fetch(target.id).catch(() => null);
      if (!member) return menuInteraction.reply({ content: "❌ Member nicht gefunden.", flags: EPHEMERAL });

      const minutes = t.durationMinutes || 0;
      const ms = minutes * 60 * 1000;
      if (!ms) return menuInteraction.reply({ content: "❌ Timeout Template hat keine minutes.", flags: EPHEMERAL });

      const pending = menuInteraction.client.pendingMod.get(customId) || {};
      const finalReason = pending.reasonOverride?.trim() ? pending.reasonOverride.trim() : (t.reason || "—");
      const dmText = t.dmText || "—";

      await member.timeout(ms, finalReason).catch(async () => {
        await menuInteraction.reply({ content: "❌ Timeout fehlgeschlagen (Rechte?).", flags: EPHEMERAL }).catch(() => {});
      });

      bumpTimeout(menuInteraction.guildId, target.id, {
        ts: Date.now(),
        moderatorId: modId,
        reason: finalReason,
        templateId,
      });

      try {
        await target.send(`⏳ Timeout auf **${menuInteraction.guild.name}**\nDauer: ${minutes} Minuten\nGrund: ${finalReason}\n\n${dmText}`);
      } catch {}

      await menuInteraction.update({
        content: `✅ Timeout gesetzt: ${target} (**${minutes}m**, Vorlage: **${t.name}**)\nGrund: **${finalReason}**`,
        components: [],
      });

      menuInteraction.client.selectHandlers.delete(customId);
      menuInteraction.client.pendingMod.delete(customId);
    });

    return respond(interaction, {
      content: `Wähle eine Timeout-Vorlage für ${target}.\n${reasonOverride ? `📝 Eigener Grund gesetzt: **${reasonOverride}**` : ""}`,
      components: [row],
      flags: EPHEMERAL,
    });
  },
};
