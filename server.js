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

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/', pages);         
app.use('/api', api);    
app.get('/:code', redirectHandler); 

init().then(() => {
  console.log('DB initialized');
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});

app.use('/api', require('./routes/api'));

app.use('/', require('./routes/pages'));

app.get('/healthz', (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

app.get('/:code', require('./routes/pages').redirectHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TinyLink listening on port ${PORT}`);
});
