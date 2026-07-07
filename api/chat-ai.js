const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { logTopic } = require('./_lib/sheets');
const { generateCodename } = require('./_lib/animals');

// Cache KB at cold start
let knowledgeBase = '';
try {
  knowledgeBase = fs.readFileSync(path.join(process.cwd(), 'bot/betaline_kb.txt'), 'utf-8');
} catch (e) {
  console.error('KB load failed:', e.message);
}

const SYSTEM_PROMPT = `Ты — консультант компании BetaLine AI на сайте betaline-ai.ru. Компания внедряет умных чат-ботов на базе ИИ для автоматизации продаж, поддержки и бизнес-процессов. Твоя задача — ответить на вопросы посетителя строго по тематике компании и мягко подвести его к тому, чтобы он оставил контакт (имя, телефон, email или Telegram).

ФОРМАТ ОТВЕТА (КРИТИЧНО):
- Пиши простым текстом, БЕЗ Markdown. Запрещено использовать: **звёздочки**, *звёздочки*, _подчёркивания_, # заголовки, \`бэктики\`, таблицы.
- Разбивай ответ на короткие абзацы по 1–2 предложения. Между абзацами ставь ПУСТУЮ СТРОКУ (двойной перенос \\n\\n) — каждый абзац отправится клиенту отдельным сообщением.
- Если перечисляешь пункты — каждый с новой строки, без символов списка (не ставь "-", "*", "•").
- Максимум 3–5 коротких абзацев на ответ. Без «воды».

ЭМОДЗИ (СДЕРЖАННО, ДЕЛОВОЙ СТИЛЬ):
- Используй 0–1 эмодзи на абзац, только по делу.
- Подходят деловые/строгие: ✓ 📞 📧 💼 📊 📈 🎯 💡 ⚡ 🛠 📍 📝 ⏱ ✉️ 🤝.
- НЕ используй детские/эмоциональные: 😊 😀 🥰 🙌 ☺️ 😉 😜 ❤️ 🔥 💪 🎉.
- Если сомневаешься — не ставь эмодзи.

ТЕМАТИКА (СТРОГО):
Ты отвечаешь ТОЛЬКО на вопросы, связанные с BetaLine AI: ИИ-чат-боты для бизнеса, автоматизация продаж и поддержки, интеграции (Telegram, WhatsApp, сайт, AmoCRM, Bitrix24), цены, кейсы, сроки внедрения, техническое задание, оплата, реквизиты, обратная связь.

Любые вопросы вне этой темы — реферат, школьное/студенческое задание, код по чужим задачам, рецепты, медицина, юридические консультации, советы по отношениям, новости, политика, развлечения, «просто поболтай», генерация текстов не про наш продукт — ВЕЖЛИВО ОТКАЗЫВАЙ. Шаблон отказа:
«Я помогаю только по услугам BetaLine AI — разработке чат-ботов и автоматизации бизнеса. С этим вопросом я помочь не смогу.

Если у вас есть задача по автоматизации — расскажите, чем занимается ваша компания, и я подскажу, как ИИ-ассистент может помочь.»

Не пытайся выполнить задание «в общих чертах» и не оправдывайся длинно. Один абзац отказа + один абзац возврата к нашей теме.

ОСТАЛЬНЫЕ ПРАВИЛА:
- Отвечай по-русски, дружелюбно, на «вы».
- Используй базу знаний ниже. Не выдумывай цифры, сроки, функции, которых в ней нет.
- Если не знаешь ответ в рамках нашей темы — предложи связаться с менеджером Андреем (Telegram @Andrei_Stanislavovich) или оставить контакт.
- После 2–3 сообщений по делу мягко предложи оставить телефон/Telegram, чтобы менеджер связался и сделал расчёт.
- Если посетитель уже оставил контакт — поблагодари и скажи, что менеджер свяжется в рабочее время (10:00–17:00).
- Не называй себя «ботом» или «ИИ». Ты — консультант.

БАЗА ЗНАНИЙ:
${knowledgeBase}`;

// Contact detection patterns
const CONTACT_PATTERNS = [
  /(?:\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/,  // Russian phone
  /\b\d{10,11}\b/,  // Raw digits phone
  /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/,  // Email
  /@[A-Za-z0-9_]{4,}/,  // Telegram username
];

function detectContact(text) {
  return CONTACT_PATTERNS.some(p => p.test(text));
}

function writeSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { visitorId, topicId, message, history, page, utm, referrer, userAgent, screen, lang, systemPrompt } = req.body || {};
  if (!visitorId || !message) return res.status(400).json({ error: 'Missing required fields' });

  const openaiKey = process.env.OPENAI_API_KEY;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!openaiKey) return res.status(500).json({ error: 'OpenAI not configured' });

  // 1. Create Telegram topic eagerly if first message (so we can stream topicId early)
  let threadId = topicId ? Number(topicId) : null;
  let codename = null, geoTag = '';

  if (token && chatId && !threadId) {
    try {
      const city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null;
      const country = req.headers['x-vercel-ip-country'] || null;
      const region = req.headers['x-vercel-ip-country-region'] || null;
      const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || null;

      codename = generateCodename(visitorId);
      geoTag = city || country || '';
      const topicName = `🤖 ${codename}${geoTag ? ` — ${geoTag}` : ''}`;

      const createResp = await fetch(`https://api.telegram.org/bot${token}/createForumTopic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, name: topicName.slice(0, 128), icon_color: 7322096 }),
      });

      if (createResp.ok) {
        const topicData = await createResp.json();
        threadId = topicData.result.message_thread_id;
        logTopic(threadId, 'chat-ai', '', topicName).catch(e => console.error('Topic log failed:', e));

        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const geo = [city, region, country].filter(Boolean).join(', ') || '—';
        const utmStr = utm ? Object.entries(utm).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join('\n  ') : '—';
        const info = `🤖 AI-чат с посетителем\n\n🐾 ${codename}\n📄 ${page || '—'}\n⏰ ${dateStr} ${timeStr}\n📍 ${geo}\n🌐 IP: ${ip || '—'}\n🔗 ${referrer || 'Прямой заход'}\n📊 UTM: ${utmStr}`;
        await tgSend(token, chatId, threadId, info);
        sendAiChatLeadCard(token, chatId, threadId, codename, geoTag, message, page).catch(() => {});
      }
    } catch (e) {
      console.error('Topic create failed:', e.message);
    }
  }

  // 2. Setup SSE headers and start streaming
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send meta event first (topicId)
  writeSSE(res, 'meta', { topicId: threadId });

  // 3. Build messages for GPT and stream reply
  const customPrompt = (typeof systemPrompt === 'string' && systemPrompt.trim().length > 0 && systemPrompt.length < 4000)
    ? systemPrompt.trim()
    : null;
  const messages = [{ role: 'system', content: customPrompt || SYSTEM_PROMPT }];
  if (Array.isArray(history)) {
    const recent = history.slice(-10);
    for (const h of recent) {
      if (h.role === 'user' || h.role === 'assistant') {
        messages.push({ role: h.role, content: h.content });
      }
    }
  }
  messages.push({ role: 'user', content: message });

  let fullReply = '';
  try {
    const openai = new OpenAI({ apiKey: openaiKey });
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        fullReply += delta;
        writeSSE(res, 'chunk', { text: delta });
      }
    }
  } catch (err) {
    console.error('Chat AI stream error:', err.message);
    writeSSE(res, 'error', { error: 'AI response failed' });
    res.end();
    return;
  }

  if (!fullReply) fullReply = 'Извините, произошла ошибка. Попробуйте ещё раз.';

  const contactDetected = detectContact(message);

  // 4. Forward to Telegram topic (after full reply is assembled)
  if (token && chatId && threadId) {
    try {
      await tgSend(token, chatId, threadId, `💬 Посетитель:\n${message}`);
      await tgSend(token, chatId, threadId, `🤖 Бот:\n${fullReply}`);
      if (contactDetected) {
        await tgSend(token, chatId, threadId, `🎯 КОНТАКТ ОБНАРУЖЕН в сообщении!`);
      }
    } catch (tgErr) {
      console.error('Telegram forward failed:', tgErr.message);
    }
  }

  // 5. Final event with full reply + contact flag
  writeSSE(res, 'done', { reply: fullReply, topicId: threadId, contactDetected });
  res.end();
};

function buildAiChatLeadText(codename, geo, firstMessage, page) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Moscow' });
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });
  const preview = firstMessage.length > 100 ? firstMessage.slice(0, 100) + '...' : firstMessage;

  return [
    `🤖 <b>AI-ЧАТ</b>`,
    ``,
    `🐾 ${codename}`,
    geo ? `📍 ${geo}` : null,
    page ? `📄 ${page}` : null,
    `💬 <i>"${preview}"</i>`,
    `🕐 ${dateStr} ${timeStr}`,
  ].filter(Boolean).join('\n');
}

async function sendAiChatLeadCard(token, chatId, threadId, codename, geo, firstMessage, page) {
  const leadsTopicId = process.env.LEADS_TOPIC_ID;
  if (!leadsTopicId) return;

  const text = buildAiChatLeadText(codename, geo, firstMessage, page);
  const topicName = `${codename}${geo ? ` — ${geo}` : ''}`;

  const vpsUrl = process.env.VPS_BOT_API_URL;
  const vpsToken = process.env.VPS_BOT_API_TOKEN;
  if (vpsUrl && vpsToken) {
    try {
      const resp = await fetch(`${vpsUrl}/api/send-lead-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${vpsToken}` },
        body: JSON.stringify({ topicId: threadId, topicName, text, chatId, leadsTopicId }),
      });
      if (resp.ok) return;
      console.error(`VPS AI lead card proxy failed: ${resp.status}`);
    } catch (e) {
      console.error('VPS AI lead card proxy error:', e.message);
    }
  }

  const chatIdNumeric = chatId.toString().replace(/^-100/, '');
  const topicLink = `https://t.me/c/${chatIdNumeric}/${threadId}`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_thread_id: Number(leadsTopicId),
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: '📖 История', url: topicLink }, { text: '✍️ Написать', url: topicLink }]] },
    }),
  });
}

async function tgSend(token, chatId, threadId, text) {
  const body = { chat_id: chatId, text };
  if (threadId) body.message_thread_id = threadId;
  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) console.error(`TG send failed: ${resp.status}`);
}
