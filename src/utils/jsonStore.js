const fs = require("node:fs");
const path = require("node:path");

function ensureFile(filePath, defaultJson) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(defaultJson, null, 2), "utf8");
}

function readJson(filePath, defaultJson = {}) {
  ensureFile(filePath, defaultJson);
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch { return defaultJson; }
}

function writeJson(filePath, data) {
  ensureFile(filePath, {});
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = { readJson, writeJson };
