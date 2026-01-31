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
    .setName("kick")
    .setDescription("Kick (Dropdown + optionaler Grund)")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName("user").setDescription("Mitglied").setRequired(true))
    .addStringOption((o) => o.setName("grund").setDescription("Optional: eigener Grund (überschreibt Template)").setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const reasonOverride = interaction.options.getString("grund");

    const customId = `tmpl:kick:${interaction.user.id}:${target.id}:${Date.now()}`;
    const row = buildTemplateSelect(interaction.guildId, "kick", customId, "Kick-Vorlage auswählen");

    if (!row) {
      return respond(interaction, {
        content: "📭 Keine Kick-Vorlagen vorhanden. Nutze /modtemplate add type:kick ...",
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
      if (!t || t.type !== "kick") {
        return menuInteraction.reply({ content: "❌ Template ungültig.", flags: EPHEMERAL });
      }

      const member = await menuInteraction.guild.members.fetch(target.id).catch(() => null);
      if (!member) return menuInteraction.reply({ content: "❌ Member nicht gefunden.", flags: EPHEMERAL });

      const pending = menuInteraction.client.pendingMod.get(customId) || {};
      const finalReason = pending.reasonOverride?.trim() ? pending.reasonOverride.trim() : (t.reason || "—");
      const dmText = t.dmText || "—";

      try {
        await target.send(`👢 Kick von **${menuInteraction.guild.name}**\nGrund: ${finalReason}\n\n${dmText}`);
      } catch {}

      await member.kick(finalReason).catch(async () => {
        await menuInteraction.reply({ content: "❌ Kick fehlgeschlagen (Rechte?).", flags: EPHEMERAL }).catch(() => {});
      });

      await menuInteraction.update({
        content: `✅ ${target} gekickt (Vorlage: **${t.name}**)\nGrund: **${finalReason}**`,
        components: [],
      });

      menuInteraction.client.selectHandlers.delete(customId);
      menuInteraction.client.pendingMod.delete(customId);
    });

    return respond(interaction, {
      content: `Wähle eine Kick-Vorlage für ${target}.\n${reasonOverride ? `📝 Eigener Grund gesetzt: **${reasonOverride}**` : ""}`,
      components: [row],
      flags: EPHEMERAL,
    });
  },
};
