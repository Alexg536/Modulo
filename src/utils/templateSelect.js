const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { listTemplates } = require("./modTemplates");

function buildTemplateSelect(guildId, type, customId, placeholder) {
  const templates = listTemplates(guildId, type).slice(0, 25);

  if (!templates.length) return null;

  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(
      templates.map(t => ({
        label: t.name.length > 100 ? t.name.slice(0, 100) : t.name,
        description: (t.reason || "—").slice(0, 100),
        value: String(t.id),
      }))
    );

  return new ActionRowBuilder().addComponents(menu);
}

module.exports = { buildTemplateSelect };
