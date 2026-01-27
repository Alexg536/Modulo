const cron = require("node-cron");
const { EmbedBuilder } = require("discord.js");
const { getGuildConfig } = require("./config");
const { getGuild, saveGuild } = require("./tippsStore");

const MODULO_NAME = "MODULO";
const MODULO_ICON = "";

let schedulerStarted = false;

function buildTipEmbed(tipText, tipId) {
  return new EmbedBuilder()
    .setTitle("💡 Täglicher Tipp")
    .setDescription(tipText)
    .setFooter(
      MODULO_ICON
        ? { text: `${MODULO_NAME} • Tipp #${tipId}`, iconURL: MODULO_ICON }
        : { text: `${MODULO_NAME} • Tipp #${tipId}` }
    )
    .setTimestamp(new Date());
}

async function sendTipToGuild(client, guildId, { force = false } = {}) {
  const cfg = getGuildConfig(guildId);
  const tipsChannelId = cfg.tipsChannelId;
  if (!tipsChannelId) return;

  const guildTips = getGuild(guildId);
  const tips = guildTips.tips || [];
  if (tips.length === 0) return;

  let idx = guildTips.lastIndex || 0;
  if (idx >= tips.length) idx = 0;

  const tipObj = tips[idx];

  guildTips.lastIndex = idx + 1;
  if (guildTips.lastIndex >= tips.length) guildTips.lastIndex = 0;
  saveGuild(guildId, guildTips);

  try {
    const channel = await client.channels.fetch(tipsChannelId);
    if (!channel) return;
    await channel.send({ embeds: [buildTipEmbed(tipObj.text, tipObj.id)] });
  } catch (err) {
    console.error("Tipps send error:", err);
    if (force) throw err;
  }
}

function startTippsScheduler(client) {
  if (schedulerStarted) {
    console.log("⚠️ Tipps Scheduler wurde schon gestartet – skip.");
    return;
  }
  schedulerStarted = true;

  cron.schedule(
    "0 19 * * *",
    async () => {
      for (const guild of client.guilds.cache.values()) {
        await sendTipToGuild(client, guild.id);
      }
    },
    { timezone: "Europe/Berlin" }
  );

  console.log("✅ Tipps Scheduler aktiv: täglich 19:00 (Europe/Berlin)");
}

module.exports = { startTippsScheduler, sendTipToGuild };
