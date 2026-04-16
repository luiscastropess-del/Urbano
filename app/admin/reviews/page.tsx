'use client';

import { useEffect, useState } from 'react';
import { Star, Trash2, Loader2, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc, where, getDoc } from 'firebase/firestore';
import { Review, Place } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReviewWithPlace extends Review {
  placeTitle?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithPlace[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredReviews(reviews);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredReviews(
        reviews.filter(
          (r) =>
            r.userName.toLowerCase().includes(lower) ||
            r.comment.toLowerCase().includes(lower) ||
            r.placeTitle?.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchTerm, reviews]);

  async function loadReviews() {
    setLoading(true);
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const reviewsData: ReviewWithPlace[] = [];

      for (const docSnap of snapshot.docs) {
        const review = { id: docSnap.id, ...docSnap.data() } as ReviewWithPlace;
        // Buscar título do lugar
        if (review.placeId) {
          const placeRef = doc(db, 'places', review.placeId);
          const placeSnap = await getDoc(placeRef);
          if (placeSnap.exists()) {
            review.placeTitle = (placeSnap.data() as Place).title;
          } else {
            review.placeTitle = '[Lugar removido]';
          }
        }
        reviewsData.push(review);
      }

      setReviews(reviewsData);
      setFilteredReviews(reviewsData);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(reviewId: string) {
    setDeletingId(reviewId);
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      alert('Não foi possível excluir a avaliação.');
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(timestamp: any) {
    if (!timestamp) return 'Data desconhecida';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">Avaliações</h1>
        <Badge className="tag-badge text-sm py-2 px-4">
          {filteredReviews.length} {filteredReviews.length === 1 ? 'avaliação' : 'avaliações'}
        </Badge>
      </div>

      {/* Barra de busca */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
        <Input
          placeholder="Buscar por usuário, comentário ou lugar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 pr-10 fun-card border-0 bg-white/70"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5"
          >
            <X className="w-4 h-4 text-text-soft" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="fun-card border-0 overflow-hidden">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Usuário</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredReviews.map((review) => (
                    <motion.tr
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/20"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={review.userAvatar} />
                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                              {review.userName?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{review.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="line-clamp-2 text-text-soft">{review.comment}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{review.placeTitle || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'fill-warning text-warning' : 'text-text-soft/30'
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-text-soft">
                        {formatDate(review.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger>
                            <Button variant="ghost" size="sm" className="text-error hover:text-error/80">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A avaliação de <strong>{review.userName}</strong> será removida permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(review.id!)}
                                className="bg-error hover:bg-error/90"
                                disabled={deletingId === review.id}
                              >
                                {deletingId === review.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Excluir'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
      }
