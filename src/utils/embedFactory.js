const { EmbedBuilder } = require("discord.js");

const BRAND_NAME = process.env.MODULO_BRAND_NAME || "MODULO";
const BRAND_LOGO = process.env.MODULO_LOGO_URL || null;

// Base Embed (automatisch gebrandet)
function createEmbed({ title, description, color = 0x2b2d31, fields = [] } = {}) {
  const e = new EmbedBuilder()
    .setColor(color)
    .setTimestamp();

  if (title) e.setTitle(title);
  if (description) e.setDescription(description);
  if (fields?.length) e.addFields(fields);

  // ✅ Branding automatisch
  if (BRAND_LOGO) {
    e.setFooter({ text: `${BRAND_NAME} • Discord Bot`, iconURL: BRAND_LOGO });
  } else {
    e.setFooter({ text: `${BRAND_NAME} • Discord Bot` });
  }

  return e;
}

// Branding auf bestehendes Embed anwenden (falls du mal eins “von außen” bekommst)
function brandEmbed(embed) {
  if (!embed) return embed;

  if (BRAND_LOGO) {
    embed.setFooter({ text: `${BRAND_NAME} • Discord Bot`, iconURL: BRAND_LOGO });
  } else {
    embed.setFooter({ text: `${BRAND_NAME} • Discord Bot` });
  }
  if (!embed.data?.timestamp) embed.setTimestamp();
  if (!embed.data?.color) embed.setColor(0x2b2d31);

  return embed;
}

module.exports = { createEmbed, brandEmbed };
