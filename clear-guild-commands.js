require("dotenv").config();
const { REST, Routes } = require("discord.js");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN) throw new Error("DISCORD_TOKEN fehlt");
if (!CLIENT_ID) throw new Error("CLIENT_ID fehlt");
if (!GUILD_ID) throw new Error("GUILD_ID fehlt");

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
  console.log("✅ Guild Commands wurden geleert für:", GUILD_ID);
})().catch(console.error);
