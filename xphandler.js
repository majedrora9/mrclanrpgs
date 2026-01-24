const fs = require("fs");

const xpFile = "./xp.json";
const settingsFile = "./data.json";

function loadXP() {
  if (!fs.existsSync(xpFile)) return {};
  return JSON.parse(fs.readFileSync(xpFile, "utf8"));
}

function saveXP(data) {
  fs.writeFileSync(xpFile, JSON.stringify(data, null, 2));
}

function loadSettings() {
  if (!fs.existsSync(settingsFile)) return {};
  return JSON.parse(fs.readFileSync(settingsFile, "utf8"));
}

function addXP(client, guildId, member, type, amount = 10) {
  if (!member || member.user.bot) return;

  const xpData = loadXP();

  if (!xpData[guildId]) xpData[guildId] = {};
  if (!xpData[guildId][member.id]) {
    xpData[guildId][member.id] = {
      textXP: 0,
      voiceXP: 0,
      level: 1,
    };
  }

  const user = xpData[guildId][member.id];
 

  if (type === "text") user.textXP += amount;
  if (type === "voice") user.voiceXP += amount;

const oldLevel = user.level;

const totalXP = user.textXP + user.voiceXP;
const newLevel = Math.floor(totalXP / 100) + 1;

if (newLevel !== oldLevel) {
  user.level = newLevel;

  const settings = loadSettings();
  const levelChannelId = settings[guildId]?.set_levels;

  if (levelChannelId) {
    client.channels.fetch(levelChannelId).then(channel => {
      if (!channel) return;

      channel.send(
        `### <:tada:1463824159086870706> \`-\` لقد ارتفع مستواك يا <@${member.id}> إلى المستوى **${newLevel}**`
      );
    }).catch(console.error);
  }
}


  user.level = newLevel;
  saveXP(xpData);
}

/* ===================== GET USER XP ===================== */
function getUserXP(guildId, userId) {
  const xpData = loadXP();
  if (!xpData[guildId] || !xpData[guildId][userId]) {
    return { textXP: 0, voiceXP: 0, level: 1 };
  }
  return xpData[guildId][userId];
}

/* ===================== TOP ===================== */
function getTop(guildId, type = "total", limit = 5) {
  const xpData = loadXP()[guildId] || {};

  const arr = Object.entries(xpData).map(([id, info]) => {
    const xp =
      type === "text"
        ? info.textXP
        : type === "voice"
        ? info.voiceXP
        : info.textXP + info.voiceXP;

    return { id, xp, level: info.level };
  });

  arr.sort((a, b) => b.xp - a.xp);
  return arr.slice(0, limit);
} 

module.exports = { addXP, getUserXP, getTop };
