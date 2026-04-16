'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, Phone, MessageCircle, Globe, Star, Heart, ChevronLeft, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Place, Review } from '@/lib/types';
import { getReviewsByPlaceId, createReview } from '@/lib/firebase-services';
import { useFavorites } from '@/hooks/use-favorites';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import MapView from '@/components/map-view';
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface PlaceDetailClientProps {
  place: Place;
}

export default function PlaceDetailClient({ place }: PlaceDetailClientProps) {
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  
  const isFavorite = favorites.has(place.id!);
  
  useEffect(() => {
    async function loadReviews() {
      const data = await getReviewsByPlaceId(place.id!);
      setReviews(data);
    }
    loadReviews();
  }, [place.id]);
  
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Funcionalidade de review em desenvolvimento. Faça login para avaliar.');
  };

  const photos = place.gallery?.map(url => ({
    src: url,
    width: 400,
    height: 300,
  })) || [];
  
  return (
    <main className="min-h-screen bg-background">
      <div className="relative h-[50vh] md:h-[60vh] w-full">
        <img src={place.imageUrl} alt={place.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="absolute top-6 left-4 md:left-8 flex gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
        
        <Button variant="ghost" size="icon" onClick={() => toggleFavorite(place.id!)} className="absolute top-6 right-4 md:right-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30">
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-error text-error' : 'text-white'}`} />
        </Button>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
          <Badge className="mb-3 tag-badge bg-white/20 backdrop-blur-md text-white border-0">{place.category}</Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-2">{place.title}</h1>
          <div className="flex items-center gap-4 text-white/90">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-warning text-warning" />
              <span className="font-bold">{place.rating.toFixed(1)}</span>
              <span className="text-sm">({place.totalRatings} avaliações)</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{place.location.address}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <section className="fun-card p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Sobre</h2>
              <div className="prose prose-lg" dangerouslySetInnerHTML={{ __html: place.description }} />
            </section>
            
            {photos.length > 0 && (
              <section className="fun-card p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-4">Galeria</h2>
                <PhotoAlbum
                  layout="rows"
                  photos={photos}
                  onClick={({ index }) => setLightboxIndex(index)}
                />
                <Lightbox
                  open={lightboxIndex >= 0}
                  close={() => setLightboxIndex(-1)}
                  index={lightboxIndex}
                  slides={photos}
                />
              </section>
            )}
            
            <section className="fun-card p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">Avaliações</h2>
              
              <form onSubmit={handleSubmitReview} className="mb-8 p-5 bg-white/50 rounded-2xl">
                <h3 className="font-semibold mb-3">Deixe sua avaliação</h3>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((star) => (
                    <button type="button" key={star} onClick={() => setUserRating(star)}>
                      <Star className={`w-7 h-7 ${star <= userRating ? 'fill-warning text-warning' : 'text-text-soft'}`} />
                    </button>
                  ))}
                </div>
                <Textarea placeholder="Compartilhe sua experiência..." value={comment} onChange={(e) => setComment(e.target.value)} className="mb-3" />
                <Button type="submit" className="btn-pop">Enviar avaliação</Button>
              </form>
              
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-white/40 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                          {review.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{review.userName}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-warning text-warning' : 'text-text-soft'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-text-soft">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </section>
          </div>
          
          <div className="space-y-6">
            <div className="fun-card p-6">
              <h3 className="text-xl font-bold mb-4">Informações</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{place.openingHours}</p>
                    <p className="text-sm text-text-soft">{place.openingDays}</p>
                  </div>
                </div>
                {place.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <a href={`tel:${place.phone}`} className="hover:text-primary">{place.phone}</a>
                  </div>
                )}
                {place.whatsapp && (
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <a href={`https://wa.me/${place.whatsapp}`} target="_blank" className="hover:text-primary">WhatsApp</a>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 mt-6">
                {place.socialMedia.instagram && (
                  <a href={place.socialMedia.instagram} target="_blank" className="p-2 rounded-full bg-white/50 hover:bg-primary/20">
                    <span className="font-bold">IG</span>
                  </a>
                )}
                {place.socialMedia.facebook && (
                  <a href={place.socialMedia.facebook} target="_blank" className="p-2 rounded-full bg-white/50 hover:bg-primary/20">
                    <span className="font-bold">FB</span>
                  </a>
                )}
                {place.socialMedia.website && (
                  <a href={place.socialMedia.website} target="_blank" className="p-2 rounded-full bg-white/50 hover:bg-primary/20">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
            
            <div className="fun-card p-6">
              <h3 className="text-xl font-bold mb-4">Localização</h3>
              <div className="h-64 rounded-xl overflow-hidden">
                <MapView places={[place]} center={[place.location.lat, place.location.lng]} />
              </div>
              <p className="mt-3 text-sm text-text-soft">{place.location.address}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
