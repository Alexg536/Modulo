const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban (per Template)")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("user").setDescription("Mitglied").setRequired(true))
    .addIntegerOption(o => o.setName("template").setDescription("Template-ID (type=ban)").setRequired(true))
    .addIntegerOption(o => o.setName("delete_days").setDescription("Nachrichten löschen (0-7 Tage)").setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const templateId = interaction.options.getInteger("template");
    const delDays = interaction.options.getInteger("delete_days") ?? 0;

    const t = getTemplate(interaction.guildId, templateId);
    if (!t || t.type !== "ban") return interaction.reply({ content: "❌ Ban-Template-ID ungültig.", flags: 64 });
    if (delDays < 0 || delDays > 7) return interaction.reply({ content: "❌ delete_days muss 0-7 sein.", flags: 64 });

    try { await user.send(`🔨 Ban von **${interaction.guild.name}**\nGrund: ${t.dmText}`); } catch {}

    await interaction.guild.members.ban(user.id, { reason: t.reason, deleteMessageSeconds: delDays * 86400 });

    return interaction.reply({ content: `✅ ${user} gebannt (Template: **${t.name}**)`, flags: 64 });
  }
};
