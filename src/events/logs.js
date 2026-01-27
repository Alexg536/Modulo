const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const { getGuildConfig } = require("../utils/config");
const { footer } = require("../utils/branding");

function cut(s, n=1000){ if(!s) return "—"; s = String(s); return s.length>n ? s.slice(0,n)+"…" : s; }

async function sendLog(guild, embed) {
  const cfg = getGuildConfig(guild.id);
  if (!cfg.modLogChannelId) return;
  try {
    const ch = await guild.channels.fetch(cfg.modLogChannelId);
    if (!ch) return;
    await ch.send({ embeds: [embed] });
  } catch {}
}

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    // ----- JOIN -----
    client.on("guildMemberAdd", async (member) => {
      const e = new EmbedBuilder()
        .setTitle("✅ Join")
        .setDescription(`${member} (ID: \`${member.id}\`)`)
        .addFields({ name: "Account erstellt", value: `<t:${Math.floor(member.user.createdTimestamp/1000)}:R>`, inline: true })
        .setFooter(footer()).setTimestamp(new Date());
      await sendLog(member.guild, e);
    });

    // ----- LEAVE / KICK detection -----
    client.on("guildMemberRemove", async (member) => {
      // try detect kick via audit logs
      let kickedBy = null;
      let reason = null;
      try {
        const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 5 });
        const entry = logs.entries.find(en => en.target?.id === member.id && Date.now() - en.createdTimestamp < 15_000);
        if (entry) { kickedBy = entry.executor; reason = entry.reason || null; }
      } catch {}

      const e = new EmbedBuilder()
        .setTitle(kickedBy ? "👢 Kick" : "🚪 Leave")
        .setDescription(`${member.user?.tag || member.id} (ID: \`${member.id}\`)`)
        .addFields(
          { name: kickedBy ? "Gekickt von" : "Info", value: kickedBy ? `${kickedBy} (ID: \`${kickedBy.id}\`)` : "Mitglied hat den Server verlassen.", inline: false },
          { name: "Grund", value: kickedBy ? (reason || "—") : "—", inline: false }
        )
        .setFooter(footer()).setTimestamp(new Date());
      await sendLog(member.guild, e);
    });

    // ----- ROLE UPDATE + TIMEOUT -----
    client.on("guildMemberUpdate", async (oldM, newM) => {
      // role changes
      const oldRoles = new Set(oldM.roles.cache.keys());
      const newRoles = new Set(newM.roles.cache.keys());

      const added = [...newRoles].filter(r => !oldRoles.has(r));
      const removed = [...oldRoles].filter(r => !newRoles.has(r));

      if (added.length || removed.length) {
        const e = new EmbedBuilder()
          .setTitle("🧩 Role Update")
          .setDescription(`${newM} (ID: \`${newM.id}\`)`)
          .addFields(
            { name: "Hinzugefügt", value: added.length ? added.map(id => `<@&${id}>`).join(", ") : "—", inline: false },
            { name: "Entfernt", value: removed.length ? removed.map(id => `<@&${id}>`).join(", ") : "—", inline: false }
          )
          .setFooter(footer()).setTimestamp(new Date());
        await sendLog(newM.guild, e);
      }

      // timeout change
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
            { name: "Bis", value: isSet ? `<t:${Math.floor(n/1000)}:F> (<t:${Math.floor(n/1000)}:R>)` : "—", inline: false },
            { name: "Grund", value: reason || "—", inline: false }
          )
          .setFooter(footer()).setTimestamp(new Date());
        await sendLog(newM.guild, e);
      }
    });

    // ----- MESSAGE DELETE -----
    client.on("messageDelete", async (msg) => {
      if (!msg.guild || msg.author?.bot) return;
      const e = new EmbedBuilder()
        .setTitle("🗑️ Message gelöscht")
        .setDescription(`In <#${msg.channelId}> von ${msg.author} (ID: \`${msg.author.id}\`)`)
        .addFields({ name: "Inhalt", value: cut(msg.content, 1500), inline: false })
        .setFooter(footer()).setTimestamp(new Date());
      await sendLog(msg.guild, e);
    });

    // ----- MESSAGE EDIT -----
    client.on("messageUpdate", async (oldMsg, newMsg) => {
      if (!newMsg.guild || newMsg.author?.bot) return;
      const before = oldMsg?.content || "";
      const after = newMsg?.content || "";
      if (before === after) return;

      const e = new EmbedBuilder()
        .setTitle("✏️ Message bearbeitet")
        .setDescription(`In <#${newMsg.channelId}> von ${newMsg.author} (ID: \`${newMsg.author.id}\`)`)
        .addFields(
          { name: "Vorher", value: cut(before, 1200), inline: false },
          { name: "Nachher", value: cut(after, 1200), inline: false }
        )
        .setFooter(footer()).setTimestamp(new Date());
      await sendLog(newMsg.guild, e);
    });

    // ----- VOICE JOIN/LEAVE/MOVE -----
    client.on("voiceStateUpdate", async (oldS, newS) => {
      const member = newS.member || oldS.member;
      if (!member?.guild) return;

      const oldCh = oldS.channel;
      const newCh = newS.channel;

      if (!oldCh && newCh) {
        const e = new EmbedBuilder()
          .setTitle("🔊 Voice Join")
          .setDescription(`${member} (ID: \`${member.id}\`)`)
          .addFields({ name: "Channel", value: `${newCh} (ID: \`${newCh.id}\`)`, inline: false })
          .setFooter(footer()).setTimestamp(new Date());
        return sendLog(member.guild, e);
      }

      if (oldCh && !newCh) {
        const e = new EmbedBuilder()
          .setTitle("🔇 Voice Leave")
          .setDescription(`${member} (ID: \`${member.id}\`)`)
          .addFields({ name: "Channel", value: `${oldCh} (ID: \`${oldCh.id}\`)`, inline: false })
          .setFooter(footer()).setTimestamp(new Date());
        return sendLog(member.guild, e);
      }

      if (oldCh && newCh && oldCh.id !== newCh.id) {
        const e = new EmbedBuilder()
          .setTitle("🔁 Voice Move")
          .setDescription(`${member} (ID: \`${member.id}\`)`)
          .addFields(
            { name: "Von", value: `${oldCh}`, inline: true },
            { name: "Nach", value: `${newCh}`, inline: true }
          )
          .setFooter(footer()).setTimestamp(new Date());
        return sendLog(member.guild, e);
      }
    });

    // ----- BAN -----
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
      await sendLog(guild, e);
    });

    console.log("✅ Log-System aktiv");
  }
};
