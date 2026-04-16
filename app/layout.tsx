import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Urbano - Guia da Cidade',
  description: 'Descubra o melhor de São Paulo com estilo e diversão.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
