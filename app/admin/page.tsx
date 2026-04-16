'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, MessageSquare, Users, Star, TrendingUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Stats {
  totalPlaces: number;
  totalReviews: number;
  totalUsers: number;
  averageRating: number;
  recentReviews: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPlaces: 0,
    totalReviews: 0,
    totalUsers: 0,
    averageRating: 0,
    recentReviews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const placesSnap = await getCountFromServer(collection(db, 'places'));
        const reviewsSnap = await getCountFromServer(collection(db, 'reviews'));
        const usersSnap = await getCountFromServer(collection(db, 'users'));

        const placesQuery = query(collection(db, 'places'), where('published', '==', true));
        const placesDocs = await getDocs(placesQuery);
        let totalRating = 0;
        let ratedPlaces = 0;
        placesDocs.forEach((doc) => {
          const data = doc.data();
          if (data.rating > 0) {
            totalRating += data.rating;
            ratedPlaces++;
          }
        });
        const avgRating = ratedPlaces > 0 ? totalRating / ratedPlaces : 0;

        const recentQuery = query(collection(db, 'reviews'), where('createdAt', '!=', null));
        const recentSnap = await getDocs(recentQuery);
        const recent = recentSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 5);

        setStats({
          totalPlaces: placesSnap.data().count,
          totalReviews: reviewsSnap.data().count,
          totalUsers: usersSnap.data().count,
          averageRating: avgRating,
          recentReviews: recent,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { title: 'Lugares', value: stats.totalPlaces, icon: MapPin, color: 'bg-primary/10 text-primary', href: '/admin/places' },
    { title: 'Avaliações', value: stats.totalReviews, icon: MessageSquare, color: 'bg-secondary/10 text-secondary', href: '/admin/reviews' },
    { title: 'Usuários', value: stats.totalUsers, icon: Users, color: 'bg-accent/10 text-accent', href: '/admin/users' },
    { title: 'Média de Notas', value: stats.averageRating.toFixed(1), icon: Star, color: 'bg-warning/10 text-warning', href: '/admin/reviews' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-black mb-8">Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={card.href}>
                  <Card className="fun-card border-0 hover:scale-[1.02] transition-transform cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-text-soft">{card.title}</CardTitle>
                      <div className={`p-2 rounded-full ${card.color}`}>
                        <card.icon className="w-5 h-5" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-black">{card.value}</div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="fun-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Avaliações Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.recentReviews.length === 0 ? (
                  <p className="text-text-soft text-center py-8">Nenhuma avaliação ainda.</p>
                ) : (
                  stats.recentReviews.map((review: any) => (
                    <div key={review.id} className="flex items-start gap-3 p-3 bg-white/30 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {review.userName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{review.userName}</span>
                          <span className="text-xs text-text-soft">
                            {review.createdAt?.toDate
                              ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true, locale: ptBR })
                              : 'recentemente'}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? 'fill-warning text-warning' : 'text-text-soft/30'}`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-text-soft line-clamp-2">{review.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="fun-card border-0">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/places/new">
                  <Button className="btn-pop w-full justify-start">
                    <MapPin className="w-4 h-4 mr-2" />
                    Adicionar novo lugar
                  </Button>
                </Link>
                <Link href="/admin/reviews">
                  <Button variant="outline" className="w-full justify-start fun-card">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Gerenciar avaliações
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full justify-start fun-card">
                    <Users className="w-4 h-4 mr-2" />
                    Gerenciar usuários
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
          }
