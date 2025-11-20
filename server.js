require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const pages = require('./routes/pages');
const api = require('./routes/api');
const { redirectHandler } = require('./routes/pages');
const { init } = require('./db');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', pages);
app.use('/api', api);

// Short URL redirect (must be after /api)
app.get('/:code', redirectHandler);

// Health Check
app.get('/healthz', (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// Start Server AFTER DB init
init()
  .then(() => {
    console.log('DB initialized');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`TinyLink listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
