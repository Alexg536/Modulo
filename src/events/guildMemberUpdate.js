const { Events } = require("discord.js");
const { makeLogEmbed } = require("../utils/logEmbed");
const { sendLog } = require("../features/logger");

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    // Roles changed?
    const oldRoles = new Set(oldMember.roles.cache.keys());
    const newRoles = new Set(newMember.roles.cache.keys());

    const added = [...newRoles].filter(r => !oldRoles.has(r));
    const removed = [...oldRoles].filter(r => !newRoles.has(r));

    // Timeout changed?
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp || 0;
    const newTimeout = newMember.communicationDisabledUntilTimestamp || 0;

    if (added.length || removed.length) {
      const fields = [];
      if (added.length) fields.push({ name: "➕ Rollen hinzugefügt", value: added.map(id => `<@&${id}>`).join(", "), inline: false });
      if (removed.length) fields.push({ name: "➖ Rollen entfernt", value: removed.map(id => `<@&${id}>`).join(", "), inline: false });

      const embed = makeLogEmbed({
        title: "🧩 Rollen geändert",
        description: `Bei ${newMember.user} (${newMember.user.tag}) wurden Rollen geändert.`,
        user: newMember.user,
        color: 0x5865f2,
        fields
      });

      await sendLog(newMember.guild, "role_updates", embed);
    }

    if (oldTimeout !== newTimeout) {
      const isNowTimedOut = newTimeout > Date.now();
      const embed = makeLogEmbed({
        title: isNowTimedOut ? "⏳ Timeout gesetzt" : "✅ Timeout entfernt",
        description: `Bei ${newMember.user} (${newMember.user.tag}) wurde ein Timeout ${isNowTimedOut ? "gesetzt" : "entfernt"}.`,
        user: newMember.user,
        color: isNowTimedOut ? 0xfaa61a : 0x57f287,
        fields: isNowTimedOut
          ? [{ name: "Bis", value: `<t:${Math.floor(newTimeout / 1000)}:F>`, inline: false }]
          : []
      });

      await sendLog(newMember.guild, "mod_actions", embed);
    }
  }
};
