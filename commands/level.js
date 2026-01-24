const {
  SlashCommandBuilder,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const { getTop, getUserXP } = require("../xphandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("Shows your or someone else's level")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Optional user to check")
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const target = interaction.options.getUser("user") || interaction.user;

    const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!targetMember) return interaction.reply({ content: "### <:uncheck:1463810954167975947> المستخدم غير موجود في السيرفر", ephemeral: true });
    if (targetMember.user.bot) return interaction.reply({ content: "### <:uncheck:1463810954167975947> البوتات لاتملك مستويات", ephemeral: true });

    const xpData = getUserXP(guildId, target.id);
    if (!xpData) return interaction.reply({ content: "### <:uncheck:1463810954167975947> لايوجد بيانات لهذا المستخدم", ephemeral: true });

    const totalXP = xpData.textXP + xpData.voiceXP; 
    const level = xpData.level;

    const xpForNext = 50 * (level ** 2) + 50 * level;
    const xpLeft = xpForNext - totalXP;

    const top = getTop(guildId, "total");
    const rank = top.findIndex(u => u.id === target.id) + 1;

    const textComponent = new TextDisplayBuilder().setContent(
      `**<:particles:1463824446136782900> ${target.username} معلومات عن مستوى**\n\n` +
      `**${level}** :المستوى\n` +
      `**${totalXP}** :مجموع النقاط\n` +
      `**${xpLeft}** :متبقي للمستوى القادم\n` +
      `**#${rank}** :الترتيب في هذا الخادم`
    );

    const containerComponent = new ContainerBuilder().addTextDisplayComponents(textComponent);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [containerComponent],
    });
  },
};
