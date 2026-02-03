const { ChannelType } = require("discord.js");
const { getGuild } = require("../utils/storage");

async function sendLog(guild, type, embed) {
  const settings = getGuild(guild.id);
  const channelId = settings?.logChannels?.[type];
  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel) return;
  if (channel.type !== ChannelType.GuildText) return;

  await channel.send({ embeds: [embed] }).catch(() => null);
}

module.exports = { sendLog };
