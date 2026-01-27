const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Zeigt die Bot-Latenz'),

  async execute(interaction) {
    await interaction.reply({
      content: `🏓 Pong! ${interaction.client.ws.ping}ms`,
      flags: 64
    });
  },
};
