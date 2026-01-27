async function respond(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(payload);
    }
    return await interaction.reply(payload);
  } catch {
    // wenn Discord schon zu ist oder sonst was -> nicht crashen
  }
}

module.exports = { respond };
