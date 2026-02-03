const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Testet ob der Bot lebt"),

  async execute(interaction) {
    await interaction.editReply("🏓 Pong! MODULO lebt.");
  }
};
