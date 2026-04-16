// lib/firebase-services.ts
import { db, auth, storage } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment,
  setDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { Place, Review, UserProfile } from './types'; // Importa os tipos do arquivo types.ts

// ==================== SERVIÇOS DE LUGARES ====================

export async function getPublishedPlaces(): Promise<Place[]> {
  const q = query(
    collection(db, 'places'),
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place));
}

export async function getFeaturedPlaces(limitCount: number = 6): Promise<Place[]> {
  const q = query(
    collection(db, 'places'),
    where('published', '==', true),
    where('featured', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Place));
}

export async function getPlaceById(id: string): Promise<Place | null> {
  const docRef = doc(db, 'places', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Place;
}

export async function createPlace(data: Omit<Place, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'totalRatings'>): Promise<string> {
  const docData = {
    ...data,
    rating: 0,
    totalRatings: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'places'), docData);
  return docRef.id;
}

export async function updatePlace(id: string, data: Partial<Place>): Promise<void> {
  const docRef = doc(db, 'places', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlace(id: string): Promise<void> {
  const place = await getPlaceById(id);
  if (place) {
    if (place.imageUrl) {
      try {
        const imageRef = ref(storage, place.imageUrl);
        await deleteObject(imageRef);
      } catch (e) {
        console.warn('Erro ao excluir imagem principal:', e);
      }
    }
    if (place.gallery && place.gallery.length) {
      for (const url of place.gallery) {
        try {
          const imageRef = ref(storage, url);
          await deleteObject(imageRef);
        } catch (e) {
          console.warn('Erro ao excluir imagem da galeria:', e);
        }
      }
    }
  }
  
  const reviewsQuery = query(collection(db, 'reviews'), where('placeId', '==', id));
  const reviewsSnapshot = await getDocs(reviewsQuery);
  const batch = writeBatch(db);
  reviewsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
  const docRef = doc(db, 'places', id);
  batch.delete(docRef);
  await batch.commit();
}

// ==================== SERVIÇOS DE AVALIAÇÕES ====================

export async function getReviewsByPlaceId(placeId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('placeId', '==', placeId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
}

export async function createReview(
  placeId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  rating: number,
  comment: string
): Promise<void> {
  const batch = writeBatch(db);
  
  const reviewRef = doc(collection(db, 'reviews'));
  batch.set(reviewRef, {
    placeId,
    userId,
    userName,
    userAvatar: userAvatar || null,
    rating,
    comment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  const placeRef = doc(db, 'places', placeId);
  const placeSnap = await getDoc(placeRef);
  if (placeSnap.exists()) {
    const place = placeSnap.data() as Place;
    const newTotalRatings = (place.totalRatings || 0) + 1;
    const newRating = ((place.rating || 0) * (place.totalRatings || 0) + rating) / newTotalRatings;
    batch.update(placeRef, {
      rating: newRating,
      totalRatings: increment(1),
      updatedAt: serverTimestamp(),
    });
  }
  
  await batch.commit();
}

export async function deleteReview(reviewId: string, placeId: string): Promise<void> {
  const batch = writeBatch(db);
  
  const reviewRef = doc(db, 'reviews', reviewId);
  const reviewSnap = await getDoc(reviewRef);
  if (!reviewSnap.exists()) throw new Error('Avaliação não encontrada');
  
  const review = reviewSnap.data() as Review;
  batch.delete(reviewRef);
  
  const placeRef = doc(db, 'places', placeId);
  const placeSnap = await getDoc(placeRef);
  if (placeSnap.exists()) {
    const place = placeSnap.data() as Place;
    const newTotalRatings = (place.totalRatings || 1) - 1;
    let newRating = 0;
    if (newTotalRatings > 0) {
      newRating = ((place.rating || 0) * (place.totalRatings || 0) - review.rating) / newTotalRatings;
    }
    batch.update(placeRef, {
      rating: newRating,
      totalRatings: increment(-1),
      updatedAt: serverTimestamp(),
    });
  }
  
  await batch.commit();
}

// ==================== SERVIÇOS DE USUÁRIOS ====================

export async function upsertUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    await updateDoc(userRef, data);
  } else {
    await setDoc(userRef, {
      uid,
      displayName: data.displayName || '',
      email: data.email || '',
      photoURL: data.photoURL || null,
      role: data.role || 'user',
      favorites: data.favorites || [],
      createdAt: serverTimestamp(),
    });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  return { uid: userSnap.id, ...userSnap.data() } as UserProfile;
}

export async function toggleFavorite(uid: string, placeId: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('Usuário não encontrado');
  
  const user = userSnap.data() as UserProfile;
  const favorites = user.favorites || [];
  const newFavorites = favorites.includes(placeId)
    ? favorites.filter(id => id !== placeId)
    : [...favorites, placeId];
  
  await updateDoc(userRef, { favorites: newFavorites });
}

// ==================== SERVIÇOS DE UPLOAD DE IMAGENS ====================

export async function uploadPlaceImage(
  file: File,
  placeId: string,
  type: 'main' | 'gallery'
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const path = `places/${placeId}/${type}_${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function uploadGalleryImages(files: File[], placeId: string): Promise<string[]> {
  const uploadPromises = files.map(file => uploadPlaceImage(file, placeId, 'gallery'));
  return Promise.all(uploadPromises);
}

export async function deleteImage(url: string): Promise<void> {
  const imageRef = ref(storage, url);
  await deleteObject(imageRef);
}
