const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick (per Template)")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName("user").setDescription("Mitglied").setRequired(true))
    .addIntegerOption(o => o.setName("template").setDescription("Template-ID (type=kick)").setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const templateId = interaction.options.getInteger("template");
    const t = getTemplate(interaction.guildId, templateId);

    if (!t || t.type !== "kick") return interaction.reply({ content: "❌ Kick-Template-ID ungültig.", flags: 64 });

    const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
    if (!member) return interaction.reply({ content: "❌ Member nicht gefunden.", flags: 64 });

    try { await user.send(`👢 Kick von **${interaction.guild.name}**\nGrund: ${t.dmText}`); } catch {}
    await member.kick(t.reason);

    return interaction.reply({ content: `✅ ${user} gekickt (Template: **${t.name}**)`, flags: 64 });
  }
};
