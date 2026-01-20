const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const levelSys = require('../../levels/levelSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('View your or someone else’s level in the clan')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Choose a user to view their level')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    const data = levelSys.load();
    const guildId = interaction.guild.id;
    const userId = target.id;

    const user = levelSys.getUser(data, guildId, userId);

    const users = Object.entries(data[guildId] || {});
    const sorted = users.sort((a, b) => b[1].textXP - a[1].textXP);
    const rank = sorted.findIndex(u => u[0] === userId) + 1;

    if (target.bot) {
      return interaction.reply({
        content: "## <:wrong:1463094509121310826> عذراً ولاكن البوتات لاتملك مستويات",
        ephemeral: true
      });
    }
    
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `📋 Score of ${target.username} In The Guild`,
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `${target.tag}`,
        iconURL: target.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor('#5865F2')
      .addFields(
        {
          name: '<:chat:1463087192221024278> TEXT LEVEL',
          value: `LVL: **${user.textLevel}**\nXP: ${user.textXP}`,
          inline: true,
        },
        {
          name: '',
          value: '',
          inline: true,
        },
        {
          name: '<:voice:1463087180430966977> VOICE LEVEL',
          value: `LVL: **${user.voiceLevel}**\nXP: ${user.voiceXP}`,
          inline: true,
        },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
