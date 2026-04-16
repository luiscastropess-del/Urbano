import Fastify from 'fastify';
import cors from '@fastify/cors';

const app = Fastify();

app.register(cors, { origin: true });

app.get('/', async () => {
  return { status: 'API rodando 🚀' };
});

app.listen({
  port: Number(process.env.PORT) || 3000,
  host: '0.0.0.0'
});
