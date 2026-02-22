
import { v4 as uuidv4 } from 'uuid';

// Using localStorage for bot persistence in dev environment
const BOTS_KEY = 'echonote_bots';

const getBots = () => {
  const data = localStorage.getItem(BOTS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveBots = (bots) => {
  localStorage.setItem(BOTS_KEY, JSON.stringify(bots));
};

export const generateBotToken = async (workspaceId) => {
  return `bot_token_${uuidv4()}`;
};

export const registerBotInstance = async (botId, meetingId, platform) => {
  const bots = getBots();
  const newBot = {
    id: botId || uuidv4(),
    meeting_id: meetingId,
    platform,
    status: 'active',
    joined_at: new Date().toISOString(),
    logs: []
  };
  bots.push(newBot);
  saveBots(bots);
  return newBot;
};

export const logBotActivity = async (botId, action, details) => {
  const bots = getBots();
  const botIndex = bots.findIndex(b => b.id === botId);
  if (botIndex === -1) return;
  
  bots[botIndex].logs.push({
    action,
    details,
    timestamp: new Date().toISOString()
  });
  saveBots(bots);
};

export const getBotStatus = async (botId) => {
  const bots = getBots();
  const bot = bots.find(b => b.id === botId);
  return bot ? bot.status : 'unknown';
};

export const removeBotFromMeeting = async (botId, meetingId) => {
  const bots = getBots();
  const botIndex = bots.findIndex(b => b.id === botId);
  if (botIndex === -1) return;
  
  bots[botIndex].status = 'disconnected';
  bots[botIndex].disconnected_at = new Date().toISOString();
  saveBots(bots);
  return true;
};
