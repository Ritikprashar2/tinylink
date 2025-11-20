// routes/pages.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { pool } = require('../db');

// Serve static HTML pages
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

router.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'stats.html'));
});

// redirect handler used by server.js for /:code
async function redirectHandler(req, res) {
  const code = req.params.code;
  // If the path matches known static pages (e.g., 'public' etc.), let express static handle it earlier.
  try {
    const { rows } = await pool.query('SELECT url FROM links WHERE code=$1', [code]);
    if (rows.length === 0) {
      return res.status(404).send('Not found');
    }
    const url = rows[0].url;
    // increment clicks and update last_clicked
    await pool.query('UPDATE links SET clicks = clicks + 1, last_clicked = NOW() WHERE code=$1', [code]);
    return res.redirect(302, url);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
}

module.exports = router;
module.exports.redirectHandler = redirectHandler;
