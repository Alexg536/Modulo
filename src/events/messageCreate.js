const { getGuildConfig, setGuildConfig } = require("../utils/config");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    const cfg = getGuildConfig(message.guild.id);
    const c = cfg.counting;
    if (!c?.channelId) return;
    if (message.channel.id !== c.channelId) return;

    const content = message.content.trim();

    // Nur reine Zahlen erlauben
    if (!/^\d+$/.test(content)) return;

    const number = parseInt(content, 10);
    const expected = (c.lastNumber || 0) + 1;

    // Regel 1: nicht 2x hintereinander
    if (c.lastUserId && message.author.id === c.lastUserId) {
      try { await message.react("❌"); } catch {}
      return;
    }

    // Regel 2: richtige nächste Zahl?
    if (number !== expected) {
      // wenn Zahl schon mal dran war (<= lastNumber) -> Haken ✅
      if (number <= (c.lastNumber || 0)) {
        try { await message.react("✅"); } catch {}
      } else {
        // falsche zukünftige Zahl
        try { await message.react("❌"); } catch {}
      }
      return;
    }

    // korrekt -> Pokal 🏆
    c.lastNumber = number;
    c.lastUserId = message.author.id;
    setGuildConfig(message.guild.id, cfg);

    try { await message.react("🏆"); } catch {}
  }
};
