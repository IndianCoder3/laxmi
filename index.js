/**
 * Laxmi | AstralyxPvP Assistant
 * Smart Automod + Welcome Bot — Cloudflare Worker
 * Built by IndianCoder3
 */

import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';

// ============================================
// CONSTANTS
// ============================================
const WELCOME_CHANNEL_ID = '1477033060078850264';
const LAXMI_WELCOMER_CHANNEL_ID = '1529028842188967977';

const NOTIFICATION_ROLES = [
  { label: '📣 Announcements', roleId: '1483166577259188406' },
  { label: '🎉 Giveaways', roleId: '1483166679499407582' },
  { label: '🏆 Tournaments', roleId: '1500206420627427539' },
  { label: '📊 Polls', roleId: '1500206496535937195' },
];

const MOD_ROLES = [
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

const LINK_EXEMPT_ROLES = [...MOD_ROLES];
const WARN_EXEMPT_ROLES = [...MOD_ROLES];

const DEFAULT_IGNORED_CHANNELS = [
  '1477033205017346259', // announcements
  '1477033060078850264', // welcome
  '1477033071076442165', // rules
  '1499020216821088296', // information
  '1477035122636095561', // events
  '1477035141221060791', // giveaways
  '1477035158770155743', // tournaments
  '1477272501699481642', // qotd
  '1529028842188967977', // laxmi-welcomer
];

// ============================================
// OFFENSIVE WORD LIST — Enhanced
// ============================================
const BANNED_WORDS = [
  // English — direct + bypasses
  'fuck', 'f**k', 'fck', 'fuk', 'fucc', 'fvck', 'frick', 'fricking', 'frickin', 'frik',
  'fudge', 'effing', 'effin', 'af',
  'shit', 'sh1t', 'sht', 'shiit', 'shyt', 'shite',
  'bitch', 'b1tch', 'btch', 'biatch', 'biotch',
  'ass', 'a55', 'a**', '@ss', 'arse', 'azzhole', 'asshole', 'a**hole', 'a55hole',
  'bastard', 'b@stard', 'bastad',
  'damn', 'dammit', 'damm', 'damnit',
  'crap', 'crapping',
  'sex', 's3x', 'sexx', 'seks',
  'sexy', 's3xy',
  'porn', 'p0rn', 'pr0n',
  'nude', 'nudes', 'naked',
  'dick', 'd1ck', 'dik', 'd**k',
  'cock', 'c0ck', 'c**k',
  'pussy', 'puss1', 'pu**y',
  'boob', 'boobs', 'b00b', 'tit', 'tits',
  'nigga', 'nigger', 'n1gga', 'n1gger', 'n**ga', 'n**ger',
  'retard', 'r3tard', 'tard',
  'whore', 'wh0re', 'w**re',
  'slut', 'sl*t', 'sl**',
  'kill yourself', 'kys', 'k.y.s', 'end yourself',
  'rape', 'r@pe', 'raped',
  'cunt', 'c*nt', 'c**t',
  'prick', 'pr1ck',
  'twat', 'tw@t',
  'wanker', 'w@nker',
  'bollocks', 'bullshit', 'bulls**t', 'bs',
  'jackass', 'dumbass', 'dumb@ss', 'dumba**',
  'moron', 'idiot', 'imbecile',
  'stfu', 'gtfo', 'wtaf',
  'milf', 'dilf',
  'horny', 'h0rny',
  'masturbat', 'masterbat',
  'orgasm',
  // Scam patterns
  'free robux', 'free vbucks', 'free nitro',
  'claim your prize', 'you have been selected',
  'withdraw', 'withdrawal success',
  'crypto bonus', 'activate code',
  'rakeback', 'deposit bonus',
  'dm me for', 'dm for free',
  'bit.ly', 'tinyurl.com', 't.co/',
  // Hindi / Hinglish — expanded
  'madarchod', 'mc', 'maderchod', 'maa ki', 'maaki', 'madar',
  'behenchod', 'bc', 'behen chod', 'behnchod', 'behen ke',
  'chutiya', 'chutiye', 'chut', 'choot', 'chudai', 'chodu', 'chodna',
  'bhosdike', 'bhosd', 'bhosdi', 'bhosdiwale', 'bhosad',
  'gandu', 'gaandu', 'g@ndu', 'gand', 'gaand',
  'harami', 'haraami', 'haraamzada', 'haraamkhor',
  'randi', 'r@ndi', 'raand', 'randwa',
  'saala', 'sala', 'saale', 'saali',
  'teri maa', 'teri ma', 'teri maa ki', 'apni maa',
  'bsdk', 'lodu', 'lund', 'lauda', 'lavda', 'lund',
  'chakka', 'hijra',
  'kutte', 'kutta', 'kutiya', 'kutti',
  'kamina', 'kamine', 'kamini', 'kaminey',
  'ullu', 'ullu ka pattha', 'ullu ke patthe',
  'gadha', 'gadhe', 'gadhon',
  'bhadwa', 'bhadwe',
  'tharki', 'tharkhi',
  'beti chod', 'betichod',
  'balatkar', 'balaatkari',
  'chaman chutiya', 'chamanchutiya',
  'jhaat', 'jhaant',
  'launde', 'launda',
  'randi rona', 'randirona',
  'chup kar', 'chup ho ja',
  'nikl', 'nikal ja', 'bhag ja',
  'tatti', 'tatty',
  'pesab', 'peshab',
  // Advertising
  'discord.gg/', 'dsc.gg/', 'discordapp.com/invite',
  'join my server', 'join our server', 'join my disc',
  // Staff impersonation
  'i am admin', 'i am mod', 'i am staff', "i'm admin", "i'm mod", "i'm staff",
  'im admin', 'im mod', 'im staff',
];

const AD_PATTERN = /discord\.gg\/[a-zA-Z0-9]+|dsc\.gg\/[a-zA-Z0-9]+|discordapp\.com\/invite\/[a-zA-Z0-9]+/i;
const CRYPTO_SCAM_PATTERN = /\b(free\s*(nitro|robux|vbucks|crypto|bitcoin|eth)|withdrawal\s*success|claim\s*(your\s*)?(prize|reward|bonus)|activate\s*code|dm\s*(me\s*)?(for\s*)?(free|money|profit))\b/i;

const recentMessages = new Map();

// ============================================
// HELPERS
// ============================================
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getIgnoredChannels(env) {
  try {
    const stored = await env.LAXMI_KV.get('ignored_channels');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return [...DEFAULT_IGNORED_CHANNELS];
}

async function setIgnoredChannels(channels, env) {
  await env.LAXMI_KV.put('ignored_channels', JSON.stringify(channels));
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Leetspeak
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/\$/g, 's')
    .replace(/@/g, 'a').replace(/\+/g, 't').replace(/8/g, 'b')
    .replace(/!/g, 'i').replace(/\|/g, 'i').replace(/7/g, 't')
    // Remove zero-width and invisible chars
    .replace(/[\u200b\u200c\u200d\u2060\ufeff\u00ad]/g, '')
    // Collapse spaces
    .replace(/\s+/g, ' ').trim();
}

function layer1Check(text) {
  const normalized = normalizeText(text);
  // Check with spaces removed (catches f u c k style)
  const noSpaces = normalized.replace(/\s/g, '');
  // Check with dots/dashes removed (catches f.u.c.k style)  
  const noPunct = normalized.replace(/[^a-z0-9]/g, '');

  for (const word of BANNED_WORDS) {
    const nw = normalizeText(word).replace(/\s/g, '');
    const nwNoPunct = normalizeText(word).replace(/[^a-z0-9]/g, '');
    if (
      noSpaces.includes(nw) ||
      noPunct.includes(nwNoPunct) ||
      normalized.includes(normalizeText(word))
    ) {
      return { flagged: true, reason: `Banned word detected`, confidence: 'high' };
    }
  }

  if (AD_PATTERN.test(text)) {
    return { flagged: true, reason: 'Discord server advertising', confidence: 'high' };
  }

  if (CRYPTO_SCAM_PATTERN.test(text)) {
    return { flagged: true, reason: 'Potential scam/spam detected', confidence: 'high' };
  }

  return { flagged: false };
}

function raidCheck(channelId, content, userId) {
  const now = Date.now();
  const window = 10000;
  const threshold = 4;
  if (!recentMessages.has(channelId)) recentMessages.set(channelId, []);
  const msgs = recentMessages.get(channelId).filter(m => now - m.timestamp < window && m.content === content);
  msgs.push({ content, userId, timestamp: now });
  recentMessages.set(channelId, msgs);
  if (msgs.length >= threshold && new Set(msgs.map(m => m.userId)).size >= 3) {
    return { flagged: true, reason: 'Possible raid — identical messages from multiple users', confidence: 'high' };
  }
  return { flagged: false };
}

// ============================================
// IMAGE SCANNING via Gemini Vision
// ============================================
async function scanImage(imageUrl, env) {
  try {
    const model = env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';

    // Fetch image and convert to base64
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
    if (!imgRes.ok) return { flagged: false };
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return { flagged: false };

    const imgBuffer = await imgRes.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: contentType,
                data: base64
              }
            },
            {
              text: `You are a Discord image moderation AI for a Minecraft PvP server for teens/kids.

Analyze this image and determine if it contains:
1. NSFW/sexual/nude content
2. Crypto/gambling/withdrawal scams (fake MrBeast giveaways, fake withdrawal success screens, casino/betting sites, fake prize claims)
3. Hate symbols or extreme violence
4. Phishing or malicious links

Respond ONLY with JSON (no markdown): {"flagged": true/false, "reason": "short reason or null", "confidence": "high/medium/low"}

Only flag genuine violations. Gaming screenshots, memes, and normal images are fine.`
            }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
      })
    });

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (e) {
    return { flagged: false };
  }
}

// ============================================
// LAYER 2 — Gemini AI text classification
// ============================================
async function layer2AICheck(text, env) {
  try {
    const model = env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `You are a Discord moderation classifier for an Indian Minecraft PvP server for teens.\n\nAnalyze this message for: hate speech, extreme toxicity, advertising, staff impersonation, NSFW content, scams, crypto/gambling promotion.\n\nMessage: "${text}"\n\nRespond ONLY with JSON (no markdown): {"flagged": true/false, "reason": "short reason or null", "confidence": "high/medium/low"}\n\nOnly flag genuine violations. Mild frustration, gaming talk, and casual chat are NOT violations.` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
      })
    });
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (e) { return { flagged: false }; }
}

// ============================================
// DISCORD ACTIONS
// ============================================
async function deleteMessage(channelId, messageId, env) {
  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bot ${env.DISCORD_TOKEN}` }
  });
}

async function warnUser(channelId, userId, reason, env) {
  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bot ${env.DISCORD_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `?warn <@${userId}> ${reason}` })
  });
}

async function sendLog(env, logEntry) {
  if (!env.LOG_CHANNEL_ID) return;
  await fetch(`https://discord.com/api/v10/channels/${env.LOG_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bot ${env.DISCORD_TOKEN}`, 'Content-Type': 'application/json' },
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
          { name: 'Message', value: '```' + (logEntry.message || '[image]').substring(0, 500) + '```', inline: false }
        ],
        timestamp: new Date().toISOString()
      }]
    })
  });
}

async function sendDiscordMessage(channelId, payload, env) {
  return fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bot ${env.DISCORD_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// ============================================
// WELCOME MESSAGE
// ============================================
async function handleMemberJoin(userId, username, env) {
  await sendDiscordMessage(LAXMI_WELCOMER_CHANNEL_ID, {
    content: `<@${userId}>`,
    embeds: [{
      title: '🙏 Welcome to AstralyxPvP!',
      description: `Namaste <@${userId}>! Welcome to **AstralyxPvP** — India's premier Minecraft Java PvP server!\n\n⚔️ **Server IP:** \`java.astralyxpvp.int.yt\`\n🌐 **Website:** [astralyxpvp.pages.dev](https://astralyxpvp.pages.dev)\n\nHead over to <#1477033060078850264> to get started, check <#1477033071076442165> for the rules, and pick up your notification roles below!\n\nSee you on the battlefield! 🔥`,
      color: 0xC8102E,
      footer: { text: `Welcome, ${username}! • AstralyxPvP` },
      timestamp: new Date().toISOString()
    }]
  }, env);
}

// ============================================
// ROLE SELECTOR
// ============================================
async function handleWelcomeReactionOptions(env) {
  await sendDiscordMessage(WELCOME_CHANNEL_ID, {
    embeds: [{
      title: '🔔 Get Notified — Pick Your Roles!',
      description: 'Stay updated with what matters to you! Click the buttons below to assign yourself notification roles.\n\nClick again to remove a role anytime.',
      color: 0xC8102E,
      fields: NOTIFICATION_ROLES.map(r => ({
        name: r.label,
        value: `<@&${r.roleId}>`,
        inline: true
      })),
      footer: { text: 'AstralyxPvP • Role Selector' }
    }],
    components: [{
      type: 1,
      components: NOTIFICATION_ROLES.map(r => ({
        type: 2,
        style: 2,
        label: r.label,
        custom_id: `role_toggle_${r.roleId}`
      }))
    }]
  }, env);
}

// ============================================
// ROLE BUTTON CLICK
// ============================================
async function handleRoleToggle(interaction, roleId, env) {
  const userId = interaction.member.user.id;
  const guildId = interaction.guild_id;
  const memberRoles = interaction.member.roles || [];
  const hasRole = memberRoles.includes(roleId);

  const method = hasRole ? 'DELETE' : 'PUT';
  await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method,
    headers: { 'Authorization': `Bot ${env.DISCORD_TOKEN}` }
  });

  const role = NOTIFICATION_ROLES.find(r => r.roleId === roleId);
  return jsonResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: hasRole
        ? `✅ Removed **${role?.label}** role!`
        : `✅ Added **${role?.label}** role! You'll now get notified.`,
      flags: 64
    }
  });
}

// ============================================
// SLASH COMMANDS
// ============================================
async function handleSlashCommand(interaction, env) {
  const commandName = interaction.data.name;
  const memberRoles = interaction.member?.roles || [];
  const isStaff = memberRoles.some(r => MOD_ROLES.includes(r));

  if (!isStaff) {
    return jsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: '❌ You do not have permission to use this command.', flags: 64 }
    });
  }

  if (commandName === 'welcome-role-options') {
    await handleWelcomeReactionOptions(env);
    return jsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: '✅ Role selector posted in welcome channel!', flags: 64 }
    });
  }

  if (commandName === 'ignore-add') {
    const channelId = interaction.data.options?.[0]?.value;
    const channels = await getIgnoredChannels(env);
    if (channels.includes(channelId)) {
      return jsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `⚠️ <#${channelId}> is already ignored.`, flags: 64 }
      });
    }
    channels.push(channelId);
    await setIgnoredChannels(channels, env);
    return jsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `✅ Added <#${channelId}> to ignored channels.`, flags: 64 }
    });
  }

  if (commandName === 'ignore-remove') {
    const channelId = interaction.data.options?.[0]?.value;
    let channels = await getIgnoredChannels(env);
    if (!channels.includes(channelId)) {
      return jsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `⚠️ <#${channelId}> is not in the ignore list.`, flags: 64 }
      });
    }
    channels = channels.filter(c => c !== channelId);
    await setIgnoredChannels(channels, env);
    return jsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `✅ Removed <#${channelId}> from ignored channels.`, flags: 64 }
    });
  }

  return jsonResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: '❓ Unknown command.', flags: 64 }
  });
}

// ============================================
// MAIN AUTOMOD HANDLER
// ============================================
async function handleMessage(payload, env) {
  const { content, channelId, messageId, userId, username, roleIds = [], attachments = [] } = payload;

  const ignoredChannels = await getIgnoredChannels(env);
  if (ignoredChannels.includes(channelId)) return;

  const isLinkExempt = roleIds.some(r => LINK_EXEMPT_ROLES.includes(r));
  const isWarnExempt = roleIds.some(r => WARN_EXEMPT_ROLES.includes(r));

  // ---- TEXT CHECKS ----
  if (content && content.trim().length > 0) {
    const l1 = layer1Check(content);
    if (l1.flagged) {
      if (isLinkExempt && (l1.reason.includes('advertising') || l1.reason.includes('scam'))) return;
      await deleteMessage(channelId, messageId, env);
      const action = isWarnExempt ? 'Delete' : 'Delete + Warn';
      if (!isWarnExempt) await warnUser(channelId, userId, l1.reason, env);
      await sendLog(env, { userId, username, channelId, action, reason: l1.reason, layer: 'Layer 1 (Regex)', confidence: l1.confidence, message: content });
      return;
    }

    const raid = raidCheck(channelId, content, userId);
    if (raid.flagged) {
      await deleteMessage(channelId, messageId, env);
      await sendLog(env, { userId, username, channelId, action: 'Delete', reason: raid.reason, layer: 'Raid Detection', confidence: raid.confidence, message: content });
      return;
    }

    const l2 = await layer2AICheck(content, env);
    if (l2.flagged && (l2.confidence === 'high' || l2.confidence === 'medium')) {
      if (isLinkExempt && l2.reason?.toLowerCase().includes('advert')) return;
      await deleteMessage(channelId, messageId, env);
      const shouldWarn = !isWarnExempt && l2.confidence === 'high';
      if (shouldWarn) await warnUser(channelId, userId, l2.reason, env);
      await sendLog(env, { userId, username, channelId, action: shouldWarn ? 'Delete + Warn' : 'Delete', reason: l2.reason, layer: 'Layer 2 (AI)', confidence: l2.confidence, message: content });
      return;
    }
  }

  // ---- IMAGE CHECKS ----
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if (!attachment.url) continue;
      const contentType = attachment.content_type || '';
      if (!contentType.startsWith('image/')) continue;

      const imgResult = await scanImage(attachment.url, env);
      if (imgResult.flagged && (imgResult.confidence === 'high' || imgResult.confidence === 'medium')) {
        await deleteMessage(channelId, messageId, env);
        const shouldWarn = !isWarnExempt && imgResult.confidence === 'high';
        if (shouldWarn) await warnUser(channelId, userId, imgResult.reason || 'Inappropriate image', env);
        await sendLog(env, { userId, username, channelId, action: shouldWarn ? 'Delete + Warn' : 'Delete', reason: imgResult.reason || 'Inappropriate image', layer: 'Image Scan (Gemini Vision)', confidence: imgResult.confidence, message: `[Image: ${attachment.filename || 'unknown'}]` });
        return;
      }
    }
  }
}

// ============================================
// CLOUDFLARE WORKER ENTRY
// ============================================
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'GET') {
      return new Response('Laxmi | AstralyxPvP Assistant is online 🙏', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const authHeader = request.headers.get('authorization');

    // Discord interactions (slash commands + buttons)
    if (request.headers.get('x-signature-ed25519')) {
      const signature = request.headers.get('x-signature-ed25519');
      const timestamp = request.headers.get('x-signature-timestamp');
      const body = await request.text();

      const isValid = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
      if (!isValid) return new Response('Unauthorized', { status: 401 });

      const interaction = JSON.parse(body);

      if (interaction.type === InteractionType.PING) {
        return jsonResponse({ type: InteractionResponseType.PONG });
      }

      if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        return await handleSlashCommand(interaction, env);
      }

      if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
        const customId = interaction.data.custom_id;
        if (customId.startsWith('role_toggle_')) {
          const roleId = customId.replace('role_toggle_', '');
          return await handleRoleToggle(interaction, roleId, env);
        }
      }

      return jsonResponse({ type: InteractionResponseType.PONG });
    }

    // Gateway forwarding
    if (!authHeader || authHeader !== `Bearer ${env.GATEWAY_SECRET}`) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const payload = await request.json();

    if (payload.type === 'member_join') {
      ctx.waitUntil(handleMemberJoin(payload.userId, payload.username, env));
      return jsonResponse({ ok: true });
    }

    ctx.waitUntil(handleMessage(payload, env));
    return jsonResponse({ ok: true });
  }
};
