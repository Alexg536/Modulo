const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const SUB_PATH = path.join(process.cwd(), "data", "submissions.json");

function ensure() {
  if (!fs.existsSync("data")) fs.mkdirSync("data");
  if (!fs.existsSync(SUB_PATH)) {
    fs.writeFileSync(SUB_PATH, JSON.stringify({}, null, 2), "utf8");
  }
}

function readAll() {
  ensure();
  return JSON.parse(fs.readFileSync(SUB_PATH, "utf8"));
}

function writeAll(all) {
  ensure();
  fs.writeFileSync(SUB_PATH, JSON.stringify(all, null, 2), "utf8");
}

function newId() {
  return crypto.randomBytes(10).toString("hex");
}

function createSubmission({ guildId, type, authorId, authorTag, content }) {
  const all = readAll();
  const id = newId();

  all[id] = {
    id,
    guildId,
    type, // question | suggestion
    authorId,
    authorTag,
    content,
    createdAt: Date.now(),
    status: "pending",
    decisionAt: null,
    decisionBy: null,
    reason: null,
    answer: null,
    logMessageId: null
  };

  writeAll(all);
  return all[id];
}

function getSubmission(id) {
  const all = readAll();
  return all[id] || null;
}

function updateSubmission(id, patch) {
  const all = readAll();
  if (!all[id]) return null;
  all[id] = { ...all[id], ...patch };
  writeAll(all);
  return all[id];
}

module.exports = { createSubmission, getSubmission, updateSubmission };
