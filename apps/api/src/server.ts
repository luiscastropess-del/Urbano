import express from 'express';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Urbano funcionando 🚀' });
});

app.listen(3001, () => {
  console.log('API rodando em http://localhost:3001');
});
