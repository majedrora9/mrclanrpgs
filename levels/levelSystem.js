const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'data.json');

function load() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}
function save(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getUser(data, guildId, userId) {
  data[guildId] ??= {};
  data[guildId][userId] ??= {
    textXP: 0,
    voiceXP: 0,
    textLevel: 0,
    voiceLevel: 0,
  };
  return data[guildId][userId];
}

function calcLevel(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

module.exports = { load, save, getUser, calcLevel };
