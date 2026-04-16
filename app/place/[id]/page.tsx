// app/place/[id]/page.tsx
import { notFound } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Place } from '@/lib/types';
import PlaceDetailClient from './place-detail-client';

async function getPlace(id: string): Promise<Place | null> {
  const docRef = doc(db, 'places', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Place;
}

export default async function PlacePage({ params }: { params: { id: string } }) {
  const place = await getPlace(params.id);
  if (!place) notFound();
  
  return <PlaceDetailClient place={place} />;
}
