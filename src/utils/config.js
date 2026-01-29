const path = require("node:path");
const { readJson, writeJson } = require("./jsonStore");

const CONFIG_PATH = path.join(process.cwd(), "data", "guildConfig.json");

function withDefaults(cfg) {
  const out = cfg || {};

  // alte Felder bleiben kompatibel
  if (!out.logChannelId) out.logChannelId = null;        // (dein Q/A Review Log)
  if (!out.tipsChannelId) out.tipsChannelId = null;

  // NEU: Logkanäle pro Typ
  if (!out.logChannels) out.logChannels = {};

  // Counting Config
  if (!out.counting) out.counting = { channelId: null, lastNumber: 0, lastUserId: null };

  // Panels
  if (!out.question) out.question = { panelChannelId: null, panelMessageId: null, threadChannelId: null };
  if (!out.suggestion) out.suggestion = { panelChannelId: null, panelMessageId: null, threadChannelId: null };

  return out;
}

function getGuildConfig(guildId) {
  const all = readJson(CONFIG_PATH, {});
  return withDefaults(all[guildId]);
}

function setGuildConfig(guildId, config) {
  const all = readJson(CONFIG_PATH, {});
  all[guildId] = withDefaults(config);
  writeJson(CONFIG_PATH, all);
}

module.exports = { getGuildConfig, setGuildConfig };
