const fs = require("fs");
const path = require("path");
const {
  SlashCommandBuilder,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

const dataFile = path.join(__dirname, "../data.json");

function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows you the help commands"),

  async execute(interaction) {
    const textComponent = new TextDisplayBuilder().setContent(
      '<:question:1463802932913901590> اختر القسم من القائمة ادناه'
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('اختيار قسم..')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("الاوامر العامة")
          .setValue("general")
          .setEmoji("1463797173002043447"),
        new StringSelectMenuOptionBuilder()
          .setLabel("اعدادات البوت")
          .setValue("settings")
          .setEmoji("1463808964746809466")
      );

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
    const containerComponent = new ContainerBuilder().addTextDisplayComponents(textComponent);

    const response = await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [containerComponent, selectRow],
      withResponse: true,
    });

    const collector = response.resource.message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (i.values[0] === "general") {
        const updatedContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**<:global:1463797173002043447> الاوامر العامة**\n`/ping` - عرض سرعة استجابة البوت\n`/top` - يظهر التوب بالمستويات\n`/level` يظهر مستواك او مستوى شخص اخر")
        );
        await i.update({
          flags: MessageFlags.IsComponentsV2,
          components: [updatedContainer, selectRow],
        });
      } else if (i.values[0] === "settings") {
        const settingsText = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**<:gear:1463808964746809466> اعدادات البوت**\nاختر من الاعدادات ادناه")
        );

        const btnLogs = new ButtonBuilder()
          .setCustomId("set_welcome")
          .setLabel("تحديد روم الترحيب")
          .setStyle(ButtonStyle.Secondary);

        const btnLevels = new ButtonBuilder()
          .setCustomId("set_levels")
          .setLabel("تحديد روم رسالة المستويات")
          .setStyle(ButtonStyle.Secondary);

        const rowButtons = new ActionRowBuilder().addComponents(btnLogs, btnLevels);

        await i.update({
          flags: MessageFlags.IsComponentsV2,
          components: [settingsText, rowButtons],
        });

        const btnCollector = i.message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 120000,
        });

        btnCollector.on("collect", async (btn) => {
          if (btn.user.id !== i.user.id)
            return btn.reply({ content: "### <:uncheck:1463810954167975947> لايمكنك الظغط على هذا الزر\n-# اذا كنت تظن ان هذا خطأ بلغ فريق الدعم الفني في الكلان", flags: MessageFlags.Ephemeral });

          if (!btn.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return btn.reply({ content: "### <:uncheck:1463810954167975947> ليس لديك صلاحيات كافية لاتمام الامر", flags: MessageFlags.Ephemeral });
          }

          const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId(`channel_select_${btn.customId}`)
            .setPlaceholder("اختر الروم المراد")
            .setChannelTypes([ChannelType.GuildText]);

          const selectRow = new ActionRowBuilder().addComponents(channelSelect);

          const channelResponse = await btn.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [selectRow],
            withResponse: true
          });

          const chanCollector = channelResponse.resource.message.createMessageComponentCollector({
            componentType: ComponentType.ChannelSelect,
            time: 120000
          });

          chanCollector.on("collect", async (chanI) => {
            const channelId = chanI.values[0];

            // حفظ الروم
            const data = loadData();
            if (!data[chanI.guild.id]) data[chanI.guild.id] = {};
            data[chanI.guild.id][btn.customId] = channelId;
            saveData(data);

            const confirm = new ContainerBuilder().addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`### <:check:1463810945120862332> تم حفظ الروم <#${channelId}> بنجاح`)
            );

            await chanI.reply({
              flags: MessageFlags.IsComponentsV2,
              components: [confirm]
            });
          });
        });
      }
    });
  },
};
