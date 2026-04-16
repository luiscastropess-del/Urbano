'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaceForm } from '@/components/forms/PlaceForm';
import { getPlaceById, updatePlace } from '@/lib/services/place.service';

export default function EditPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [id, setId] = useState('');

  useEffect(() => {
    async function init() {
      const { id } = await params;
      setId(id);

      const place = await getPlaceById(id);
      setData(place);
    }

    init();
  }, [params]);

  const handleSubmit = async (formData: any) => {
    await updatePlace(id, formData);
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
