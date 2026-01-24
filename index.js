const express = require("express");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  ActivityType,
  Partials,
  TextDisplayBuilder, 
  ContainerBuilder, 
  MessageFlags,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const { addXP } = require("./xphandler");
const settingsFile = "./data.json";
/* ===================== Express ===================== */
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot is running ✅"));
app.listen(PORT, () =>
  console.log(`🌐 Web server running on port ${PORT}`)
);

/* ===================== Discord Bot ===================== */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.GuildMember],
});

client.commands = new Collection();

// تحميل الأوامر
for (const file of fs.readdirSync("./commands")) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: "/help", type: ActivityType.Competing }],
    status: "online",
  });
});

// أوامر السلاش
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    interaction.reply({
      content:
        "### <:uncheck:1463810954167975947> عذراً لقد حدث خطأ\n-# يرجى إبلاغ فريق الدعم",
      ephemeral: true,
    });
  }
});

/* ===================== TEXT XP ===================== */
client.on("messageCreate", (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  addXP(client, message.guild.id, message.member, "text", 5);
});

/* ===================== VOICE XP ===================== */
const voiceTimers = new Map();

client.on("voiceStateUpdate", (oldState, newState) => {
  const member = newState.member;
  if (!member || member.user.bot) return;

  const guildId = newState.guild.id;

  // دخول قناة صوتية
  if (!oldState.channelId && newState.channelId) {
    if (voiceTimers.has(member.id))
      clearInterval(voiceTimers.get(member.id));

    const timer = setInterval(() => {
      // ❌ لا XP لو ميوت
      if (
        member.voice.selfMute ||
        member.voice.serverMute ||
        member.voice.selfDeaf ||
        member.voice.serverDeaf
      )
        return;

      addXP(client, guildId, member, "voice", 5);
      console.log(`+5 voice XP → ${member.user.username}`);
    }, 5 * 60 * 1000); // كل 5 دقائق

    voiceTimers.set(member.id, timer);
  }

  // خروج أو تغيير قناة
  if (
    oldState.channelId &&
    (!newState.channelId || oldState.channelId !== newState.channelId)
  ) {
    if (voiceTimers.has(member.id)) {
      clearInterval(voiceTimers.get(member.id));
      voiceTimers.delete(member.id);
    }
  }
});


function loadSettings() {
  if (!fs.existsSync(settingsFile)) return {};
  return JSON.parse(fs.readFileSync(settingsFile, "utf8"));
}

/* ===================== WELCOMEE MEMBER ===================== */
client.on("guildMemberAdd", async (member) => {
  try {
    if (member.user.bot) return;

    const settings = loadSettings();
    const welcomeChannelId = settings[member.guild.id]?.set_welcome;
    if (!welcomeChannelId) return;

    const channel = await member.guild.channels.fetch(welcomeChannelId);
    if (!channel) return;

    channel.send(
      `### <:mr_logo:1452904673370574969> \`-\` MR Clan, اهلاً بك <@${member.id}> في`
    );
  } catch (err) {
    console.error("WELCOME MESSAGE ERROR:", err);
  }
});


// client.on('messageCreate', async (message) => {
//   if (message.content === 'ping') {
//     const textComponent = new TextDisplayBuilder().setContent(`## <:particles:1463824446136782900> MR Clan اهلاً بك في`);
//     const textComponent1 = new TextDisplayBuilder().setContent(`حيث المكان الذي يجتمع به اللاعبين المحترفين`);
//     const textComponent2 = new TextDisplayBuilder().setContent(`ويتنافس فيه كل محترف ضد خصمه`);

//     const separatorComponent = new SeparatorBuilder();

//     const thumbnailComponent = new ThumbnailBuilder({
//       media: {
//         url: 'https://cdn.discordapp.com/attachments/1463797828563374159/1464525955484614686/img.png?ex=6975c995&is=69747815&hm=63ca6964b2b63cd12db67c736d51d4981832e2264cd9e63b92f8286b78c44936&',
//       },
//     });

//     const sectionComponent = new SectionBuilder()
//       .addTextDisplayComponents(textComponent, textComponent1, textComponent2)
//       .setThumbnailAccessory(thumbnailComponent);

//     message.channel.send({
//       flags: MessageFlags.IsComponentsV2,
//       components: [sectionComponent],
//     });
//   }
// });

// client.on('messageCreate', async (message) => {
//   if (message.content === 'ping') {
//     const textComponent = new TextDisplayBuilder().setContent('## <:staff:1464524955759935542> نظرة عامة عن القوانين');
//     const textComponent1 = new TextDisplayBuilder().setContent('- يجب عليك احترام الاخرين بما فيهم الادارة والاعضاء\n- يمنع المناقشة بالأمور (السياسية، الترويجية، الدينية)\n- يمنع اهانة او استفزاز اي عضو داخل السيرفر\n- احترم الشات ولاتستخدم ايموجيات او ستيكرات غير لائقة\n- حل مشاكلك الخاصة خارج السيرفر\n- يمنع الترويج بدون إذن مسبق من الادارة\n- تجنب استخدام الالفاظ الغير لائقة داخل السيرفر\n-# <id:customize> لاختيار رتبك وتصنيفاتك ضمن السيرفر توجه الى');

//     const separatorComponent = new SeparatorBuilder();

//     message.channel.send({
//       flags: MessageFlags.IsComponentsV2,
//       components: [separatorComponent, textComponent, textComponent1, separatorComponent],
//     });
//   }
// });

client.login(process.env.TOKEN);

module.exports = { client };
