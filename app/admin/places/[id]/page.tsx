import { getPlaceById } from '@/lib/services/place.service';
import { PlaceForm } from '@/components/forms/PlaceForm';
import { updatePlace } from '@/lib/services/place.service';
import { redirect } from 'next/navigation';

export default async function EditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const place = await getPlaceById(id);

  if (!place) {
    return <div>Não encontrado</div>;
  }

  async function handleSubmit(data: any) {
    'use server';

    await updatePlace(id, data);

    redirect('/admin/places');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1>Editar Lugar</h1>

      <PlaceForm
        initialData={place}
        action={handleSubmit}
      />
    </div>
  );
}
