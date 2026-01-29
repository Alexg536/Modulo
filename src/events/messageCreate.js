const { EmbedBuilder } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");
const { footer } = require("../utils/branding");

function brandedEmbed(description) {
  return new EmbedBuilder()
    .setDescription(description)
    .setFooter(footer())
    .setTimestamp(new Date());
}

module.exports = {
  name: "messageCreate",
  async execute(message) {
    try {
      if (!message.guild) return;
      if (message.author.bot) return;

      const cfg = getGuildConfig(message.guild.id);
      const counting = cfg.counting;

      // Counting ist nicht aktiviert
      if (!counting?.channelId) return;

      // Nur im Counting-Channel reagieren
      if (message.channel.id !== counting.channelId) return;

      // User darf nur eine Zahl senden: exakt nur Ziffern
      const content = message.content.trim();

      if (!/^\d+$/.test(content)) {
        // Kein Spam: nur kurz Hinweis, aber du kannst das auch weglassen
        const e = brandedEmbed("❌ Bitte sende **nur eine Zahl** (z.B. `1`).");
        await message.channel.send({ embeds: [e] });
        return;
      }

      const number = parseInt(content, 10);

      // Safety: zu große Zahlen vermeiden
      if (!Number.isSafeInteger(number) || number < 1) {
        const e = brandedEmbed("❌ Ungültige Zahl. Starte bei `1` und zähle normal hoch.");
        await message.channel.send({ embeds: [e] });
        return;
      }

      const lastNumber = counting.lastNumber ?? 0;
      const lastUserId = counting.lastUserId ?? null;
      const expected = lastNumber + 1;

      // Regel: nicht 2x hintereinander
      if (lastUserId === message.author.id) {
        const e = brandedEmbed(`🚫 Du darfst nicht **2 mal hintereinander** zählen, ${message.author}.`);
        await message.channel.send({ embeds: [e] });
        return;
      }

      // Regel: Reihenfolge muss stimmen
      if (number !== expected) {
        const e = brandedEmbed(`⚠️ Falsche Reihenfolge.\nErwartet war: **${expected}**`);
        await message.channel.send({ embeds: [e] });
        return;
      }

      // ✅ Korrekt -> reagieren + speichern
      const maxNumber = counting.maxNumber ?? 0;

      // wenn Zahl schonmal erreicht wurde -> ✅, sonst 🏆
      if (number <= maxNumber) {
        await message.react("✅").catch(() => {});
      } else {
        await message.react("🏆").catch(() => {});
      }

      counting.lastNumber = number;
      counting.lastUserId = message.author.id;
      counting.maxNumber = Math.max(maxNumber, number);

      cfg.counting = counting;
      setGuildConfig(message.guild.id, cfg);

    } catch (err) {
      console.error("Counting error:", err);
    }
  }
};
