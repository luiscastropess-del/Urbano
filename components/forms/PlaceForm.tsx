'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { placeSchema, PlaceInput, PlaceOutput } from '@/lib/schemas/place';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function PlaceForm({
  initialData,
  action,
}: {
  initialData?: Partial<PlaceInput>;
  action: (data: PlaceOutput) => Promise<void>;
}) {
  const { register, handleSubmit, control } = useForm<
    PlaceInput,
    any,
    PlaceOutput
  >({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      title: '',
      summary: '',
      description: '',
      category: '',
      price: 2,
      openingHours: '',
      openingDays: '',
      address: '',
      lat: -23.5505,
      lng: -46.6333,
      tags: [],
      published: true,
      featured: false,
      ...initialData,
    },
  });

  return (
    <form onSubmit={handleSubmit(action)} className="space-y-4">
      <Input {...register('title')} placeholder="Título" />

      {/* TAGS */}
      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <Input
            value={field.value?.join(', ') || ''}
            onChange={(e) => {
              const tags = e.target.value
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);

              field.onChange(tags);
            }}
          />
        )}
      />

      {/* PRICE */}
      <Controller
        name="price"
        control={control}
        render={({ field }) => (
          <select
            value={field.value}
            onChange={(e) => field.onChange(Number(e.target.value))}
          >
            <option value={1}>Econômico</option>
            <option value={2}>Moderado</option>
            <option value={3}>Alto</option>
            <option value={4}>Luxo</option>
          </select>
        )}
      />

      <Button type="submit">Salvar</Button>
    </form>
  );
}
