const path = require("node:path");
const { readJson, writeJson } = require("./jsonStore");

const CONFIG_PATH = path.join(process.cwd(), "data", "guildConfig.json");

function withDefaults(cfg) {
  const out = cfg || {};
  if (!out.logChannelId) out.logChannelId = null;          // existing (review logs for questions/suggestions)
  if (!out.modLogChannelId) out.modLogChannelId = null;    // NEW (moderation + server logs)
  if (!out.tipsChannelId) out.tipsChannelId = null;

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
