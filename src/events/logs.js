const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const { getGuildConfig } = require("../utils/config");
const { footer } = require("../utils/branding");

function cut(s, max = 1000) {
  if (!s) return "—";
  s = String(s);
  return s.length > max ? s.slice(0, max) + "…" : s;
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

async function findAudit(guild, type, targetId, msWindow = 15000, limit = 10) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit });
    const entry = logs.entries.find(
      (en) => en.target?.id === targetId && Date.now() - en.createdTimestamp < msWindow
    );
    return entry || null;
  } catch {
    return null;
  }
}

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    // Join
    client.on("guildMemberAdd", async (member) => {
      const e = new EmbedBuilder()
        .setTitle("✅ Join")
        .setDescription(`${member} (ID: \`${member.id}\`)`)
        .addFields({ name: "Account erstellt", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true })
        .setFooter(footer())
        .setTimestamp(new Date());
      await sendTypedLog(member.guild, "join", e);
    });

    // Leave / Kick (Kick wird über AuditLog erkannt)
    client.on("guildMemberRemove", async (member) => {
      const entry = await findAudit(member.guild, AuditLogEvent.MemberKick, member.id);
      if (entry) {
        const e = new EmbedBuilder()
          .setTitle("👢 Kick")
          .setDescription(`${member.user?.tag || member.id} (ID: \`${member.id}\`)`)
          .addFields(
            { name: "Ausgeführt von", value: `${entry.executor} (ID: \`${entry.executor.id}\`)`, inline: false },
            { name: "Grund", value: cut(entry.reason || "—"), inline: false }
          )
          .setFooter(footer())
          .setTimestamp(new Date());
        return sendTypedLog(member.guild, "kick", e);
      }

      const e = new EmbedBuilder()
        .setTitle("🚪 Leave")
        .setDescription(`${member.user?.tag || member.id} (ID: \`${member.id}\`)`)
        .setFooter(footer())
        .setTimestamp(new Date());
      await sendTypedLog(member.guild, "leave", e);
    });

    // Role update + Timeout update
    client.on("guildMemberUpdate", async (oldM, newM) => {
      // Role changes
      const oldRoles = new Set(oldM.roles.cache.keys());
      const newRoles = new Set(newM.roles.cache.keys());
      const added = [...newRoles].filter((r) => !oldRoles.has(r)).map((id) => `<@&${id}>`);
      const removed = [...oldRoles].filter((r) => !newRoles.has(r)).map((id) => `<@&${id}>`);

      if (added.length || removed.length) {
        const e = new EmbedBuilder()
          .setTitle("🧩 Role update")
          .setDescription(`${newM} (ID: \`${newM.id}\`)`)
          .addFields(
            { name: "Hinzugefügt", value: cut(added.join(", ")) || "—", inline: false },
            { name: "Entfernt", value: cut(removed.join(", ")) || "—", inline: false }
          )
          .setFooter(footer())
          .setTimestamp(new Date());
        await sendTypedLog(newM.guild, "role", e);
      }

      // Timeout changes
      const o = oldM.communicationDisabledUntilTimestamp || 0;
      const n = newM.communicationDisabledUntilTimestamp || 0;
      if (o !== n) {
        const entry = await findAudit(newM.guild, AuditLogEvent.MemberUpdate, newM.id, 20000, 15);
        const isSet = n && n > Date.now();

        const e = new EmbedBuilder()
          .setTitle(isSet ? "⏳ Timeout gesetzt" : "✅ Timeout entfernt")
          .setDescription(`${newM} (ID: \`${newM.id}\`)`)
          .addFields(
            { name: "Ausgeführt von", value: entry?.executor ? `${entry.executor} (ID: \`${entry.executor.id}\`)` : "—", inline: false },
            { name: "Bis", value: isSet ? `<t:${Math.floor(n / 1000)}:F> (<t:${Math.floor(n / 1000)}:R>)` : "—", inline: false },
            { name: "Grund", value: cut(entry?.reason || "—"), inline: false }
          )
          .setFooter(footer())
          .setTimestamp(new Date());

        await sendTypedLog(newM.guild, "timeout", e);
      }
    });

    // Message delete
    client.on("messageDelete", async (msg) => {
      if (!msg.guild || msg.author?.bot) return;

      const e = new EmbedBuilder()
        .setTitle("🗑️ Message delete")
        .setDescription(`In <#${msg.channelId}> von ${msg.author} (ID: \`${msg.author.id}\`)`)
        .addFields({ name: "Inhalt", value: cut(msg.content), inline: false })
        .setFooter(footer())
        .setTimestamp(new Date());

      await sendTypedLog(msg.guild, "msg_delete", e);
    });

    // Message edit
    client.on("messageUpdate", async (oldMsg, newMsg) => {
      if (!newMsg.guild || newMsg.author?.bot) return;

      const before = oldMsg?.content || "";
      const after = newMsg?.content || "";
      if (before === after) return;

      const e = new EmbedBuilder()
        .setTitle("✏️ Message edit")
        .setDescription(`In <#${newMsg.channelId}> von ${newMsg.author} (ID: \`${newMsg.author.id}\`)`)
        .addFields(
          { name: "Vorher", value: cut(before), inline: false },
          { name: "Nachher", value: cut(after), inline: false }
        )
        .setFooter(footer())
        .setTimestamp(new Date());

      await sendTypedLog(newMsg.guild, "msg_edit", e);
    });

    // Voice join/leave
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
          .setFooter(footer())
          .setTimestamp(new Date());
        return sendTypedLog(member.guild, "voice_join", e);
      }

      if (oldCh && !newCh) {
        const e = new EmbedBuilder()
          .setTitle("🔇 Voice leave")
          .setDescription(`${member} (ID: \`${member.id}\`)`)
          .addFields({ name: "Channel", value: `${oldCh} (ID: \`${oldCh.id}\`)`, inline: false })
          .setFooter(footer())
          .setTimestamp(new Date());
        return sendTypedLog(member.guild, "voice_leave", e);
      }
    });

    // Ban
    client.on("guildBanAdd", async (ban) => {
      const guild = ban.guild;
      const user = ban.user;

      const entry = await findAudit(guild, AuditLogEvent.MemberBanAdd, user.id);

      const e = new EmbedBuilder()
        .setTitle("🔨 Ban")
        .setDescription(`${user.tag} (ID: \`${user.id}\`)`)
        .addFields(
          { name: "Ausgeführt von", value: entry?.executor ? `${entry.executor} (ID: \`${entry.executor.id}\`)` : "—", inline: false },
          { name: "Grund", value: cut(entry?.reason || "—"), inline: false }
        )
        .setFooter(footer())
        .setTimestamp(new Date());

      await sendTypedLog(guild, "ban", e);
    });

    console.log("✅ Logs (per Typ) aktiv");
  },
};
