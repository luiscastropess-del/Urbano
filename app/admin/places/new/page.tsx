'use client';

import { useRouter } from 'next/navigation';
import { PlaceForm } from '@/components/forms/PlaceForm';
import { createPlace } from '@/lib/services/place.service';

export default function NewPlacePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    await createPlace(data);
    router.push('/admin/places');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1>Novo Lugar</h1>
      <PlaceForm action={handleSubmit} />
    </div>
  );
}
