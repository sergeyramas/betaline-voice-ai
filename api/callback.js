const leadHandler = require('./lead');

module.exports = async function handler(req, res) {
  // CORS — match lead.js
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Missing required fields' });

  req.body = { source: 'callback', name, phone };
  return leadHandler(req, res);
};
