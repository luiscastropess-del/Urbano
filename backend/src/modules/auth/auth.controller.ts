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
