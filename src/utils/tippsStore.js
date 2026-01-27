const fs = require("node:fs");
const path = require("node:path");

const FILE = path.join(process.cwd(), "data", "tipps.json");

function ensure() {
  if (!fs.existsSync("data")) fs.mkdirSync("data");
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({}, null, 2), "utf8");
}

function readAll() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeAll(data) {
  ensure();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

function getGuild(guildId) {
  const all = readAll();
  if (!all[guildId]) all[guildId] = { tips: [], lastIndex: 0 };
  return all[guildId];
}

function saveGuild(guildId, guildData) {
  const all = readAll();
  all[guildId] = guildData;
  writeAll(all);
}

module.exports = { readAll, writeAll, getGuild, saveGuild };
