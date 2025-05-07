const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Orvex's ping"),
  async execute(interaction, client) {
    await interaction.deferReply();
    const reply = await interaction.fetchReply();
    const messagePing = reply.createdTimestamp - interaction.createdTimestamp;
    const apiPing = Math.round(client.ws.ping);

    const getStatus = (ms) => {
      if (ms < 100) return "🟢 Excellent";
      if (ms < 200) return "🟡 Good";
      if (ms < 400) return "🟠 Moderate";
      return "🔴 High";
    };

    const embed = new EmbedBuilder()
      .setTitle("Orvex's Latency")
      .setColor(
        messagePing < 200
          ? "#43B581"
          : messagePing < 400
          ? "#FAA61A"
          : "#F04747"
      )
      .setDescription(`Checking ping to Discord's servers...`)
      .addFields(
        {
          name: "Message Latency",
          value: `\`\`\`${messagePing}ms\`\`\` ${getStatus(messagePing)}`,
          inline: true,
        },
        {
          name: "API Latency",
          value: `\`\`\`${apiPing}ms\`\`\` ${getStatus(apiPing)}`,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
