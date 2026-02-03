const { Events } = require("discord.js");
const { getGuild, setGuild } = require("../utils/storage");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    const settings = getGuild(message.guild.id);
    const counting = settings?.counting;
    if (!counting?.channelId) return;
    if (message.channel.id !== counting.channelId) return;

    // nur eine Zahl erlaubt
    if (!/^\d+$/.test(message.content.trim())) {
      await message.delete().catch(() => null);
      return;
    }

    const num = Number(message.content.trim());
    const next = (counting.lastNumber || 0) + 1;

    // nicht 2x hintereinander
    if (counting.lastUserId === message.author.id) {
      await message.delete().catch(() => null);
      await message.channel.send(`⚠️ ${message.author} du darfst nicht 2x hintereinander zählen.`).catch(()=>null);
      return;
    }

    // Reihenfolge prüfen
    if (num !== next) {
      await message.delete().catch(() => null);
      await message.channel.send(`❌ ${message.author} falsche Zahl. Nächste Zahl wäre **${next}**.`).catch(()=>null);
      return;
    }

    // Reaktions-Regel: neu = 🏆, schon mal erreicht = ✅
    const seen = new Set(counting.seenNumbers || []);
    const emoji = seen.has(num) ? "✅" : "🏆";
    await message.react(emoji).catch(()=>null);

    seen.add(num);

    setGuild(message.guild.id, {
      counting: {
        ...counting,
        lastNumber: num,
        lastUserId: message.author.id,
        seenNumbers: Array.from(seen).slice(-5000) // keep size sane
      }
    });
  }
};
