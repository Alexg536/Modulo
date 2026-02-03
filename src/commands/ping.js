const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Test Command"),
  async execute(interaction) {
    await interaction.editReply("🏓 Pong! MODULO fresh & clean.");
  }
};
