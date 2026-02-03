const { Events } = require("discord.js");
const { makeLogEmbed } = require("../utils/logEmbed");
const { sendLog } = require("../features/logger");

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const embed = makeLogEmbed({
      title: "👋 Member verlassen",
      description: `${member.user} (${member.user.tag}) hat den Server verlassen.`,
      user: member.user,
      color: 0xed4245
    });

    await sendLog(member.guild, "join_leave", embed);
  }
};
