const { Events } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Nur Slash Commands
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      // ✅ SOFORT defer → verhindert DiscordAPIError 10062
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: false });
      }

      await command.execute(interaction);

    } catch (error) {
      console.error("❌ Command Error:", error);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: "❌ Es ist ein Fehler aufgetreten."
        });
      }
    }
  }
};
