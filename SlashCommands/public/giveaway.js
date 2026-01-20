const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");

const GIVEAWAY_ROLE_ID = "1463093059691745312";
const GIVEAWAY_CHANNEL_ID = "1452917645228638238";
const GIVEAWAY_EMOJI = "🎉";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Creates a giveaway in events channel"),

  async execute(interaction) {
    // تحقق من الرتبة
    if (!interaction.member.roles.cache.has(GIVEAWAY_ROLE_ID)) {
      return interaction.reply({
        content: "## <:wrong:1463094509121310826> ليس لديك صلاحيات كافية",
        ephemeral: true,
      });
    }

    // إنشاء الـ Modal
    const modal = new ModalBuilder()
      .setCustomId("giveaway_modal")
      .setTitle("إنشاء قيف أواي");

    // Prize
    const prizeInput = new TextInputBuilder()
      .setCustomId("prize")
      .setLabel("Prize Label")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("A Discord Nitro")
      .setRequired(true);

    // Duration
    const durationInput = new TextInputBuilder()
      .setCustomId("duration")
      .setLabel("Duration")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("ex: 1d, 1h, 1m, 1s")
      .setRequired(true);

    // Winners
    const winnersInput = new TextInputBuilder()
      .setCustomId("winners")
      .setLabel("Winners Count")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("ex: 3")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(prizeInput),
      new ActionRowBuilder().addComponents(durationInput),
      new ActionRowBuilder().addComponents(winnersInput),
    );

    await interaction.showModal(modal);
  },

  async modal(interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "giveaway_modal") return;

    // الحصول على القيم
    const prize = interaction.fields.getTextInputValue("prize");
    const duration = interaction.fields.getTextInputValue("duration");
    const winnersCount = parseInt(
      interaction.fields.getTextInputValue("winners"),
    );
    const durationMs = parseDuration(duration);

    if (!durationMs || winnersCount <= 0) {
      return interaction.reply({
        content: "## <:wrong:1463094509121310826> هناك خطأ ما في المدة أو عدد الفائزين",
        ephemeral: true,
      });
    }

    // حساب الوقت النهائي للـ timestamp
    const endTime = Date.now() + durationMs;
    const timestamp = Math.floor(endTime / 1000);

    // الرد على صاحب الـ modal مرة واحدة
    await interaction.reply({
      content: "## <:verify:1463099962324680745> لقد تم انشاء القيف اواي بنجاح",
      ephemeral: true,
    });

    const giveawayChannel =
      interaction.guild.channels.cache.get(GIVEAWAY_CHANNEL_ID);
    if (!giveawayChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("🎉 قيف اواي!")
      .setDescription(
        `**Prize:** ${prize}\n**Winners Count:** ${winnersCount}\n**Ends in:** <t:${timestamp}:R>`,
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `Created by ${interaction.user.tag}` })
      .setColor("#2f3136");

    const giveawayMessage = await giveawayChannel.send({
      content: GIVEAWAY_EMOJI,
      embeds: [embed],
    });
    await giveawayMessage.react(GIVEAWAY_EMOJI);

    // انتهاء القيف أواي بعد المدة
    setTimeout(async () => {
      const msg = await giveawayChannel.messages.fetch(giveawayMessage.id);
      const reactions = msg.reactions.cache.get(GIVEAWAY_EMOJI);
      if (!reactions) return;

      const users = (await reactions.users.fetch())
        .filter((u) => !u.bot)
        .map((u) => u.id);
      if (users.length === 0) {
        return giveawayChannel.send("## <:wrong:1463094509121310826> لايوجد مشاركين في القيف اواي");
      }

      const winners = [];
      for (let i = 0; i < Math.min(winnersCount, users.length); i++) {
        const winnerIndex = Math.floor(Math.random() * users.length);
        winners.push(users[winnerIndex]);
        users.splice(winnerIndex, 1);
      }

      giveawayChannel.send(
        `## <:cup:1463086923848613929> Winners: ${winners.map((id) => `<@${id}>`).join(", ")}\n**Prize:** ${prize}`,
      );
    }, durationMs);
  },
};

// ==============================
// دالة تحويل المدة لنانو ثانية
// ==============================
function parseDuration(duration) {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const amount = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}
