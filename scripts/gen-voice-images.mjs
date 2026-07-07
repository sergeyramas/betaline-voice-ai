#!/usr/bin/env node
// Scenario-card illustrations for BetaLine Voice AI landing.
// Style matches existing renders (voice-handoff-dashboard-v1.jpg):
// warm cream bg, white UI cards, orange accents, greeked text bars — NO real text.
// Usage: node scripts/gen-voice-images.mjs [outreach|confirm|script|all]
// Reads OPENAI_API_KEY from main repo's .env.local.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_PATH = '/Users/sergeyrama/Documents/Betaline NEW V1/SAAS Betaline AI Landing + Platform/.env.local';

function loadEnv() {
  if (!existsSync(ENV_PATH)) { console.error(`[fatal] .env.local not found`); process.exit(1); }
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const STYLE = `Premium soft 3D UI illustration in warm brand style: light warm cream background (#FFF7ED), clean white rounded cards (24px radius) with very soft shadows, vivid orange (#F97316) accent elements, small green (#10B981) success accents. ALL text represented ONLY as blurred grey and orange placeholder bars (greeking) — absolutely no readable letters, no words, no captions, no numbers, no logos anywhere in the image; status pills contain only icons/glyphs. Airy композиция, generous whitespace, high-end SaaS marketing render, soft studio light, subtle warm glow. Landscape 3:2 composition, subject centered. `;

const PROMPTS = {
  'scenario-outreach': STYLE + `A voice-call conversation card: at top a round orange phone icon with outgoing-call arrow and an active orange audio waveform strip; below it a vertical chat-style transcript of a phone dialogue — alternating white bubbles (client, left) and orange bubbles (AI bot, right) filled with greeked text bars; at bottom a green status pill with a checkmark and a small arrow leading to a person avatar icon (handoff to manager). Mood: first contact call, interest captured.`,
  'scenario-confirm': STYLE + `A voice-call appointment-confirmation card: at top a white calendar card with one date cell highlighted orange and a small clock icon; an orange audio waveform strip beside a round phone icon; below a short chat-style transcript of bubbles with greeked bars (white left, orange right); at bottom a green pill containing ONLY a white checkmark glyph (no letters), and a small rescheduling icon (circular arrows) in a neutral pill. Mood: visit confirmed, fewer no-shows.`,
  'scenario-script': STYLE + `A scripted-answers voice card: at top an open document/knowledge-base card with greeked text lines and an orange bookmark; an orange waveform strip with a round phone icon; below a chat transcript of bubbles with greeked bars where one client bubble contains a large grey question mark, and the reply path splits — one arrow to an orange answer bubble, another arrow to a person avatar icon (escalation to human). Mood: fast answers within approved boundaries.`,
};

async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1536x1024', quality: 'high', n: 1 }),
  });
  if (!res.ok) throw new Error(`gpt-image-1 ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const item = json.data && json.data[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item?.url) { const img = await fetch(item.url); return Buffer.from(await img.arrayBuffer()); }
  throw new Error('No image in response');
}

async function main() {
  loadEnv();
  if (!process.env.OPENAI_API_KEY) { console.error('[fatal] no OPENAI_API_KEY'); process.exit(1); }
  const arg = process.argv[2] || 'all';
  const keys = arg === 'all' ? Object.keys(PROMPTS) : [arg];
  for (const k of keys) {
    const target = resolve(ROOT, 'assets/img', `${k}.png`);
    console.log(`[${k}] generating…`);
    try {
      const buf = await callOpenAI(PROMPTS[k]);
      writeFileSync(target, buf);
      console.log(`[${k}] saved ${Math.round(buf.length / 1024)}KB → ${target}`);
    } catch (e) {
      console.error(`[${k}] FAILED: ${e.message}`);
      process.exitCode = 1;
    }
  }
}
main();
