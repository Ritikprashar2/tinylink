// routes/api.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { customAlphabet } = require('nanoid');

const CODE_REGEX = /^[A-Za-z0-9]{4,8}$/;
const nano = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 4);

// Helper: validate URL (basic)
function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// POST /api/links - create
router.post('/links', async (req, res) => {
  const { url, code } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid or missing url' });
  }

  let finalCode = code ? String(code).trim() : nano();
  if (code) {
    if (!CODE_REGEX.test(finalCode)) {
      return res.status(400).json({ error: 'Invalid code format. Codes must match [A-Za-z0-9]{6,8}.' });
    }
  } else {
    // generated code is 6 chars but ensure uniqueness
    let tries = 0;
    while (tries < 5) {
      const { rows } = await pool.query('SELECT 1 FROM links WHERE code=$1', [finalCode]);
      if (rows.length === 0) break;
      finalCode = nano();
      tries++;
    }
  }

  try {
    await pool.query('INSERT INTO links(code, url) VALUES($1, $2)', [finalCode, url]);
    const base = process.env.BASE_URL || '';
    return res.status(201).json({ code: finalCode, shortUrl: `${base.replace(/\/$/, '')}/${finalCode}`, url, clicks: 0 });
  } catch (err) {
    // unique violation
    if (err.code === '23505' || err.message.includes('duplicate key')) {
      return res.status(409).json({ error: 'Code already exists' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
});

// GET /api/links - list all
router.get('/links', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT code, url, clicks, last_clicked, created_at FROM links ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
});

// GET /api/links/:code - single link stats
router.get('/links/:code', async (req, res) => {
  const code = req.params.code;
  try {
    const { rows } = await pool.query('SELECT code, url, clicks, last_clicked, created_at FROM links WHERE code=$1', [code]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
});

// DELETE /api/links/:code
router.delete('/links/:code', async (req, res) => {
  const code = req.params.code;
  try {
    const { rowCount } = await pool.query('DELETE FROM links WHERE code=$1', [code]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
});

module.exports = router;
