/**
 * Laxmi | AstralyxPvP Assistant — Gateway
 * Reads ALL messages and forwards to Laxmi Worker for moderation
 * Deploy on Render as Web Service
 *
 * Required .env:
 *   DISCORD_TOKEN   = Laxmi bot token
 *   WORKER_URL      = https://laxmi.indiancoder3.workers.dev/
 *   GATEWAY_SECRET  = shared secret
 *   RENDER_URL      = https://your-laxmi-app.onrender.com
 */

import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';
import http from 'http';
import 'dotenv/config';

const DISCORD_TOKEN  = process.env.DISCORD_TOKEN;
const WORKER_URL     = process.env.WORKER_URL;
const GATEWAY_SECRET = process.env.GATEWAY_SECRET;
const RENDER_URL     = process.env.RENDER_URL;
const PORT           = process.env.PORT || 3001;

// Channels to ignore (voice-related, staff private etc)
const IGNORED_CHANNELS = [
  '1477025238784151554', // add any channel IDs to skip
];

if (!DISCORD_TOKEN || !WORKER_URL || !GATEWAY_SECRET) {
  console.error('❌ Missing required env vars!');
  process.exit(1);
}

// Keep Render alive
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Laxmi is watching 👀');
});
server.listen(PORT, () => console.log(`🌐 HTTP alive on port ${PORT}`));

if (RENDER_URL) {
  setInterval(async () => {
    try {
      await fetch(RENDER_URL);
      console.log('📡 Self-ping sent');
    } catch (e) {
      console.warn('⚠️ Self-ping failed:', e.message);
    }
  }, 10 * 60 * 1000);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Laxmi online — ${client.user.tag}`);
  console.log(`👀 Watching all messages for moderation`);
});

client.on('messageCreate', async (message) => {
  // Ignore bots
  if (message.author.bot) return;
  // Ignore specific channels
  if (IGNORED_CHANNELS.includes(message.channel.id)) return;
  // Ignore empty messages
  if (!message.content || message.content.trim().length === 0) return;

  try {
    await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_SECRET}`
      },
      body: JSON.stringify({
        content: message.content,
        channelId: message.channel.id,
        messageId: message.id,
        userId: message.author.id,
        username: message.member?.displayName || message.author.username
      })
    });
  } catch (e) {
    console.error('❌ Failed to reach Worker:', e.message);
  }
});

client.login(DISCORD_TOKEN);
