const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const SETTINGS_FILE = path.join(DATA_DIR, "guildSettings.json");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}), "utf8");
}

function readAll() {
  ensure();
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
}

function writeAll(obj) {
  ensure();
  const tmp = SETTINGS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
  fs.renameSync(tmp, SETTINGS_FILE);
}

function getGuild(guildId) {
  const all = readAll();
  return all[guildId] || null;
}

function setGuild(guildId, patch) {
  const all = readAll();
  const current = all[guildId] || {
    logChannels: {
      join_leave: null,
      role_updates: null,
      message_log: null,
      mod_actions: null
    },
    counting: { channelId: null, lastNumber: 0, lastUserId: null, seenNumbers: [] },
    dailyTips: { channelId: null, time: "19:00", timezone: "Europe/Berlin" },
    birthdays: { channelId: null, users: {} }, // users: { userId: "MM-DD" }
  };

  all[guildId] = { ...current, ...patch };
  writeAll(all);
  return all[guildId];
}

module.exports = { getGuild, setGuild, readAll, writeAll };
