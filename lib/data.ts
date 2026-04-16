// lib/data.ts
import { Category } from './types';

// Categorias estáticas (não mudam com frequência, podem ficar aqui)
export const categories: Category[] = [
  { id: '1', name: 'Todos', icon: '🌟' },
  { id: '2', name: 'Restaurantes', icon: '🍽️' },
  { id: '3', name: 'Bares', icon: '🍸' },
  { id: '4', name: 'Parques', icon: '🌳' },
  { id: '5', name: 'Cultura', icon: '🎭' },
  { id: '6', name: 'Eventos', icon: '🎉' },
];

// Função auxiliar para formatar preço (1-4) em string de 💰
export function formatPrice(price: number): string {
  return '💰'.repeat(price);
}

// Função auxiliar para truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// ATENÇÃO: Os dados de lugares (places) não são mais exportados daqui.
// Utilize as funções do módulo `@/lib/firebase-services` para buscar os lugares do Firestore.
// Exemplo: import { getPublishedPlaces } from '@/lib/firebase-services';
