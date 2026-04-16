const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'API Urbano rodando 🚀' });
});

app.listen(3001, () => console.log('API on http://localhost:3001'));
