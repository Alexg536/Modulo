const { Events } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      // ✅ SOFORT ack → verhindert 10062
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: command.ephemeral ?? false });
      }

      await command.execute(interaction);
    } catch (err) {
      console.error("❌ Command Error:", err);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("❌ Fehler beim Ausführen des Commands.");
        }
      } catch {}
    }
  }
};
