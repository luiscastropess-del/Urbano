'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublishedPlaces, deletePlace } from '@/lib/firebase-services';
import { Place } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadPlaces();
  }, []);
  
  async function loadPlaces() {
    const data = await getPublishedPlaces();
    setPlaces(data);
    setLoading(false);
  }
  
  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir este lugar?')) {
      await deletePlace(id);
      loadPlaces();
    }
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Lugares</h2>
        <Link href="/admin/places/new">
          <Button className="btn-pop">
            <Plus className="w-5 h-5 mr-2" />
            Novo Lugar
          </Button>
        </Link>
      </div>
      
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="fun-card p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {places.map((place) => (
                <TableRow key={place.id}>
                  <TableCell className="font-medium">{place.title}</TableCell>
                  <TableCell>{place.category}</TableCell>
                  <TableCell>{place.rating.toFixed(1)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${place.published ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                      {place.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/admin/places/${place.id}`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(place.id!)}>
                      <Trash2 className="w-4 h-4 text-error" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
