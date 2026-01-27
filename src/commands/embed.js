const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");

// Branding fest im Code
const MODULO_NAME = "MODULO";
// Wenn du noch keine echte Direct-URL hast, lass es leer:
const MODULO_ICON = "https://cdn.discordapp.com/attachments/1457517538601603307/1457811095606661140/MODULO-logo-slogen-klein_1.png?ex=6977b9e2&is=69766862&hm=49261ab3b70a5e544948bf3afdd4536820882c42f419323244527fb7310ece16&"; // z.B. "https://cdn.discordapp.com/attachments/.../logo.png"

function normalizeHex(input) {
  if (!input) return null;
  const cleaned = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return cleaned.toLowerCase();
}

function isValidImageUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) && /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(u.pathname + u.search);
  } catch {
    return false;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Sendet ein MODULO Premium-Embed")

    // REQUIRED zuerst
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Channel, in dem das Embed gesendet wird")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("headline").setDescription("Überschrift").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("text").setDescription("Text / Inhalt").setRequired(true)
    )

    // OPTIONAL danach
    .addMentionableOption((opt) =>
      opt.setName("ping").setDescription("Optional: Rolle oder User pingen").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("color").setDescription("Optional: HEX Farbe z.B. #800080").setRequired(false)
    )
    .addAttachmentOption((opt) =>
      opt.setName("picture").setDescription("Optional: Bild hochladen (unten im Embed)").setRequired(false)
    ),

  async execute(interaction) {
    // ✅ SOFORT antworten (damit Discord die Interaction nicht verliert)
    await interaction.reply({ content: "⏳ Sende dein Embed…", flags: 64 });

    const channel = interaction.options.getChannel("channel");
    const headline = interaction.options.getString("headline");
    const text = interaction.options.getString("text");
    const ping = interaction.options.getMentionable("ping");
    const colorInput = interaction.options.getString("color");
    const picture = interaction.options.getAttachment("picture");

    const hex = normalizeHex(colorInput);
    if (colorInput && !hex) {
      return interaction.editReply("❌ Ungültige Farbe. Bitte HEX wie `#800080` nutzen.");
    }

    const embed = new EmbedBuilder()
      .setTitle(headline)
      .setDescription(text)
      .setTimestamp(new Date());

    if (hex) embed.setColor(parseInt(hex, 16));
    if (picture?.url) embed.setImage(picture.url);

    // Footer: Icon nur wenn gültige Direct-URL
    if (isValidImageUrl(MODULO_ICON)) {
      embed.setFooter({ text: MODULO_NAME, iconURL: MODULO_ICON });
    } else {
      embed.setFooter({ text: MODULO_NAME });
    }

    try {
      await channel.send({
        content: ping ? `${ping}` : undefined,
        embeds: [embed],
        allowedMentions: { parse: ["roles", "users"] }
      });

      await interaction.editReply(`✅ Dein Embed wurde in ${channel} gesendet.`);
    } catch (err) {
      console.error(err);
      await interaction.editReply(
        "❌ Konnte nicht senden. Check Bot-Rechte im Ziel-Channel: **Send Messages** + **Embed Links**."
      );
    }
  }
};
