'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Upload, X, Plus, Save, Loader2, Trash2 } from 'lucide-react';

import { getPlaceById, updatePlace, uploadPlaceImage, uploadGalleryImages, deletePlace } from '@/lib/firebase-services';
import { categories } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ✅ SCHEMA CORRIGIDO
const placeSchema = z.object({
  title: z.string().min(3),
  summary: z.string().max(200),
  description: z.string().min(1),
  category: z.string().min(1),
  price: z.number().min(1).max(4),
  openingHours: z.string().min(1),
  openingDays: z.string().min(1),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().min(5),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),

  // ✅ FIX PRINCIPAL AQUI
  tags: z
    .array(z.string())
    .optional()
    .transform((val) => val ?? []),

  published: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type PlaceFormData = z.infer<typeof placeSchema>;

function LocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number };
  onChange: (pos: { lat: number; lng: number }) => void;
}) {
  const [position, setPosition] = useState(value);

  function MapEvents() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });
        onChange({ lat, lng });
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={[value.lat, value.lng]}
      zoom={15}
      style={{ height: '300px', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[position.lat, position.lng]} />
      <MapEvents />
    </MapContainer>
  );
}

export default function EditPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [tagsInput, setTagsInput] = useState('');

  const [id, setId] = useState('');

  const { register, handleSubmit, control, setValue, reset } = useForm<PlaceFormData>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      lat: -23.5505,
      lng: -46.6333,
      price: 2,
      published: true,
      featured: false,
      tags: [],
    },
  });

  useEffect(() => {
    async function resolveParams() {
      const { id } = await params;
      setId(id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function loadPlace() {
      const place = await getPlaceById(id);
      if (!place) return;

      const tagsArray = place.tags || [];

      reset({
        title: place.title,
        summary: place.summary,
        description: place.description,
        category: place.category,
        price: place.price,
        openingHours: place.openingHours,
        openingDays: place.openingDays,
        phone: place.phone || '',
        whatsapp: place.whatsapp || '',
        address: place.location.address,
        lat: place.location.lat,
        lng: place.location.lng,
        instagram: place.socialMedia.instagram || '',
        facebook: place.socialMedia.facebook || '',
        website: place.socialMedia.website || '',
        tags: tagsArray,
        published: place.published,
        featured: place.featured,
      });

      // ✅ sincroniza input com array
      setTagsInput(tagsArray.join(', '));

      setIsLoading(false);
    }

    loadPlace();
  }, [id, reset]);

  const onSubmit = async (data: PlaceFormData) => {
    setIsSaving(true);

    try {
      await updatePlace(id, {
        ...data,
        tags: data.tags,
      });

      router.push('/admin/places');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <h1 className="text-3xl font-black mb-6">Editar Lugar</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input {...register('title')} placeholder="Título" />
            <Textarea {...register('description')} placeholder="Descrição" />

            {/* ✅ TAGS CORRIGIDO */}
            <div>
              <label className="font-semibold">Tags</label>
              <Input
                value={tagsInput}
                placeholder="romântico, vista, premium"
                onChange={(e) => {
                  const value = e.target.value;
                  setTagsInput(value);

                  const array = value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);

                  setValue('tags', array);
                }}
              />
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
