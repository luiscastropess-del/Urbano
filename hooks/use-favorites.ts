'use client';

import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setFavorites(new Set());
        setIsLoading(false);
        return;
      }

      const q = collection(db, 'users', user.uid, 'favorites');
      const unsubscribeFavs = onSnapshot(q, (snapshot) => {
        const favs = new Set(snapshot.docs.map(doc => doc.id));
        setFavorites(favs);
        setIsLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/favorites`);
        setIsLoading(false);
      });

      return () => unsubscribeFavs();
    });

    return () => unsubscribeAuth();
  }, []);

  const toggleFavorite = async (placeId: string) => {
    if (!auth.currentUser) {
      alert('Por favor, faça login para salvar favoritos.');
      return;
    }

    const docRef = doc(db, 'users', auth.currentUser.uid, 'favorites', placeId);
    
    try {
      if (favorites.has(placeId)) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          placeId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(
        error, 
        favorites.has(placeId) ? OperationType.DELETE : OperationType.CREATE, 
        `users/${auth.currentUser.uid}/favorites/${placeId}`
      );
    }
  };

  return { favorites, toggleFavorite, isLoading };
}
