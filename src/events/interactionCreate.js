const EPHEMERAL = 64;

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      // Slash Commands
      if (interaction.isChatInputCommand()) {
        const cmd = interaction.client.commands.get(interaction.commandName);
        if (!cmd) return;

        const heavy = ["ban", "kick", "warn", "timeout", "modtemplate"];
        if (heavy.includes(interaction.commandName) && !interaction.deferred && !interaction.replied) {
          await interaction.deferReply({ flags: EPHEMERAL });
        }

        await cmd.execute(interaction);
        return;
      }

      // Select Menus
      if (interaction.isStringSelectMenu()) {
        const handler = interaction.client.selectHandlers?.get(interaction.customId);
        if (handler) return handler(interaction);
      }

      // Buttons
      if (interaction.isButton()) {
        const handler = interaction.client.buttonHandlers?.get(interaction.customId);
        if (handler) return handler(interaction);
      }

      // Modals (falls du später welche nutzt)
      if (interaction.isModalSubmit()) {
        const handler = interaction.client.modalHandlers?.get(interaction.customId);
        if (handler) return handler(interaction);
      }
    } catch (err) {
      console.error(err);

      try {
        if (interaction.isRepliable()) {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: "❌ Da ist was gecrasht beim Command." });
          } else {
            await interaction.reply({ content: "❌ Da ist was gecrasht beim Command.", flags: EPHEMERAL });
          }
        }
      } catch {}
    }
  },
};
