const { EmbedBuilder } = require("discord.js");

function userThumb(user) {
  try {
    return user?.displayAvatarURL({ size: 256, extension: "png" }) || null;
  } catch {
    return null;
  }
}

function makeLogEmbed({ title, description, user, color = 0x2b2d31, fields = [] }) {
  const e = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description || null)
    .setColor(color)
    .setTimestamp();

  // ✅ oben rechts: User-Bild
  const thumb = userThumb(user);
  if (thumb) e.setThumbnail(thumb);

  if (fields?.length) e.addFields(fields);

  return e;
}

module.exports = { makeLogEmbed };
