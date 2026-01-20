const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Shows the bot ping in ms"),
  async execute(interaction) {
    await interaction.reply(`## <:timer:1463101253382045902> **${interaction.client.ws.ping}ms** سرعة استجابة البوت هي`);
  },
};
