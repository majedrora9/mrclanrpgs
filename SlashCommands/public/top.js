const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const levelSys = require('../../levels/levelSystem.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Shows top 5 xp in the clan'),

  async execute(interaction) {
    const data = levelSys.load();
    const guildData = data[interaction.guild.id];

    if (!guildData) {
      return interaction.reply({ content: 'There is a no content here', ephemeral: true });
    }

    const users = Object.entries(guildData);

    const topText = [...users]
      .sort((a, b) => b[1].textXP - a[1].textXP)
      .slice(0, 5)
      .map((u, i) => `**#${i + 1} |** <@${u[0]}> — XP: \`${u[1].textXP}\``)
      .join('\n');

    const topVoice = [...users]
      .sort((a, b) => b[1].voiceXP - a[1].voiceXP)
      .slice(0, 5)
      .map((u, i) => `**#${i + 1} |** <@${u[0]}> — XP: \`${u[1].voiceXP}\``)
      .join('\n');

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `📋 Guild Score Leaderboards`,
        iconURL: interaction.guild.iconURL({ dynamic: true })
      })
      .setFooter({
        text: `${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setColor('#5865F2')
      .addFields(
        { name: 'TOP 5 TEXT <:chat:1463087192221024278>', value: topText || 'لا يوجد', inline: true },
        { name: '', value: ``, inline: true },
        { name: 'TOP 5 VOICE <:voice:1463087180430966977>', value: topVoice || 'لا يوجد', inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
