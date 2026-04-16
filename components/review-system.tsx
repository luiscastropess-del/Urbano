'use client';

import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Star, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function ReviewSystem({ placeId }: { placeId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'places', placeId, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(fetchedReviews);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `places/${placeId}/reviews`);
    });

    return () => unsubscribe();
  }, [placeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return alert('Por favor, faça login para avaliar.');
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'places', placeId, 'reviews'), {
        placeId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Usuário',
        rating: newRating,
        comment: newComment,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
      setNewRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `places/${placeId}/reviews`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold">Avaliações</h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-background p-4 rounded-2xl border border-border-light">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={`cursor-pointer transition-colors ${star <= newRating ? 'text-rating fill-current' : 'text-secondary'}`}
                onClick={() => setNewRating(star)}
              />
            ))}
            <span className="text-xs font-bold text-secondary ml-2">{newRating} de 5</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Escreva sua experiência..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 rounded-xl border-none bg-white shadow-sm"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !newComment.trim()}
              className="rounded-xl bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {reviews.length === 0 ? (
              <p className="text-center text-secondary text-sm py-8">Nenhuma avaliação ainda. Seja o primeiro!</p>
            ) : (
              reviews.map((review) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={review.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-border-light flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-border-light flex items-center justify-center">
                        <User size={16} className="text-secondary" />
                      </div>
                      <span className="text-sm font-bold">{review.userName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-rating">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-secondary">{review.comment}</p>
                  {review.createdAt && (
                    <span className="text-[10px] text-secondary/50 uppercase">
                      {new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
                    </span>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
