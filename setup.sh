#!/bin/bash

echo "🚀 Criando backend Urbano..."

# Criar estrutura
mkdir -p backend/src/modules/{auth,places,reviews}
mkdir -p backend/src/plugins
mkdir -p backend/prisma

cd backend

# package.json
cat > package.json <<EOL
{
  "name": "urbano-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "fastify": "^4.0.0",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
EOL

# tsconfig
cat > tsconfig.json <<EOL
{
  "compilerOptions": {
    "outDir": "./dist",
    "module": "commonjs",
    "target": "es2020",
    "esModuleInterop": true,
    "strict": true
  }
}
EOL

# .env
cat > .env <<EOL
DATABASE_URL="COLE_AQUI_SUA_URL_DO_NEON"
JWT_SECRET="supersecret"
EOL

# Prisma schema
cat > prisma/schema.prisma <<EOL
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  nome      String
  email     String   @unique
  senha     String
  role      Role     @default(USER)
  reviews   Review[]
  createdAt DateTime @default(now())
}

model Place {
  id          String   @id @default(uuid())
  nome        String
  descricao   String?
  categoria   Categoria
  latitude    Float
  longitude   Float
  endereco    String
  precoMedio  Int
  abertura    String
  fechamento  String
  reviews     Review[]
  createdAt   DateTime @default(now())
}

model Review {
  id        String   @id @default(uuid())
  nota      Int
  comentario String
  userId    String
  placeId   String
  user      User  @relation(fields: [userId], references: [id])
  place     Place @relation(fields: [placeId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, placeId])
}

enum Role {
  USER
  ADMIN
}

enum Categoria {
  RESTAURANTE
  BAR
  PRACA
  EVENTO
}
EOL

# server
cat > src/server.ts <<EOL
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
EOL

# prisma plugin
cat > src/plugins/prisma.ts <<EOL
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
EOL

# auth controller
cat > src/modules/auth/auth.controller.ts <<EOL
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../plugins/prisma';

export async function register(req: any) {
  const { nome, email, senha } = req.body;

  const hash = await bcrypt.hash(senha, 10);

  return prisma.user.create({
    data: { nome, email, senha: hash }
  });
}

export async function login(req: any) {
  const { email, senha } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  const valid = await bcrypt.compare(senha, user.senha);
  if (!valid) throw new Error('Invalid password');

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);

  return { token };
}
EOL

# DONE
echo "✅ Backend criado com sucesso!"
echo "👉 Agora rode:"
echo "cd backend"
echo "npm install"
echo "npx prisma generate"
echo "npx prisma db push"
echo "npm run dev"