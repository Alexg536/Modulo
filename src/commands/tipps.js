const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../utils/config");
const { getGuild, saveGuild } = require("../utils/tippsStore");
const { sendTipToGuild } = require("../utils/tippsScheduler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tipps")
    .setDescription("Tägliche Tipps verwalten")

    .addSubcommand(sub =>
      sub.setName("channel")
        .setDescription("Tipps-Channel setzen")
        .addChannelOption(opt =>
          opt.setName("set")
            .setDescription("Channel für Tipps")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub.setName("add")
        .setDescription("Neuen Tipp hinzufügen")
        .addStringOption(opt =>
          opt.setName("text").setDescription("Tipp-Text").setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub.setName("list")
        .setDescription("Alle Tipps anzeigen")
    )

    .addSubcommand(sub =>
      sub.setName("remove")
        .setDescription("Tipp löschen")
        .addIntegerOption(opt =>
          opt.setName("id").setDescription("ID aus /tipps list").setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub.setName("send")
        .setDescription("Sofort einen Tipp senden (Test)")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    // nur ephemere Antworten
    const reply = (content) => interaction.reply({ content, flags: 64 });

    if (sub === "channel") {
      const ch = interaction.options.getChannel("set");
      const cfg = getGuildConfig(guildId);
      cfg.tipsChannelId = ch.id;
      setGuildConfig(guildId, cfg);
      return reply(`✅ Tipps-Channel gesetzt: ${ch}`);
    }

    if (sub === "add") {
      const text = interaction.options.getString("text").trim();
      if (text.length < 3) return reply("❌ Tipp ist zu kurz.");

      const g = getGuild(guildId);
      g.tips.push(text);
      saveGuild(guildId, g);

      return reply(`✅ Tipp gespeichert. Insgesamt: **${g.tips.length}**`);
    }

    if (sub === "list") {
      const g = getGuild(guildId);
      const tips = g.tips || [];
      if (tips.length === 0) return reply("📭 Keine Tipps gespeichert.");

      const out = tips
        .map((t, i) => `**${i}** · ${t.length > 80 ? t.slice(0, 80) + "…" : t}`)
        .slice(0, 40)
        .join("\n");

      return reply(`📌 **Tipps (${tips.length})**\n${out}`);
    }

    if (sub === "remove") {
      const id = interaction.options.getInteger("id");
      const g = getGuild(guildId);
      const tips = g.tips || [];

      if (id < 0 || id >= tips.length) return reply("❌ Ungültige ID.");

      const removed = tips.splice(id, 1)[0];
      g.tips = tips;

      if (g.lastIndex > id) g.lastIndex -= 1;
      if (g.lastIndex < 0) g.lastIndex = 0;

      saveGuild(guildId, g);
      return reply(`🗑️ Gelöscht: "${removed.length > 60 ? removed.slice(0, 60) + "…" : removed}"`);
    }

    if (sub === "send") {
      try {
        await sendTipToGuild(interaction.client, guildId, { force: true });
        return reply("✅ Tipp wurde gesendet.");
      } catch {
        return reply("❌ Konnte keinen Tipp senden. Check: Channel gesetzt + Tipps vorhanden?");
      }
    }
  },
};
