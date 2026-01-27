const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

const { getGuildConfig, setGuildConfig } = require("../utils/config");
const { createSubmission, getSubmission, updateSubmission } = require("../utils/submissions");

// Branding
const MODULO_NAME = "MODULO";
const MODULO_ICON = "https://cdn.discordapp.com/attachments/1457517538601603307/1457811095606661140/MODULO-logo-slogen-klein_1.png?ex=6977b9e2&is=69766862&hm=49261ab3b70a5e544948bf3afdd4536820882c42f419323244527fb7310ece16&"; // optional: direkte .png/.jpg URL (Discord-CDN ist perfekt)

function tsGerman(ms) {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

function buildFooter() {
  return { text: MODULO_NAME, iconURL: MODULO_ICON || undefined };
}

function buildLogEmbed(sub) {
  const title = sub.type === "question" ? "🆕 Neue Anonyme Frage" : "🆕 Neuer Vorschlag";

  return new EmbedBuilder()
    .setTitle(title)
    .addFields(
      { name: "Eingereicht von", value: `<@${sub.authorId}> (ID: \`${sub.authorId}\`)`, inline: false },
      { name: "Eingereicht am", value: tsGerman(sub.createdAt), inline: false },
      { name: sub.type === "question" ? "Frage" : "Vorschlag", value: sub.content.slice(0, 4000), inline: false }
    )
    .setFooter(buildFooter())
    .setTimestamp(new Date(sub.createdAt));
}

function buildDecisionEmbed(sub) {
  const base = buildLogEmbed(sub);

  if (sub.status === "approved") {
    base.addFields(
      { name: "Status", value: `✅ **Angenommen** von <@${sub.decisionBy}> am ${tsGerman(sub.decisionAt)}`, inline: false },
      { name: "Antwort", value: (sub.answer || "-").slice(0, 4000), inline: false }
    );
  } else {
    base.addFields({
      name: "Status",
      value: `❌ **Abgelehnt** von <@${sub.decisionBy}> am ${tsGerman(sub.decisionAt)}${sub.reason ? `\n📝 Grund: ${sub.reason}` : ""}`,
      inline: false,
    });
  }

  return base;
}

function reviewButtons(subId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`rev:approve:${subId}`).setLabel("Annehmen").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rev:reject:${subId}`).setLabel("Ablehnen").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`rev:reason:${subId}`).setLabel("Ablehnen (Grund)").setStyle(ButtonStyle.Secondary)
  );
}

function buildPanelEmbed(type) {
  const title = type === "question" ? "❓ Anonyme Fragen" : "💡 Vorschläge";
  const desc =
    type === "question"
      ? "**Willkommen beim Anonyme-Fragen-Bot von queermeet.de** 🏳️‍🌈\n\n" +
"Du hast Fragen zur Community oder zu LGBTQ+-Themen?\n" +
"Dann klicke unten auf 🎟️ und reiche deine Frage **anonym** ein.\n\n" +
"Unser Team gibt sein Bestes, deine Frage so schnell wie möglich zu beantworten 💬\n\n" +
"Wenn du keine neuen Fragen verpassen möchtest, kannst du dir unter **Kanäle & Rollen** " +
"die Rolle **„Anonyme Fragen“** zuweisen." //Text für AnonymFragen Panel

      : "**Willkommen beim Vorschlags-Bot von queermeet.de** 💡\n\n" +
"Du hast eine Idee oder einen Vorschlag, wie wir queermeet verbessern können?\n" +
"Dann klicke unten auf 🎟️ und reiche deinen Vorschlag ein.\n\n" +
"Unser Team prüft jeden Vorschlag sorgfältig und entscheidet gemeinsam darüber 💬\n\n" +
"Wenn dein Vorschlag angenommen wird, erscheint er öffentlich als Thread gepostet "; //Text für Vorschläge Panel

  return new EmbedBuilder().setTitle(title).setDescription(desc).setFooter(buildFooter()).setTimestamp(new Date());
}

function buildPanelButtons(type) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`panel:open:${type}`).setLabel("🎟️ Einreichen").setStyle(ButtonStyle.Primary)
  );
}

async function safeDM(client, userId, payload) {
  try {
    const u = await client.users.fetch(userId);
    await u.send(payload);
  } catch {
    // User hat DMs aus oder blockt — egal, wir crashen nicht
  }
}

async function postToThread(guild, cfg, sub, answerText) {
  const targetId = cfg[sub.type]?.threadChannelId;
  if (!targetId) throw new Error("THREAD_CHANNEL_NOT_SET");

  const channel = await guild.channels.fetch(targetId);
  if (!channel) throw new Error("THREAD_CHANNEL_NOT_FOUND");

  const publicTitle = sub.type === "question" ? "Anonyme Frage" : "Vorschlag";

  const publicEmbed = new EmbedBuilder()
    .setTitle(publicTitle)
    .setDescription(sub.content)
    .setFooter(buildFooter())
    .setTimestamp(new Date(sub.createdAt));

  if (sub.type === "suggestion") {
    publicEmbed.addFields({ name: "Eingereicht von", value: `<@${sub.authorId}>`, inline: false });
  }

  // Thread über Start-Message erstellen (funktioniert zuverlässig)
  const baseMsg = await channel.send({ embeds: [publicEmbed] });

  const threadName =
    sub.type === "question"
      ? `Frage • ${tsGerman(sub.createdAt)}`
      : `Vorschlag • ${tsGerman(sub.createdAt)}`;

  const thread = await baseMsg.startThread({
    name: threadName.slice(0, 100),
    autoArchiveDuration: 1440,
  });

  await thread.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("Antwort vom Team")
        .setDescription(answerText)
        .setFooter(buildFooter())
        .setTimestamp(new Date())
    ],
  });

  return thread;
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    // ---------- BUTTONS ----------
    if (interaction.isButton()) {
      const id = interaction.customId;

      // Panel -> Modal öffnen
      if (id.startsWith("panel:open:")) {
        const type = id.split(":")[2]; // question|suggestion
        const modal = new ModalBuilder()
          .setCustomId(`modal:submit:${type}`)
          .setTitle(type === "question" ? "Anonyme Frage einreichen" : "Vorschlag einreichen");

        const input = new TextInputBuilder()
          .setCustomId("content")
          .setLabel(type === "question" ? "Deine Frage" : "Dein Vorschlag")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1800);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      // Review Buttons
      if (id.startsWith("rev:approve:")) {
        const subId = id.split(":")[2];

        const modal = new ModalBuilder()
          .setCustomId(`modal:approve:${subId}`)
          .setTitle("Annehmen – Antwort schreiben");

        const answer = new TextInputBuilder()
          .setCustomId("answer")
          .setLabel("Antwort (wird im Thread gepostet)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1800);

        modal.addComponents(new ActionRowBuilder().addComponents(answer));
        return interaction.showModal(modal);
      }

      if (id.startsWith("rev:reject:")) {
        const subId = id.split(":")[2];
        const sub = getSubmission(subId);
        if (!sub) return interaction.reply({ content: "❌ Submission nicht gefunden.", flags: 64 });

        if (sub.status !== "pending") {
          return interaction.reply({ content: "⚠️ Das wurde schon entschieden.", flags: 64 });
        }

        const updated = updateSubmission(subId, {
          status: "rejected",
          decisionAt: Date.now(),
          decisionBy: interaction.user.id,
          reason: null,
        });

        // Log-Message editieren (Buttons weg)
        try {
          await interaction.message.edit({ embeds: [buildDecisionEmbed(updated)], components: [] });
        } catch {}

        await safeDM(interaction.client, updated.authorId, {
          content: `❌ Dein ${updated.type === "question" ? "Frage" : "Vorschlag"} wurde abgelehnt.`,
        });

        return interaction.reply({ content: "✅ Abgelehnt.", flags: 64 });
      }

      if (id.startsWith("rev:reason:")) {
        const subId = id.split(":")[2];

        const modal = new ModalBuilder()
          .setCustomId(`modal:reject:${subId}`)
          .setTitle("Ablehnen – Grund angeben");

        const reason = new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Grund (wird per DM an das Mitglied gesendet)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1800);

        modal.addComponents(new ActionRowBuilder().addComponents(reason));
        return interaction.showModal(modal);
      }

      return;
    }

    // ---------- MODALS ----------
    if (interaction.isModalSubmit()) {
      const id = interaction.customId;

      // Einreichen
      if (id.startsWith("modal:submit:")) {
        const type = id.split(":")[2]; // question|suggestion
        const content = interaction.fields.getTextInputValue("content");

        const cfg = getGuildConfig(interaction.guildId);
        if (!cfg.logChannelId) {
          return interaction.reply({ content: "❌ Log-Channel ist nicht gesetzt.", flags: 64 });
        }

        const sub = createSubmission({
          guildId: interaction.guildId,
          type,
          authorId: interaction.user.id,
          authorTag: interaction.user.tag,
          content,
        });

        const logChannel = await interaction.guild.channels.fetch(cfg.logChannelId);
        if (!logChannel) {
          return interaction.reply({ content: "❌ Log-Channel wurde nicht gefunden.", flags: 64 });
        }

        const msg = await logChannel.send({
          embeds: [buildLogEmbed(sub)],
          components: [reviewButtons(sub.id)],
        });

        updateSubmission(sub.id, { logMessageId: msg.id });

        return interaction.reply({
          content: `✅ Danke! Dein ${type === "question" ? "Frage" : "Vorschlag"} wurde eingereicht und wird vom Team geprüft.`,
          flags: 64,
        });
      }

      // Ablehnen mit Grund
      if (id.startsWith("modal:reject:")) {
        const subId = id.split(":")[2];
        const reason = interaction.fields.getTextInputValue("reason");

        const sub = getSubmission(subId);
        if (!sub) return interaction.reply({ content: "❌ Submission nicht gefunden.", flags: 64 });
        if (sub.status !== "pending") return interaction.reply({ content: "⚠️ Das wurde schon entschieden.", flags: 64 });

        const updated = updateSubmission(subId, {
          status: "rejected",
          decisionAt: Date.now(),
          decisionBy: interaction.user.id,
          reason,
        });

        // Log editieren (Buttons weg)
        try {
          // interaction.message gibts bei Modal nicht -> wir editieren über logMessageId
          const cfg = getGuildConfig(interaction.guildId);
          const logChannel = await interaction.guild.channels.fetch(cfg.logChannelId);
          const logMsg = await logChannel.messages.fetch(updated.logMessageId);
          await logMsg.edit({ embeds: [buildDecisionEmbed(updated)], components: [] });
        } catch {}

        await safeDM(interaction.client, updated.authorId, {
          content: `❌ Dein ${updated.type === "question" ? "Frage" : "Vorschlag"} wurde abgelehnt.\n📝 Grund: ${reason}`,
        });

        return interaction.reply({ content: "✅ Abgelehnt (mit Grund).", flags: 64 });
      }

      // Annehmen mit Antwort
      if (id.startsWith("modal:approve:")) {
        const subId = id.split(":")[2];
        const answer = interaction.fields.getTextInputValue("answer");

        const sub = getSubmission(subId);
        if (!sub) return interaction.reply({ content: "❌ Submission nicht gefunden.", flags: 64 });
        if (sub.status !== "pending") return interaction.reply({ content: "⚠️ Das wurde schon entschieden.", flags: 64 });

        const updated = updateSubmission(subId, {
          status: "approved",
          decisionAt: Date.now(),
          decisionBy: interaction.user.id,
          answer,
        });

        // Thread posten
        let thread = null;
        try {
          const cfg = getGuildConfig(interaction.guildId);
          thread = await postToThread(interaction.guild, cfg, updated, answer);
        } catch (err) {
          console.error(err);
          // wenn Thread nicht geht, trotzdem den Log-Status setzen, aber Team informieren
          await interaction.reply({ content: "⚠️ Angenommen, aber Thread konnte nicht erstellt werden. Bitte Thread-Channel Setup checken.", flags: 64 });
          // Log trotzdem updaten
          try {
            const cfg = getGuildConfig(interaction.guildId);
            const logChannel = await interaction.guild.channels.fetch(cfg.logChannelId);
            const logMsg = await logChannel.messages.fetch(updated.logMessageId);
            await logMsg.edit({ embeds: [buildDecisionEmbed(updated)], components: [] });
          } catch {}
          await safeDM(interaction.client, updated.authorId, {
            content: `✅ Dein ${updated.type === "question" ? "Frage" : "Vorschlag"} wurde angenommen.\n\nAntwort:\n${answer}`,
          });
          return;
        }

        // Log-Embed ersetzen + Buttons weg
        try {
          const cfg = getGuildConfig(interaction.guildId);
          const logChannel = await interaction.guild.channels.fetch(cfg.logChannelId);
          const logMsg = await logChannel.messages.fetch(updated.logMessageId);
          await logMsg.edit({ embeds: [buildDecisionEmbed(updated)], components: [] });
        } catch {}

        // User DM
        await safeDM(interaction.client, updated.authorId, {
          content:
            `✅ Dein ${updated.type === "question" ? "Frage" : "Vorschlag"} wurde angenommen!\n` +
            `🧵 Thread: ${thread?.url || "—"}\n\nAntwort:\n${answer}`,
        });

        return interaction.reply({ content: "✅ Angenommen + Thread erstellt + User benachrichtigt.", flags: 64 });
      }

      return;
    }

    // ---------- SLASH COMMANDS ----------
    if (interaction.isChatInputCommand()) {
      const cmd = interaction.client.commands.get(interaction.commandName);
      if (!cmd) return;

      try {
        await cmd.execute(interaction, { buildPanelEmbed, buildPanelButtons, MODULO_NAME, MODULO_ICON, getGuildConfig, setGuildConfig });
      } catch (err) {
        console.error(err);
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: "❌ Da ist was gecrasht beim Command." });
          } else {
            await interaction.reply({ content: "❌ Da ist was gecrasht beim Command.", flags: 64 });
          }
        } catch {}
      }
    }
  },
};
