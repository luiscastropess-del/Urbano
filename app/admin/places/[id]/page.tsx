'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaceForm } from '@/components/forms/PlaceForm';
import { getPlaceById, updatePlace } from '@/lib/services/place.service';

export default function EditPlacePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>();

  useEffect(() => {
    getPlaceById(params.id).then(setData);
  }, [params.id]);

  const handleSubmit = async (formData: any) => {
    await updatePlace(params.id, formData);
    router.push('/admin/places');
  };

  if (!data) return <div>Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1>Editar Lugar</h1>
      <PlaceForm initialData={data} onSubmit={handleSubmit} />
    </div>
  );
}
