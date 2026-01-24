const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Test the bot response time"),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: "### <:reload:1463797910620868752> جاري حساب سرعة البوت..",
      fetchReply: true
    });

    interaction.editReply(
      `### <:global:1463797173002043447> **${interaction.client.ws.ping}ms** سرعة استجابة البوت هي`
    );
  }
};
