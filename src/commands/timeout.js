const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { getTemplate } = require("../utils/modTemplates");
const { bumpTimeout, boardTimeout } = require("../utils/punishStore");
const { footer } = require("../utils/branding");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout setzen")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

    .addSubcommand(sub =>
      sub.setName("set")
        .setDescription("Timeout setzen (per Template-ID)")
        .addUserOption(o => o.setName("user").setDescription("Mitglied").setRequired(true))
        .addIntegerOption(o => o.setName("template").setDescription("Template-ID (type=timeout)").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("list")
        .setDescription("Timeout-Liste (Top)")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === "set") {
      const user = interaction.options.getUser("user");
      const templateId = interaction.options.getInteger("template");
      const t = getTemplate(guildId, templateId);

      if (!t || t.type !== "timeout") return interaction.reply({ content: "❌ Timeout-Template-ID ungültig.", flags: 64 });

      const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
      if (!member) return interaction.reply({ content: "❌ Member nicht gefunden.", flags: 64 });

      const ms = t.durationMinutes * 60 * 1000;

      await member.timeout(ms, t.reason).catch(err=>{
        console.error(err);
        throw err;
      });

      bumpTimeout(guildId, user.id, { ts: Date.now(), moderatorId: interaction.user.id, reason: t.reason, templateId });

      try { await user.send(`⏳ Timeout auf **${interaction.guild.name}**\nDauer: ${t.durationMinutes} Minuten\nGrund: ${t.dmText}`); } catch {}

      return interaction.reply({ content: `✅ Timeout gesetzt: ${user} (**${t.durationMinutes}m**, Template: **${t.name}**)`, flags: 64 });
    }

    if (sub === "list") {
      const board = boardTimeout(guildId).sort((a,b)=>b.count-a.count).slice(0, 15);
      if (!board.length) return interaction.reply({ content: "📭 Keine Timeouts gespeichert.", flags: 64 });

      const lines = board.map((x,i)=>`${i+1}. <@${x.userId}> — **${x.count}**`).join("\n");
      const e = new EmbedBuilder().setTitle("⏳ Timeout-Liste (Top 15)").setDescription(lines).setFooter(footer()).setTimestamp(new Date());
      return interaction.reply({ embeds: [e], flags: 64 });
    }
  }
};
