require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  ActionRowBuilder,
  EmbedBuilder
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const levelSys = require('./levels/levelSystem');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

// -----------------------------
// المتغيرات المهمة للفلات
// -----------------------------
const LEVEL_CHANNEL_ID = '1452910208765530202'; // روم التلفيل
const ROLE_ID = '1460212347216986132';                // الرتبة التي ستعطى عند تحقق الشرط
const PREV_ROLE_ID = '838147551873466409';      // الرتبة السابقة التي ستزال
const GIVEAWAY_CHANNEL_ID = '1452917645228638238';

// -----------------------------
// تحميل أوامر السلاش
// -----------------------------
const commandsPath = path.join(__dirname, "SlashCommands/public");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

const commands = [];
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

// تسجيل أوامر السلاش على السيرفر
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands for guild.");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Successfully reloaded application (/) commands for guild.");
  } catch (error) {
    console.error(error);
  }
})();

// -----------------------------
// تسجيل الدخول
// -----------------------------
client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// -----------------------------
// نظام الرسائل الكتابية
// -----------------------------
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const data = levelSys.load();
  const user = levelSys.getUser(data, message.guild.id, message.author.id);

  user.textXP += 5;
  const newLevel = levelSys.calcLevel(user.textXP);

  if (newLevel > user.textLevel) {
    const levelChannel = message.guild.channels.cache.get(LEVEL_CHANNEL_ID);
    if (levelChannel) {
      levelChannel.send(`\`-\` لقد ارتفع مستواك الكتابي يا ${message.author.toString()} إلى المستوى ${newLevel} <:arrowup:1460214641736028313>`);
    }
    user.textLevel = newLevel;
  }

  // تحقق من شرط الرتبة: الكتابي ≥ 25 و الصوتي ≥ 15
  if (user.textLevel >= 25 && user.voiceLevel >= 15) {
    const member = message.member;
    if (!member.roles.cache.has(ROLE_ID)) {
      // إزالة الرتبة السابقة
      if (PREV_ROLE_ID) member.roles.remove(PREV_ROLE_ID).catch(() => {});
      // إعطاء الرتبة الجديدة
      if (ROLE_ID) member.roles.add(ROLE_ID).catch(() => {});

      const levelChannel = message.guild.channels.cache.get(LEVEL_CHANNEL_ID);
      if (levelChannel) {
        levelChannel.send(`\`-\` ${message.author.toString()} لقد حصلت على عضوية اللاعب المتفاعل <:person:1460203926329491538>`);
      }
    }
  }

  levelSys.save(data);
});

// -----------------------------
// نظام الصوتي
// -----------------------------
const voiceTimes = new Map();

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!oldState.channel && newState.channel) {
    voiceTimes.set(newState.id, Date.now());
  }

  if (oldState.channel && !newState.channel) {
    const joinTime = voiceTimes.get(oldState.id);
    if (!joinTime) return;

    const minutes = Math.floor((Date.now() - joinTime) / 60000);
    voiceTimes.delete(oldState.id);

    const data = levelSys.load();
    const user = levelSys.getUser(data, oldState.guild.id, oldState.id);

    user.voiceXP += minutes * 10;
    const newLevel = levelSys.calcLevel(user.voiceXP);

    if (newLevel > user.voiceLevel) {
      const levelChannel = oldState.guild.channels.cache.get(LEVEL_CHANNEL_ID);
      if (levelChannel) {
        levelChannel.send(`\`-\` لقد ارتفع مستواك الصوتي يا <@${oldState.id}> إلى المستوى ${newLevel} <:arrowup:1460214641736028313>`);
      }
      user.voiceLevel = newLevel;
    }

    // تحقق من شرط الرتبة: الكتابي ≥ 25 و الصوتي ≥ 15
    if (user.textLevel >= 25 && user.voiceLevel >= 15) {
      const member = oldState.guild.members.cache.get(oldState.id);
      if (!member.roles.cache.has(ROLE_ID)) {
        if (PREV_ROLE_ID) member.roles.remove(PREV_ROLE_ID).catch(() => {});
        if (ROLE_ID) member.roles.add(ROLE_ID).catch(() => {});

        const levelChannel = oldState.guild.channels.cache.get(LEVEL_CHANNEL_ID);
        if (levelChannel) {
          levelChannel.send(`\`-\` <@${oldState.id}> لقد حصلت على عضوية اللاعب المتفاعل <:person:1460203926329491538>`);
        }
      }
    }

    levelSys.save(data);
  }
});

// -----------------------------
// التعامل مع أوامر السلاش + أزرار
// -----------------------------
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    }

    if (interaction.isButton()) {
      for (const command of client.commands.values()) {
        if (command.button) {
          await command.button(interaction);
        }
      }
    }
  } catch (err) {
    console.error(err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '## <:developer:1460231279978090630> عذراً لقد حدث خطأ ما', ephemeral: true });
    }
  }
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction); // يظهر الـ Modal
    }

    if (interaction.isModalSubmit()) {
      const command = client.commands.get('giveaway'); // اسم الكوماند
      if (command && command.modal) {
        await command.modal(interaction); // تنفيذ الكود بعد submit
      }
    }
  } catch (err) {
    console.error(err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ حصل خطأ', ephemeral: true });
    }
  }
});

// -----------------------------
// حماية من الأخطاء
// -----------------------------
client.on('error', console.error);
process.on('unhandledRejection', console.error);

// -----------------------------
// تسجيل الدخول
// -----------------------------
client.login(process.env.TOKEN);