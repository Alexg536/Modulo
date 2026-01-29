require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN) throw new Error("DISCORD_TOKEN fehlt in .env");
if (!CLIENT_ID) throw new Error("CLIENT_ID fehlt in .env");

const commands = [];
const commandsPath = path.join(__dirname, "src", "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command?.data?.toJSON) commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Deploy ${commands.length} Commands...`);

    // Wenn GUILD_ID gesetzt ist -> nur dieser Server (schnell zum testen)
    // Wenn GUILD_ID NICHT gesetzt ist -> GLOBAL (für alle Server)
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(`✅ Guild Commands deployed für Server: ${GUILD_ID}`);
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log("✅ Global Commands deployed (für alle Server)");
    }
  } catch (error) {
    console.error(error);
  }
})();
