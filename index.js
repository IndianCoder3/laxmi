/**
 * Laxmi | AstralyxPvP Assistant
 * Smart Automod Bot — Cloudflare Worker
 * Built by IndianCoder3
 * 
 * Actions: Delete message, Warn user via Dyno /warn command
 * Layers: Regex + Unicode normalization → AI (Gemini) classification
 */



// ============================================
// OFFENSIVE WORD LIST (English + Hindi + Hinglish)
// ============================================
const BANNED_WORDS = [
  // English
  'fuck', 'f**k', 'fck', 'fuk', 'fucc', 'fvck',
  'shit', 'sh1t', 'sht',
  'bitch', 'b1tch', 'btch',
  'asshole', 'a**hole', 'a55hole',
  'bastard', 'b@stard',
  'damn', 'crap', 'dick', 'd1ck', 'cock', 'pussy',
  'nigga', 'nigger', 'n1gga',
  'retard', 'r3tard',
  'whore', 'slut',
  'kill yourself', 'kys', 'k.y.s',
  'rape', 'r@pe',
  // Hindi / Hinglish
  'madarchod', 'mc', 'maderchod',
  'behenchod', 'bc', 'behen chod',
  'chutiya', 'chutiye', 'chut',
  'bhosdike', 'bhosd', 'bhosdi',
  'gandu', 'gaandu', 'g@ndu',
  'harami', 'haraami',
  'randi', 'r@ndi',
  'saala', 'sala',
  'teri maa', 'teri ma',
  'bsdk', 'lodu', 'lund', 'lauda',
  'chakka', 'hijra',
  'kutte', 'kutta',
  'kamina', 'kamine',
  // Advertising patterns
  'discord.gg/', 'dsc.gg/', 'discordapp.com/invite',
  'join my server', 'join our server',
  // Staff impersonation
  'i am admin', 'i am mod', 'i am staff', 'i\'m admin', 'i\'m mod',
];

// Advertising URL pattern
const AD_PATTERN = /discord\.gg\/[a-zA-Z0-9]+|dsc\.gg\/[a-zA-Z0-9]+|discordapp\.com\/invite\/[a-zA-Z0-9]+/i;

// Raid pattern — detect repeated identical messages (tracked in memory)
const recentMessages = new Map(); // channelId -> [{ content, userId, timestamp }]

// ============================================
// NORMALIZE TEXT — catches leetspeak, unicode, spaces
// ============================================
function normalizeText(text) {
  return text
    .toLowerCase()
    // Unicode/accented char normalization
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Leetspeak
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
    .replace(/\+/g, 't')
    .replace(/8/g, 'b')
    // Remove zero-width chars and extra spaces
    .replace(/[\u200b\u200c\u200d\u2060\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================
// LAYER 1 — Regex + word list check
// ============================================
function layer1Check(text) {
  const normalized = normalizeText(text);
  // Remove spaces between letters to catch "f u c k" style bypasses
  const noSpaces = normalized.replace(/\s/g, '');

  for (const word of BANNED_WORDS) {
    const normalizedWord = normalizeText(word).replace(/\s/g, '');
    if (noSpaces.includes(normalizedWord) || normalized.includes(normalizeText(word))) {
      return { flagged: true, reason: `Banned word detected: "${word}"`, confidence: 'high' };
    }
  }

  if (AD_PATTERN.test(text)) {
    return { flagged: true, reason: 'Discord server advertising detected', confidence: 'high' };
  }

  return { flagged: false };
}

// ============================================
// RAID DETECTION
// ============================================
function raidCheck(channelId, content, userId) {
  const now = Date.now();
  const window = 10000; // 10 seconds
  const threshold = 4; // 4 identical messages in 10 seconds = raid

  if (!recentMessages.has(channelId)) {
    recentMessages.set(channelId, []);
  }

  const msgs = recentMessages.get(channelId);
  // Clean old messages
  const recent = msgs.filter(m => now - m.timestamp < window && m.content === content);
  recent.push({ content, userId, timestamp: now });
  recentMessages.set(channelId, recent);

  if (recent.length >= threshold) {
    const uniqueUsers = new Set(recent.map(m => m.userId)).size;
    if (uniqueUsers >= 3) {
      return { flagged: true, reason: 'Possible raid detected — identical messages from multiple users', confidence: 'high' };
    }
  }

  return { flagged: false };
}

// ============================================
// LAYER 2 — Gemini AI classification
// ============================================
async function layer2AICheck(text, env) {
  try {
    const model = env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
    const apiKey = env.GOOGLE_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `You are a Discord chat moderation classifier for an Indian Minecraft PvP server called AstralyxPvP.

Analyze this message and determine if it violates any of these rules:
1. Hate speech, extreme toxicity, or severe harassment
2. Subtle advertising or server promotion
3. Staff impersonation
4. Sexual or NSFW content

Message: "${text}"

Respond ONLY with a JSON object, no markdown, no explanation:
{"flagged": true/false, "reason": "short reason or null", "confidence": "high/medium/low"}

Only flag if genuinely violating. Light banter, mild frustration, and casual chat are NOT violations.`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
      })
    });

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    return { flagged: false };
  }
}

// ============================================
// ACTIONS — Delete message + Dyno warn
// ============================================
async function deleteMessage(channelId, messageId, env) {
  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bot ${env.DISCORD_TOKEN}` }
  });
}

async function warnUser(channelId, userId, reason, env) {
  // Trigger Dyno's /warn command via a message in the channel
  // Dyno responds to: /warn @user reason
  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: `?warn <@${userId}> ${reason}`
    })
  });
}

async function sendLog(env, logEntry) {
  if (!env.LOG_CHANNEL_ID) return;
  await fetch(`https://discord.com/api/v10/channels/${env.LOG_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      embeds: [{
        title: '🔨 Laxmi Automod Action',
        color: 0xC8102E,
        fields: [
          { name: 'User', value: `<@${logEntry.userId}> (${logEntry.username})`, inline: true },
          { name: 'Channel', value: `<#${logEntry.channelId}>`, inline: true },
          { name: 'Action', value: logEntry.action, inline: true },
          { name: 'Reason', value: logEntry.reason, inline: false },
          { name: 'Layer', value: logEntry.layer, inline: true },
          { name: 'Confidence', value: logEntry.confidence, inline: true },
          { name: 'Message', value: `\`\`\`${logEntry.message.substring(0, 500)}\`\`\``, inline: false }
        ],
        timestamp: new Date().toISOString()
      }]
    })
  });
}

// ============================================
// IGNORED CHANNELS — bot won't moderate these
// ============================================
const IGNORED_CHANNELS = [
  '1477033205017346259', // announcements
  '1477033060078850264', // welcome
  '1477033071076442165', // rules
  '1499020216821088296', // information
  '1477035122636095561', // events
  '1477035141221060791', // giveaways
  '1477035158770155743', // tournaments
  '1477272501699481642', // qotd
];

// STAFF ROLES — exempt from link/URL moderation only
// Nobody is exempt from swear word deletion
const LINK_EXEMPT_ROLES = [
  '1477025238784151554', // Owner
  '1477291491003994214', // Co-Owner
  '1502815102716608552', // Chief Manager
  '1497335106074050620', // Sr. Manager
  '1483209618485284964', // Manager
  '1497316294632931358', // Developer
  '1497316250945323070', // Admin
  '1497316120452136960', // Sr. Mod
  '1477025502119334109', // Mod
];

// WARN EXEMPT — staff don't get warned, just message deleted
const WARN_EXEMPT_ROLES = [
  '1477025238784151554', // Owner
  '1477291491003994214', // Co-Owner
  '1502815102716608552', // Chief Manager
  '1497335106074050620', // Sr. Manager
  '1483209618485284964', // Manager
  '1497316294632931358', // Developer
  '1497316250945323070', // Admin
  '1497316120452136960', // Sr. Mod
  '1477025502119334109', // Mod
];

// ============================================
// MAIN HANDLER
// ============================================
async function handleMessage(payload, env) {
  const { content, channelId, messageId, userId, username, roleIds = [] } = payload;

  if (!content || content.trim().length === 0) return;

  // Skip ignored channels
  if (IGNORED_CHANNELS.includes(channelId)) return;

  const isLinkExempt = roleIds.some(r => LINK_EXEMPT_ROLES.includes(r));
  const isWarnExempt = roleIds.some(r => WARN_EXEMPT_ROLES.includes(r));

  // Layer 1 — fast regex check
  const l1 = layer1Check(content);
  if (l1.flagged) {
    // Skip if staff posting a link (link exempt)
    if (isLinkExempt && l1.reason.toLowerCase().includes('advertising')) return;
    await deleteMessage(channelId, messageId, env);
    const action = isWarnExempt ? 'Delete' : 'Delete + Warn';
    if (!isWarnExempt) await warnUser(channelId, userId, l1.reason, env);
    await sendLog(env, { userId, username, channelId, action, reason: l1.reason, layer: 'Layer 1 (Regex)', confidence: l1.confidence, message: content });
    return;
  }

  // Raid check
  const raid = raidCheck(channelId, content, userId);
  if (raid.flagged) {
    await deleteMessage(channelId, messageId, env);
    await sendLog(env, { userId, username, channelId, action: 'Delete', reason: raid.reason, layer: 'Raid Detection', confidence: raid.confidence, message: content });
    return;
  }

  // Log all messages from staff for audit trail (no action)
  // Remove this block if too noisy

  // Layer 2 — AI check for borderline messages
  const l2 = await layer2AICheck(content, env);
  if (l2.flagged && (l2.confidence === 'high' || l2.confidence === 'medium')) {
    // Skip if staff posting a link
    if (isLinkExempt && l2.reason && l2.reason.toLowerCase().includes('advert')) return;
    await deleteMessage(channelId, messageId, env);
    const shouldWarn = !isWarnExempt && l2.confidence === 'high';
    if (shouldWarn) await warnUser(channelId, userId, l2.reason, env);
    const action = shouldWarn ? 'Delete + Warn' : 'Delete';
    await sendLog(env, { userId, username, channelId, action, reason: l2.reason, layer: 'Layer 2 (AI)', confidence: l2.confidence, message: content });
  }
}

// ============================================
// CLOUDFLARE WORKER ENTRY
// ============================================
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'GET') {
      return new Response('Laxmi | AstralyxPvP Assistant is online 🙏', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Verify gateway secret
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${env.GATEWAY_SECRET}`) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const payload = await request.json();
    ctx.waitUntil(handleMessage(payload, env));
    return jsonResponse({ ok: true });
  }
};
