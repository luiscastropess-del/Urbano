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

const placeSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  summary: z.string().max(200, 'Resumo deve ter no máximo 200 caracteres'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Selecione uma categoria'),
  price: z.number().min(1).max(4),
  openingHours: z.string().min(1, 'Horário de funcionamento obrigatório'),
  openingDays: z.string().min(1, 'Dias de funcionamento obrigatório'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().min(5, 'Endereço obrigatório'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  instagram: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  tags: z.string().transform(str => str.split(',').map(t => t.trim()).filter(Boolean)),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type PlaceFormData = z.infer<typeof placeSchema>;

function LocationPicker({ value, onChange }: { value: { lat: number; lng: number }; onChange: (pos: { lat: number; lng: number }) => void }) {
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
    <MapContainer center={[value.lat, value.lng]} zoom={15} style={{ height: '300px', width: '100%' }} className="rounded-lg">
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
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [existingMainImage, setExistingMainImage] = useState<string>('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [id, setId] = useState<string>('');
  
  const { register, handleSubmit, control, setValue, watch, reset } = useForm<PlaceFormData>({
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
      const { id: resolvedId } = await params;
      setId(resolvedId);
    }
    resolveParams();
  }, [params]);
  
  useEffect(() => {
    if (!id) return;
    async function loadPlace() {
      try {
        const place = await getPlaceById(id);
        if (!place) {
          alert('Lugar não encontrado');
          router.push('/admin/places');
          return;
        }
        
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
          tags: place.tags.join(', '),
          published: place.published,
          featured: place.featured,
        });
        
        setExistingMainImage(place.imageUrl);
        setMainImagePreview(place.imageUrl);
        setExistingGallery(place.gallery || []);
        setGalleryPreviews(place.gallery || []);
      } catch (error) {
        console.error(error);
        alert('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    }
    loadPlace();
  }, [id, reset, router]);
  
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
      setExistingMainImage('');
    }
  };
  
  const removeMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview('');
    setExistingMainImage('');
  };
  
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };
  
  const removeGalleryImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingGallery(prev => prev.filter((_, i) => i !== index));
    } else {
      setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    }
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const onSubmit = async (data: PlaceFormData) => {
    setIsSaving(true);
    try {
      const updates: any = {
        title: data.title,
        summary: data.summary,
        description: data.description,
        category: data.category,
        price: data.price,
        openingHours: data.openingHours,
        openingDays: data.openingDays,
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        socialMedia: {
          instagram: data.instagram || undefined,
          facebook: data.facebook || undefined,
          website: data.website || undefined,
        },
        location: {
          lat: data.lat,
          lng: data.lng,
          address: data.address,
        },
        tags: data.tags,
        published: data.published,
        featured: data.featured,
      };
      
      if (mainImageFile) {
        const newUrl = await uploadPlaceImage(mainImageFile, id, 'main');
        updates.imageUrl = newUrl;
      } else if (!existingMainImage) {
        updates.imageUrl = '';
      }
      
      let newGalleryUrls: string[] = [];
      if (galleryFiles.length > 0) {
        newGalleryUrls = await uploadGalleryImages(galleryFiles, id);
      }
      
      updates.gallery = [...existingGallery, ...newGalleryUrls];
      
      await updatePlace(id, updates);
      router.push('/admin/places');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este lugar?')) return;
    try {
      await deletePlace(id);
      router.push('/admin/places');
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">Editar Lugar</h1>
        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-error border-error/30 hover:bg-error/10">
                <Trash2 className="w-4 h-4 mr-2" />Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir lugar?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-error hover:bg-error/90">Sim, excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={handleSubmit(onSubmit)} className="btn-pop" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 p-1 rounded-full">
            <TabsTrigger value="basic" className="rounded-full">Básico</TabsTrigger>
            <TabsTrigger value="media" className="rounded-full">Mídia</TabsTrigger>
            <TabsTrigger value="location" className="rounded-full">Localização</TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-full">Avançado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card className="fun-card border-0">
              <CardHeader><CardTitle>Informações principais</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div><label className="block font-semibold mb-2">Título *</label><Input {...register('title')} placeholder="Nome do local" /></div>
                <div><label className="block font-semibold mb-2">Resumo *</label><Textarea {...register('summary')} placeholder="Breve descrição" rows={3} /></div>
                <div><label className="block font-semibold mb-2">Descrição completa *</label><Textarea {...register('description')} placeholder="Escreva a descrição completa aqui..." className="min-h-[300px]" /></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Categoria *</label>
                    <Controller name="category" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.name !== 'Todos').map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.icon} {cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Faixa de preço *</label>
                    <Controller name="price" control={control} render={({ field }) => (
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">💰 Econômico</SelectItem>
                          <SelectItem value="2">💰💰 Moderado</SelectItem>
                          <SelectItem value="3">💰💰💰 Alto</SelectItem>
                          <SelectItem value="4">💰💰💰💰 Luxo</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block font-semibold mb-2">Horário *</label><Input {...register('openingHours')} placeholder="Ex: 12:00 - 23:00" /></div>
                  <div><label className="block font-semibold mb-2">Dias *</label><Input {...register('openingDays')} placeholder="Ex: Terça a Domingo" /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="media" className="space-y-6 mt-6">
            <Card className="fun-card border-0">
              <CardHeader><CardTitle>Imagens</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block font-semibold mb-2">Imagem principal (capa)</label>
                  <div className="flex items-start gap-4">
                    {mainImagePreview ? (
                      <div className="relative w-40 h-40 rounded-xl overflow-hidden border">
                        <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={removeMainImage} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-xl bg-white/30 border-2 border-dashed flex items-center justify-center text-text-soft"><Upload className="w-8 h-8" /></div>
                    )}
                    <div><Input type="file" accept="image/*" onChange={handleMainImageChange} /></div>
                  </div>
                </div>
                
                <div>
                  <label className="block font-semibold mb-2">Galeria de imagens</label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      {galleryPreviews.map((preview, idx) => {
                        const isExisting = existingGallery.includes(preview);
                        return (
                          <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                            <img src={preview} alt={`Galeria ${idx}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeGalleryImage(idx, isExisting)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"><X className="w-3 h-3" /></button>
                          </div>
                        );
                      })}
                      <label className="w-24 h-24 rounded-lg bg-white/30 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-white/40">
                        <Plus className="w-6 h-6 text-text-soft" />
                        <span className="text-xs text-text-soft mt-1">Adicionar</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="location" className="space-y-6 mt-6">
            <Card className="fun-card border-0">
              <CardHeader><CardTitle>Endereço e Mapa</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div><label className="block font-semibold mb-2">Endereço completo *</label><Input {...register('address')} placeholder="Rua, número, bairro, cidade" /></div>
                <div>
                  <label className="block font-semibold mb-2">Clique no mapa para marcar a localização exata</label>
                  <Controller name="lat" control={control} render={({ field }) => (
                    <Controller name="lng" control={control} render={({ field: fieldLng }) => (
                      <LocationPicker value={{ lat: field.value, lng: fieldLng.value }} onChange={(pos) => { field.onChange(pos.lat); fieldLng.onChange(pos.lng); }} />
                    )} />
                  )} />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div><label className="block text-sm mb-1">Latitude</label><Input {...register('lat', { valueAsNumber: true })} readOnly className="bg-white/50" /></div>
                    <div><label className="block text-sm mb-1">Longitude</label><Input {...register('lng', { valueAsNumber: true })} readOnly className="bg-white/50" /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6 mt-6">
            <Card className="fun-card border-0">
              <CardHeader><CardTitle>Contato e Redes Sociais</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block font-semibold mb-2">Telefone</label><Input {...register('phone')} placeholder="(11) 99999-9999" /></div>
                  <div><label className="block font-semibold mb-2">WhatsApp</label><Input {...register('whatsapp')} placeholder="5511999999999" /></div>
                </div>
                <div><label className="block font-semibold mb-2">Instagram</label><Input {...register('instagram')} placeholder="https://instagram.com/..." /></div>
                <div><label className="block font-semibold mb-2">Facebook</label><Input {...register('facebook')} placeholder="https://facebook.com/..." /></div>
                <div><label className="block font-semibold mb-2">Website</label><Input {...register('website')} placeholder="https://..." /></div>
              </CardContent>
            </Card>
            
            <Card className="fun-card border-0">
              <CardHeader><CardTitle>Tags e Opções</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div><label className="block font-semibold mb-2">Tags (separadas por vírgula)</label><Input {...register('tags')} placeholder="romântico, vista, premium" /></div>
                <div className="flex items-center justify-between"><div><label className="font-semibold">Publicado</label><p className="text-sm text-text-soft">Visível para todos</p></div><Controller name="published" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} /></div>
                <div className="flex items-center justify-between"><div><label className="font-semibold">Destaque</label><p className="text-sm text-text-soft">Aparece nos destaques</p></div><Controller name="featured" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} /></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
