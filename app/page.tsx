'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, Search, SlidersHorizontal, Star, Clock, Heart, Sparkles, Compass, Filter, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';

import { categories } from '@/lib/data';
import { getPublishedPlaces } from '@/lib/firebase-services';
import { Place } from '@/lib/types';
import { useFavorites } from '@/hooks/use-favorites';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-3xl">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-soft font-medium text-lg">Carregando mapa interativo...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { favorites, toggleFavorite } = useFavorites();
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0.95]);

  // Buscar lugares do Firestore
  useEffect(() => {
    async function loadPlaces() {
      try {
        const data = await getPublishedPlaces();
        setPlaces(data);
      } catch (error) {
        console.error('Erro ao carregar lugares:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPlaces();
  }, []);

  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      if (selectedCategory !== 'Todos' && place.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!place.title.toLowerCase().includes(query) && !place.summary.toLowerCase().includes(query)) return false;
      }
      if (priceFilter !== null && place.price !== priceFilter) return false;
      if (place.rating < minRating) return false;
      if (showFavoritesOnly && !favorites.has(place.id!)) return false;
      return true;
    });
  }, [places, selectedCategory, searchQuery, priceFilter, minRating, showFavoritesOnly, favorites]);

  return (
    <main className="min-h-screen pb-28">
      <motion.div style={{ opacity: headerOpacity }} className="hero-wave">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ rotate: -20, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="bg-white/80 backdrop-blur-xl p-3.5 rounded-2xl shadow-premium"
              >
                <Compass className="w-8 h-8 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Urbano
                  </span>
                </h1>
                <p className="text-text-soft text-sm flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> São Paulo, SP • Explorar
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" className="fun-card rounded-full px-6 py-3 border-0 shadow-lg">
                <Sparkles className="w-5 h-5 mr-2 text-secondary" />
                <span className="font-bold">Surpreenda-me</span>
              </Button>
            </motion.div>
          </div>
          
          <div className="mb-8">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-black leading-tight tracking-tight"
            >
              Olá, Viajante!{' '}
              <motion.span 
                animate={{ rotate: [0, 15, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                className="inline-block origin-bottom-right"
              >
                👋
              </motion.span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-text-soft text-xl mt-3 max-w-2xl"
            >
              Descubra os lugares mais incríveis de São Paulo com um toque de magia.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-3xl"
          >
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-soft">
              <Search className="w-6 h-6" />
            </div>
            <Input
              type="text"
              placeholder="Buscar restaurantes, bares, parques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-16 pr-16 py-8 text-xl fun-card border-0 rounded-full focus:ring-4 focus:ring-primary/30 bg-white/90 shadow-premium"
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/5 hover:bg-black/10 transition"
              >
                <X className="w-5 h-5 text-text-soft" />
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <ScrollArea className="w-full pb-8 -mx-4 px-4">
          <div className="flex gap-3 py-4">
            {categories.map((category) => {
              const isActive = selectedCategory === category.name;
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`category-pill flex items-center gap-3 text-lg whitespace-nowrap ${isActive ? 'active' : 'bg-white/80 hover:bg-white'}`}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-semibold">{category.name}</span>
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>

        <motion.div layout className="flex items-center justify-between my-10">
          <div className="flex items-center gap-4">
            <Badge className="tag-badge text-sm py-2 px-4 font-bold">
              {filteredPlaces.length} {filteredPlaces.length === 1 ? 'lugar' : 'lugares'} encontrados
            </Badge>
            
            <div className="flex fun-card rounded-full p-1.5 border-0 shadow-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`rounded-full px-6 py-2 font-bold transition-all ${viewMode === 'grid' ? 'bg-primary text-white hover:bg-primary-dark' : 'hover:bg-white/60'}`}
              >
                Grid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('map')}
                className={`rounded-full px-6 py-2 font-bold transition-all ${viewMode === 'map' ? 'bg-primary text-white hover:bg-primary-dark' : 'hover:bg-white/60'}`}
              >
                Mapa
              </Button>
            </div>
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger>
              <Button variant="outline" className="fun-card rounded-full px-6 py-3 border-0 font-bold text-base shadow-md">
                <Filter className="w-5 h-5 mr-2" />
                Filtros
                {(priceFilter !== null || minRating > 0 || showFavoritesOnly) && (
                  <motion.span layoutId="filterBadge" className="ml-2 w-3 h-3 bg-primary rounded-full pulse-glow" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[340px] sm:w-[420px] bg-background/90 backdrop-blur-3xl border-l border-white/30 p-6">
              <SheetHeader>
                <SheetTitle className="text-3xl font-black flex items-center gap-3">
                  <SlidersHorizontal className="w-7 h-7 text-primary" />
                  Filtros mágicos ✨
                </SheetTitle>
              </SheetHeader>
              <div className="py-8 space-y-10">
                <div>
                  <label className="text-sm font-bold uppercase tracking-widest text-text-soft mb-4 block">
                    Faixa de preço
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((level) => (
                      <Button
                        key={level}
                        variant={priceFilter === level ? "default" : "outline"}
                        onClick={() => setPriceFilter(priceFilter === level ? null : level)}
                        className={`rounded-full text-xl py-6 ${priceFilter === level ? 'btn-pop' : 'fun-card bg-white/60'}`}
                      >
                        {'💰'.repeat(level)}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-bold uppercase tracking-widest text-text-soft mb-4 block">
                    Nota mínima
                  </label>
                  <div className="flex gap-2">
                    {[0, 3, 3.5, 4, 4.5].map((rating) => (
                      <Button
                        key={rating}
                        variant={minRating === rating ? "default" : "outline"}
                        onClick={() => setMinRating(rating)}
                        className={`flex-1 rounded-full text-base font-bold ${minRating === rating ? 'btn-pop' : 'fun-card bg-white/60'}`}
                      >
                        {rating === 0 ? 'Todas' : `${rating}+`}
                        {rating > 0 && <Star className="w-4 h-4 ml-1 fill-current" />}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`w-full rounded-full py-6 text-lg font-bold ${showFavoritesOnly ? 'btn-pop' : 'fun-card bg-white/60'}`}
                >
                  <Heart className={`w-5 h-5 mr-3 ${showFavoritesOnly ? 'fill-white' : ''}`} />
                  Mostrar apenas favoritos
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-soft text-lg">Carregando lugares incríveis...</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredPlaces.map((place, index) => (
                <motion.div
                  key={place.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.03,
                    type: "spring",
                    damping: 20
                  }}
                  className="fun-card overflow-hidden group cursor-pointer"
                  onClick={() => window.location.href = `/place/${place.id}`}
                >
                  <div className="relative h-56 overflow-hidden">
                    <motion.img
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.6 }}
                      src={place.imageUrl}
                      alt={place.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition" />
                    <div className="absolute top-5 right-5" onClick={(e) => e.stopPropagation()}>
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleFavorite(place.id!)}
                        className="p-3 rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-lg"
                      >
                        <Heart
                          className={`w-6 h-6 transition-all ${favorites.has(place.id!) ? 'fill-error text-error scale-110' : 'text-text'}`}
                        />
                      </motion.button>
                    </div>
                    <div className="absolute top-5 left-5">
                      <Badge className="tag-badge backdrop-blur-xl bg-white/80 border-0 shadow-sm">
                        {place.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-7">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-black tracking-tight">{place.title}</h3>
                      <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm">
                        <Star className="w-5 h-5 fill-warning text-warning" />
                        <span className="text-base font-black">{place.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <p className="text-text-soft text-base mb-6 line-clamp-2 leading-relaxed">{place.summary}</p>
                    
                    <div className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2 text-text-soft">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold">{place.openingHours}</span>
                      </div>
                      <div className="font-black text-primary text-xl">
                        {'💰'.repeat(place.price)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-6">
                      {place.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag-badge text-xs bg-white/60">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredPlaces.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-32 text-center"
              >
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-8xl mb-8"
                >
                  🔎
                </motion.div>
                <h3 className="text-4xl font-black mb-4">Nada encontrado</h3>
                <p className="text-text-soft text-xl mb-10">Que tal ajustar os filtros e tentar novamente?</p>
                <Button
                  onClick={() => {
                    setSelectedCategory('Todos');
                    setSearchQuery('');
                    setPriceFilter(null);
                    setMinRating(0);
                    setShowFavoritesOnly(false);
                  }}
                  className="btn-pop text-xl px-10 py-7"
                >
                  Limpar todos os filtros
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[700px] rounded-3xl overflow-hidden fun-card border-0 shadow-premium"
          >
            <MapView places={filteredPlaces} />
          </motion.div>
        )}
      </div>
    </main>
  );
            }
