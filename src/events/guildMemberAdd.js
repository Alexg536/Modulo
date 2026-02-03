const { Events } = require("discord.js");
const { makeLogEmbed } = require("../utils/logEmbed");
const { sendLog } = require("../features/logger");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const embed = makeLogEmbed({
      title: "✅ Member beigetreten",
      description: `${member.user} (${member.user.tag}) ist dem Server beigetreten.`,
      user: member.user,
      color: 0x57f287
    });

    await sendLog(member.guild, "join_leave", embed);
  }
};
