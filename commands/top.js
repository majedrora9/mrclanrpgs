const {
  SlashCommandBuilder,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");
const { getTop } = require("../xphandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("top")
    .setDescription("Shows top members with xp"),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    // نجيب أفضل 5 لكل نوع
    let topText = getTop(guildId, "text", 5);
    let topVoice = getTop(guildId, "voice", 5);

    // تجهيز النص الرئيسي للعرض جنب بعض
const buildTopText = () => {
  let desc = "**<:chat:1463819420030734450> Top Text XP**                           **<:headphone:1463819417640108107> Top Voice XP**\n";

  for (let j = 0; j < 5; j++) {
    const t = topText[j];
    const v = topVoice[j];

    const textName = t ? `<@${t.id}> (xp: ${t.xp})` : "—";
    const voiceName = v ? `<@${v.id}> (xp: ${v.xp})` : "—";

    // هنا نضيف مسافة تقريبية بين العمودين
    const space = " ".repeat(5 + 50 - textName.length); // عدل الرقم 50 حسب طول الاسماء

    desc += `${j + 1}. ${textName}${space}${j + 1}. ${voiceName}\n`;
  }

  return desc;
};


    const textComponent = new TextDisplayBuilder().setContent(buildTopText());
    const containerComponent = new ContainerBuilder().addTextDisplayComponents(textComponent);

    // Select Menu لتحديث البيانات
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('top_select')
      .setPlaceholder('اختر طريقة العرض..')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("التوب بالمحادثة")
          .setValue("text")
          .setEmoji("1463819420030734450"),
        new StringSelectMenuOptionBuilder()
          .setLabel("التوب بالصوتي")
          .setValue("voice")
          .setEmoji("1463819417640108107"),
        new StringSelectMenuOptionBuilder()
          .setLabel("اعادة التحديث")
          .setValue("both")
          .setEmoji("1463797910620868752")
      );

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    const response = await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [containerComponent, selectRow],
      withResponse: true,
    });

    // Collector لتحديث نفس الرسالة
    const collector = response.resource.message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120_000, // 2 دقيقة
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id)
        return i.reply({ content: "### <:uncheck:1463810954167975947> لايمكنك الظغط على هذا الاختيار\n-# اذا كنت تظن ان هذا خطأ بلغ فريق الدعم الفني في الكلان", ephemeral: true });

      const selected = i.values[0];

      // تحديث البيانات من جديد
      topText = getTop(guildId, "text", 5);
      topVoice = getTop(guildId, "voice", 5);

      let newDesc;
      if (selected === "text") {
        newDesc = "**<:chat:1463819420030734450> التوب بالكتابي**\n";
        for (let j = 0; j < 5; j++) {
          const t = topText[j];
          const textName = t ? `<@${t.id}> \`(xp: ${t.xp})\`` : "—";
          newDesc += `${j + 1}. ${textName}\n`;
        }
      } else if (selected === "voice") {
        newDesc = "**<:headphone:1463819417640108107> التوب بالصوتي**\n";
        for (let j = 0; j < 5; j++) {
          const v = topVoice[j];
          const voiceName = v ? `<@${v.id}> \`(xp: ${v.xp})\`` : "—";
          newDesc += `${j + 1}. ${voiceName}\n`;
        }
      } else if (selected === "both") {
        newDesc = buildTopText(); // نص جنب بعض
      }

      const updatedContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(newDesc)
      );

      await i.update({
        flags: MessageFlags.IsComponentsV2,
        components: [updatedContainer, selectRow],
      });
    });

    collector.on('end', async () => {
      selectMenu.setDisabled(true);
      const disabledRow = new ActionRowBuilder().addComponents(selectMenu);
      await interaction.editReply({ components: [containerComponent, disabledRow] });
    });
  },
};
