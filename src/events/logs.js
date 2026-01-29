const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const { getGuildConfig } = require("../utils/config");
const { footer } = require("../utils/branding");

function cut(s, n = 1200) {
  if (!s) return "—";
  s = String(s);
  return s.length > n ? s.slice(0, n) + "…" : s;
}

async function sendTypedLog(guild, type, embed) {
  const cfg = getGuildConfig(guild.id);
  const channelId = cfg.logChannels?.[type];
  if (!channelId) return;

  try {
    const ch = await guild.channels.fetch(channelId);
    if (!ch) return;
    await ch.send({ embeds: [embed] });
  } catch {}
}

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    // JOIN
    client.on("guildMemberAdd", async (member) => {
      const e = new EmbedBuilder()
        .setTitle("✅ Join")
        .setDescription(`${member} (ID: \`${member.id}\`)`)
        .addFields({ name: "Account erstellt", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true })
        .setFooter(footer()).setTimestamp(new Date());
      await sendTypedLog(member.guild, "join", e);
    });

    // LEAVE / KICK (Audit log check)
    client.on("guildMemberRemove", async (member) => {
      let kickedBy = null;
      let reason = null;

      try {
        const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 5 });
        const entry = logs.entries.find(en => en.target?.id === member.id && Date.now() - en.createdTimestamp < 15_000);
        if (entry) { kickedBy = entry.executor; reason = entry.reason || null; }
      } catch {}

      if (kickedBy) {
        const e = new EmbedBuilder()
          .setTitle("👢 Kick")
          .setDescription(`${member.user?.tag || member.id} (ID: \`${member.id}\`)`)
          .addFields(
            { name: "Gekickt von", value: `${kickedBy} (ID: \`${kickedBy.id}\`)`, inline: false },
            { name: "Grund", value: reason || "—", inline: false }
          )
          .setFooter(footer()).setTimestamp(new Date());
        return sendTypedLog(member.guild, "kick", e);
      }

      const e = new EmbedBuilder()
        .setTitle("🚪 Leave")
        .setDescription(`${member.user?.tag || member.id} (ID: \`${member.id}\`)`)
        .setFooter(footer()).setTimestamp(new Date());
      await sendTypedLog(member.guild, "leave", e);
    });

    // ROLE UPDATE + TIMEOUT
    client.on("guildMemberUpdate", async (oldM, newM) => {
      // roles
      const oldRoles = new Set(oldM.roles.cache.keys());
      const newRoles = new Set(newM.roles.cache.keys());
      const added = [...newRoles].filter(r => !oldRoles.has(r));
      const removed = [...oldRoles].filter(r => !newRoles.has(r));

      if (added.length || removed.length) {
        const e = new EmbedBuilder()
          .setTitle("🧩 Role update")
          .setDescription(`${newM} (ID: \`${newM.id}\`)`)
          .addFields(
            { name: "Hinzugefügt", value: added.length ? added.map(id => `<@&${id}>`).join(", ") : "—", inline: false },
            { name: "Entfernt", value: removed.length ? removed.map(id => `<@&${id}>`).join(", ") : "—", inline: false }
          )
          .setFooter(footer()).setTimestamp(new Date());
        await sendTypedLog(newM.guild, "role", e);
      }

      // timeout
      const o = oldM.communicationDisabledUntilTimestamp || 0;
      const n = newM.communicationDisabledUntilTimestamp || 0;
      if (o !== n) {
        let by = null; let reason = null;
        try {
          const logs = await newM.guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 10 });
          const entry = logs.entries.find(en => en.target?.id === newM.id && Date.now() - en.createdTimestamp < 15_000);
          if (entry) { by = entry.executor; reason = entry.reason || null; }
        } catch {}

        const isSet = n && n > Date.now();
        const e = new EmbedBuilder()
          .setTitle(isSet ? "⏳ Timeout gesetzt" : "✅ Timeout entfernt")
          .setDescription(`${newM} (ID: \`${newM.id}\`)`)
          .addFields(
            { name: "Von", value: by ? `${by} (ID: \`${by.id}\`)` : "—", inline: false },
            { name: "Bis", value: isSet ? `<t:${Math.floor(n / 1000)}:F> (<t:${Math.floor(n / 1000)}:R>)` : "—", inline: false },
            { name: "Grund", value: reason || "—", inline: false }
          )
          .setFooter(footer()).setTimestamp(new Date());
        await sendTypedLog(newM.guild, "timeout", e);
      }
    });

    // MESSAGE DELETE
    client.on("messageDelete", async (msg) => {
      if (!msg.guild || msg.author?.bot) return;
      const e = new EmbedBuilder()
        .setTitle("🗑️ Message delete")
        .setDescription(`In <#${msg.channelId}> von ${msg.author} (ID: \`${msg.author.id}\`)`)
        .addFields({ name: "Inhalt", value: cut(msg.content, 1500), inline: false })
        .setFooter(footer()).setTimestamp(new Date());
      await sendTypedLog(msg.guild, "msg_delete", e);
    });

    // MESSAGE EDIT
    client.on("messageUpdate", async (oldMsg, newMsg) => {
      if (!newMsg.guild || newMsg.author?.bot) return;
      const before = oldMsg?.content || "";
      const after = newMsg?.content || "";
      if (before === after) return;

      const e = new EmbedBuilder()
        .setTitle("✏️ Message edit")
        .setDescription(`In <#${newMsg.channelId}> von ${newMsg.author} (ID: \`${newMsg.author.id}\`)`)
        .addFields(
          { name: "Vorher", value: cut(before, 1200), inline: false },
          { name: "Nachher", value: cut(after, 1200), inline: false }
        )
        .setFooter(footer()).setTimestamp(new Date());
      await sendTypedLog(newMsg.guild, "msg_edit", e);
    });

    // VOICE JOIN/LEAVE
    client.on("voiceStateUpdate", async (oldS, newS) => {
      const member = newS.member || oldS.member;
      if (!member?.guild) return;

      const oldCh = oldS.channel;
      const newCh = newS.channel;

      if (!oldCh && newCh) {
        const e = new EmbedBuilder()
          .setTitle("🔊 Voice join")
          .setDescription(`${member} (ID: \`${member.id}\`)`)
          .addFields({ name: "Channel", value: `${newCh} (ID: \`${newCh.id}\`)`, inline: false })
          .setFooter(footer()).setTimestamp(new Date());
        return sendTypedLog(member.guild, "voice_join", e);
      }

      if (oldCh && !newCh) {
        const e = new EmbedBuilder()
          .setTitle("🔇 Voice leave")
          .setDescription(`${member} (ID: \`${member.id}\`)`)
          .addFields({ name: "Channel", value: `${oldCh} (ID: \`${oldCh.id}\`)`, inline: false })
          .setFooter(footer()).setTimestamp(new Date());
        return sendTypedLog(member.guild, "voice_leave", e);
      }
    });

    // BAN
    client.on("guildBanAdd", async (ban) => {
      const guild = ban.guild;
      const user = ban.user;

      let by = null; let reason = null;
      try {
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 5 });
        const entry = logs.entries.find(en => en.target?.id === user.id && Date.now() - en.createdTimestamp < 15_000);
        if (entry) { by = entry.executor; reason = entry.reason || null; }
      } catch {}

      const e = new EmbedBuilder()
        .setTitle("🔨 Ban")
        .setDescription(`${user.tag} (ID: \`${user.id}\`)`)
        .addFields(
          { name: "Gebannt von", value: by ? `${by} (ID: \`${by.id}\`)` : "—", inline: false },
          { name: "Grund", value: reason || "—", inline: false }
        )
        .setFooter(footer()).setTimestamp(new Date());
      await sendTypedLog(guild, "ban", e);
    });

    console.log("✅ Logs (per Typ) aktiv");
  }
};
