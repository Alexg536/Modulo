const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { addTemplate, listTemplates, removeTemplate } = require("../utils/modTemplates");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("modtemplate")
    .setDescription("Vorlagen für Warn/Timeout/Kick/Ban verwalten")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

    .addSubcommand(sub =>
      sub.setName("add")
        .setDescription("Vorlage hinzufügen")
        .addStringOption(o => o.setName("type").setDescription("warn|timeout|kick|ban").setRequired(true))
        .addStringOption(o => o.setName("name").setDescription("Name der Vorlage").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("Grund (intern/log)").setRequired(true))
        .addStringOption(o => o.setName("dm").setDescription("DM Text an das Mitglied").setRequired(true))
        .addIntegerOption(o => o.setName("minutes").setDescription("Nur bei timeout: Dauer in Minuten").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("list")
        .setDescription("Vorlagen anzeigen")
        .addStringOption(o => o.setName("type").setDescription("warn|timeout|kick|ban").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("remove")
        .setDescription("Vorlage löschen (ID)")
        .addIntegerOption(o => o.setName("id").setDescription("Template-ID").setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === "add") {
      const type = interaction.options.getString("type");
      const name = interaction.options.getString("name");
      const reason = interaction.options.getString("reason");
      const dmText = interaction.options.getString("dm");
      const minutes = interaction.options.getInteger("minutes");

      if (!["warn","timeout","kick","ban"].includes(type)) {
        return interaction.reply({ content: "❌ type muss warn|timeout|kick|ban sein.", flags: 64 });
      }
      if (type === "timeout" && (!minutes || minutes < 1)) {
        return interaction.reply({ content: "❌ timeout braucht minutes (>=1).", flags: 64 });
      }

      const t = addTemplate(guildId, { type, name, reason, dmText, durationMinutes: minutes ?? null });
      return interaction.reply({ content: `✅ Vorlage gespeichert: **${t.name}** (ID: **${t.id}**)`, flags: 64 });
    }

    if (sub === "list") {
      const type = interaction.options.getString("type");
      if (!["warn","timeout","kick","ban"].includes(type)) {
        return interaction.reply({ content: "❌ type muss warn|timeout|kick|ban sein.", flags: 64 });
      }
      const arr = listTemplates(guildId, type);
      if (!arr.length) return interaction.reply({ content: "📭 Keine Vorlagen.", flags: 64 });

      const lines = arr.slice(0, 40).map(t =>
        `**${t.id}** · **${t.name}** ${t.type==="timeout" ? `(⏳ ${t.durationMinutes}m)` : ""}\nGrund: ${t.reason}`
      ).join("\n\n");

      return interaction.reply({ content: `📌 Vorlagen (${type})\n\n${lines}`, flags: 64 });
    }

    if (sub === "remove") {
      const id = interaction.options.getInteger("id");
      const r = removeTemplate(guildId, id);
      if (!r) return interaction.reply({ content: "❌ ID nicht gefunden.", flags: 64 });
      return interaction.reply({ content: `🗑️ Gelöscht: **${r.name}** (ID: ${r.id})`, flags: 64 });
    }
  }
};
