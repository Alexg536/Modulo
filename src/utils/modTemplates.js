const path = require("node:path");
const { readJson, writeJson } = require("./jsonStore");

const FILE = path.join(process.cwd(), "data", "modTemplates.json");

function getGuild(guildId) {
  const all = readJson(FILE, {});
  if (!all[guildId]) all[guildId] = { nextId: 1, templates: [] };
  return all[guildId];
}

function saveGuild(guildId, data) {
  const all = readJson(FILE, {});
  all[guildId] = data;
  writeJson(FILE, all);
}

function addTemplate(guildId, { type, name, reason, dmText, durationMinutes }) {
  const g = getGuild(guildId);
  const t = {
    id: g.nextId++,
    type, // warn|timeout|ban|kick
    name,
    reason,
    dmText,
    durationMinutes: durationMinutes ?? null
  };
  g.templates.push(t);
  saveGuild(guildId, g);
  return t;
}

function listTemplates(guildId, type) {
  const g = getGuild(guildId);
  return g.templates.filter(t => t.type === type);
}

function getTemplate(guildId, id) {
  const g = getGuild(guildId);
  return g.templates.find(t => t.id === id) || null;
}

function removeTemplate(guildId, id) {
  const g = getGuild(guildId);
  const idx = g.templates.findIndex(t => t.id === id);
  if (idx === -1) return null;
  const removed = g.templates.splice(idx, 1)[0];
  saveGuild(guildId, g);
  return removed;
}

module.exports = { addTemplate, listTemplates, getTemplate, removeTemplate };
