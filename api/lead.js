const { appendRow } = require('./_lib/sheets');
const { generatePassword } = require('./_lib/generate-password');
const crypto = require('crypto');

function generateLeadId() {
  return 'L' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
}

module.exports = async function handler(req, res) {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { source, phone, name, niche, task, platform, speed, price, date, time,
          site_url, site_excerpt, bot_name, tone, greeting, widget_color,
          company, result_channel, comment, base } = req.body || {};

  if (!source || !phone) return res.status(400).json({ error: 'Missing required fields' });
  if (!['quiz', 'audit', 'callback', 'pricing', 'url-capture', 'platform', 'voice-landing'].includes(source)) return res.status(400).json({ error: 'Invalid source' });

  const leadId = generateLeadId();
  const contact = { phone, name };
  const botConfig = { site_url, site_excerpt, bot_name, tone, greeting, widget_color };

  // Fan out to all destinations in parallel
  const destinations = [
    sendLeadCard(source, phone, { name, niche, task, platform, speed, price, date, time, company, result_channel, comment, base }, leadId),
    appendLeadSheet(source, phone, { name, niche, task, platform, speed, price, date, time, company, result_channel, comment, base }, leadId),
    sendToCRM(source, phone, { name, niche, task, platform, speed, price, date, time, company, result_channel, comment, base }, leadId),
    sendEmail(source, phone, { name, niche, task, platform, speed, price, date, time, company, result_channel, comment, base }, leadId),
  ];

  // Platform-specific: auto-credentials (Supabase user + Telegram DM)
  let credsResult = null;
  if (source === 'platform') {
    credsResult = await createSupabaseUser(contact, botConfig);
    destinations.push(sendCredentialsViaTelegram(contact, credsResult ? credsResult.password : null));
  }

  const results = await Promise.allSettled(destinations);

  // Log failures
  const labels = source === 'platform'
    ? ['Telegram', 'Sheets', 'CRM', 'Email', 'TelegramDM']
    : ['Telegram', 'Sheets', 'CRM', 'Email'];
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`${labels[i]} failed:`, r.reason);
  });

  // Success if at least one channel delivered
  const anySuccess = results.some(r => r.status === 'fulfilled');
  if (!anySuccess) return res.status(500).json({ error: 'All delivery channels failed' });

  return res.status(200).json({ ok: true, lead_id: leadId });
};

// --- Telegram: lead card to shared "Все лиды" topic ---
async function sendLeadCard(source, phone, fields, leadId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const leadsTopicId = process.env.LEADS_TOPIC_ID;
  if (!token || !chatId) throw new Error('Telegram not configured');

  const sourceLabels = { quiz: 'Квиз', audit: 'Аудит', callback: 'Звонок', pricing: 'Тариф', 'url-capture': 'URL-захват', platform: 'Конструктор', 'voice-landing': 'Голосовой бот' };
  const sourceIcons = { quiz: '🧮', audit: '🎯', callback: '📞', pricing: '💰', 'url-capture': '🌐', platform: '🛠', 'voice-landing': '📞' };
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Moscow' });
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });

  // Build card lines
  const lines = [`━━━━━━━━━━━━━━━━━━`, `${sourceIcons[source] || '🤖'} НОВЫЙ ЛИД — ${sourceLabels[source] || source}`, `━━━━━━━━━━━━━━━━━━`];
  if (fields.name) lines.push(`👤 ${fields.name}`);
  lines.push(`📱 ${phone}`);
  if (fields.company) lines.push(`🏢 Компания: ${fields.company}`);
  if (fields.niche) lines.push(`🏭 Ниша: ${fields.niche}`);
  if (fields.task) lines.push(`🎯 Задача: ${fields.task}`);
  if (fields.base) lines.push(`🗂 База: ${fields.base}`);
  if (fields.result_channel) lines.push(`📥 Канал: ${fields.result_channel}`);
  if (fields.platform) lines.push(`🌐 ${fields.platform}`);
  if (fields.speed) lines.push(`⏱ ${fields.speed}`);
  if (fields.price) lines.push(`💰 ${fields.price}`);
  if (fields.comment) lines.push(`💬 Коммент: ${fields.comment}`);
  if (fields.date || fields.time) lines.push(`📅 ${[fields.date, fields.time].filter(Boolean).join(' ')}`);
  lines.push(`🕐 ${dateStr} ${timeStr}`);
  if (leadId) lines.push(`🆔 ${leadId}`);
  lines.push(`━━━━━━━━━━━━━━━━━━`);

  const body = { chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML' };
  if (leadsTopicId) body.message_thread_id = Number(leadsTopicId);

  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Telegram API ${resp.status}: ${await resp.text()}`);
}

// --- Google Sheets (Лиды tab) ---
async function appendLeadSheet(source, phone, fields, leadId) {
  const dateStr = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  const row = [
    dateStr,                                          // A: Дата
    fields.name || '—',                               // B: Имя
    phone,                                            // C: Контакт
    fields.niche || '',                               // D: Ниша
    fields.task || '',                                // E: Масштаб / Задача
    source,                                           // F: UTM / Источник
    fields.platform || fields.company || '',          // G: Процессы / Площадка / Компания
    fields.speed || fields.result_channel || '',      // H: ПО / Сроки / Канал результата
    fields.price || fields.base || '',                // I: Поддержка / Оценка / База
    [fields.date, fields.time].filter(Boolean).join(' ') || fields.comment || '',  // J: Срок / Комментарий
    leadId || '',                                     // K: Lead ID
  ];
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Лиды';
  await appendRow(sheetName, row);
}

// --- CRM (PocketBase) ---
async function sendToCRM(source, phone, fields, leadId) {
  const pbUrl = process.env.PB_URL;
  const pbToken = process.env.PB_API_TOKEN;
  if (!pbUrl || !pbToken) return;

  const sourceLabelMap = { quiz: 'Quiz', audit: 'Аудит', callback: 'Звонок', pricing: 'Тариф', 'url-capture': 'URL-захват', platform: 'Конструктор', 'voice-landing': 'Голосовой бот' };
  const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

  const body = {
    name: fields.name || phone,
    phone,
    email: '',
    company: fields.company || fields.niche || '',
    source: sourceLabelMap[source] || source,
    stage: 'Новый',
    amount: 0,
    score: 50,
    sla_deadline: slaDeadline,
    archived: false,
    notes: [
      fields.task ? `Задача: ${fields.task}` : '',
      fields.platform ? `Площадка: ${fields.platform}` : '',
      fields.speed ? `Сроки: ${fields.speed}` : '',
      fields.price ? `Оценка: ${fields.price}` : '',
      fields.date ? `Дата аудита: ${fields.date} ${fields.time || ''}` : '',
      fields.company ? `Компания: ${fields.company}` : '',
      fields.result_channel ? `Канал результата: ${fields.result_channel}` : '',
      fields.base ? `База для обзвона: ${fields.base}` : '',
      fields.comment ? `Комментарий: ${fields.comment}` : '',
    ].filter(Boolean).join('\n'),
    niche: fields.niche || '',
    task_description: fields.task || '',
    price_estimate: fields.price || '',
    reactivation_status: 'not_started',
    reactivation_step: 0,
  };

  const resp = await fetch(`${pbUrl}/api/collections/leads/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': pbToken,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`PocketBase ${resp.status}: ${await resp.text()}`);

  const lead = await resp.json();
  await fetch(`${pbUrl}/api/collections/timeline/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': pbToken },
    body: JSON.stringify({
      lead: lead.id,
      type: 'create',
      text: `Лид создан из ${sourceLabelMap[source] || source}`,
      icon: '➕',
    }),
  }).catch(() => {});
}

// --- Supabase: create auth user + save bot config ---
async function createSupabaseUser(contact, botConfig) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return null; // graceful no-op

  let createClient;
  try {
    ({ createClient } = require('@supabase/supabase-js'));
  } catch (e) {
    console.warn('createSupabaseUser: @supabase/supabase-js not available, skipping');
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const phone = contact.phone;
    const normalizedPhone = phone.replace(/\D/g, '').replace(/^8/, '7');
    const email = `${normalizedPhone}@betaline.auto`;

    // Create auth user
    const { data: userData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (createErr) throw new Error(`createUser: ${createErr.message}`);
    const userId = userData.user.id;

    // Set password
    const password = generatePassword(10);
    const { error: pwErr } = await supabase.auth.admin.updateUserById(userId, { password });
    if (pwErr) throw new Error(`updateUserById: ${pwErr.message}`);

    // Save bot config
    const { error: insertErr } = await supabase.from('bot_configs').insert({
      user_id: userId,
      site_url: botConfig.site_url || null,
      site_excerpt: botConfig.site_excerpt || null,
      bot_name: botConfig.bot_name || null,
      tone: botConfig.tone || null,
      greeting: botConfig.greeting || null,
      widget_color: botConfig.widget_color || null,
    });
    if (insertErr) console.warn('bot_configs insert error (non-fatal):', insertErr.message);

    return { userId, password };
  } catch (err) {
    console.error('createSupabaseUser failed (non-fatal):', err.message);
    return null;
  }
}

// --- Telegram DM: send credentials to user ---
async function sendCredentialsViaTelegram(contact, password) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return; // graceful no-op
  if (!password) return; // no password means Supabase was skipped

  const phone = contact.phone || '';
  // Only attempt if contact looks like a Telegram username (starts with @)
  const username = phone.startsWith('@') ? phone.slice(1) : null;
  if (!username) return;

  const text = `Привет! Твой ИИ-ассистент собирается. 🔑 Пароль: ${password}. Войди в кабинет: https://betaline-saas-landing.vercel.app/cabinet/`;

  try {
    // First resolve username to chat_id via getUpdates is not reliable;
    // instead attempt sendMessage directly — works only if user started the bot
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: `@${username}`, text }),
    });
    // Swallow errors — user may not have started the bot yet
  } catch (_) { /* intentional no-op */ }
}

// --- Email (Resend) ---
async function sendEmail(source, phone, fields, leadId) {
  const apiKey = process.env.RESEND_API_KEY;
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!apiKey || !managerEmail) return;

  const subjects = {
    quiz: `🧮 Новый расчёт из квиза — ${phone}`,
    audit: `🎯 Запись на аудит — ${fields.name || phone}`,
    callback: `📞 Обратный звонок — ${fields.name || phone}`,
    pricing: `💰 Заявка на тариф — ${fields.name || phone}`,
    'voice-landing': `📞 Заявка на Голосовой AI — ${fields.name || phone}`,
  };
  const linesBySource = {
    quiz: [`Телефон: ${phone}`, `Сфера: ${fields.niche}`, `Задача: ${fields.task}`, `Площадка: ${fields.platform}`, `Сроки: ${fields.speed}`, `Оценка: ${fields.price}`],
    audit: [`Имя: ${fields.name}`, `Телефон: ${phone}`, `Сфера: ${fields.niche}`, `Дата: ${fields.date}`, `Время: ${fields.time}`, `Задача: ${fields.task || '—'}`],
    callback: [`Имя: ${fields.name}`, `Телефон: ${phone}`],
    pricing: [`Имя: ${fields.name}`, `Телефон: ${phone}`],
    'voice-landing': [
      `Имя: ${fields.name || '—'}`,
      `Телефон: ${phone}`,
      `Компания: ${fields.company || '—'}`,
      `Ниша: ${fields.niche || '—'}`,
      `База: ${fields.base || '—'}`,
      `Канал результата: ${fields.result_channel || '—'}`,
      `Задача звонка: ${fields.task || '—'}`,
      `Комментарий: ${fields.comment || '—'}`,
    ],
  };

  if (!subjects[source] || !linesBySource[source]) return; // no email template for this source
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'BetaLine AI <onboarding@resend.dev>',
      reply_to: 'betalineai@gmail.com',
      to: managerEmail,
      subject: subjects[source],
      text: linesBySource[source].join('\n') + (leadId ? `\n\nLead ID: ${leadId}` : ''),
    }),
  });
  if (!resp.ok) throw new Error(`Resend ${resp.status}: ${await resp.text()}`);
}
