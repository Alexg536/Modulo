module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      // Slash Commands
      if (interaction.isChatInputCommand()) {
        const cmd = interaction.client.commands.get(interaction.commandName);
        if (!cmd) return;
        await cmd.execute(interaction);
        return;
      }

      // Select Menus / Buttons
      if (interaction.isStringSelectMenu()) {
        // Menüs behandeln die jeweiligen Commands selbst über customId
        const handler = interaction.client.selectHandlers?.get(interaction.customId);
        if (handler) return handler(interaction);
      }

      if (interaction.isButton()) {
        const handler = interaction.client.buttonHandlers?.get(interaction.customId);
        if (handler) return handler(interaction);
      }
    } catch (err) {
      console.error(err);
      // falls noch keine Antwort rausging
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Da ist was gecrasht beim Command.", flags: 64 }).catch(() => {});
      }
    }
  }
};
