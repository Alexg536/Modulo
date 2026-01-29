const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

function registerPanelHandlers(client) {
  // Vorschlag Button
  client.buttonHandlers.set("suggest:open", async (interaction) => {
    const modal = new ModalBuilder()
      .setCustomId("suggest:modal")
      .setTitle("Vorschlag einreichen");

    const input = new TextInputBuilder()
      .setCustomId("suggest:text")
      .setLabel("Dein Vorschlag")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(2000)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  });

  // Frage Button
  client.buttonHandlers.set("question:open", async (interaction) => {
    const modal = new ModalBuilder()
      .setCustomId("question:modal")
      .setTitle("Anonyme Frage einreichen");

    const input = new TextInputBuilder()
      .setCustomId("question:text")
      .setLabel("Deine Frage")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(2000)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  });
}

module.exports = { registerPanelHandlers };
