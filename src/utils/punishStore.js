const path = require("node:path");
const { readJson, writeJson } = require("./jsonStore");

const WARN_FILE = path.join(process.cwd(), "data", "warnings.json");
const TO_FILE = path.join(process.cwd(), "data", "timeouts.json");

function bump(file, guildId, userId, entry) {
  const all = readJson(file, {});
  if (!all[guildId]) all[guildId] = {};
  if (!all[guildId][userId]) all[guildId][userId] = { count: 0, entries: [] };
  all[guildId][userId].count += 1;
  all[guildId][userId].entries.unshift(entry);
  all[guildId][userId].entries = all[guildId][userId].entries.slice(0, 50);
  writeJson(file, all);
  return all[guildId][userId];
}

function getBoard(file, guildId) {
  const all = readJson(file, {});
  const g = all[guildId] || {};
  return Object.entries(g).map(([userId, data]) => ({ userId, count: data.count || 0 }));
}

function bumpWarn(guildId, userId, entry) { return bump(WARN_FILE, guildId, userId, entry); }
function bumpTimeout(guildId, userId, entry) { return bump(TO_FILE, guildId, userId, entry); }

function boardWarn(guildId) { return getBoard(WARN_FILE, guildId); }
function boardTimeout(guildId) { return getBoard(TO_FILE, guildId); }

module.exports = { bumpWarn, bumpTimeout, boardWarn, boardTimeout };
