// lib/types.ts
import { Timestamp } from 'firebase/firestore';

export interface Place {
  id?: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  rating: number;
  totalRatings: number;
  price: number; // 1 a 4
  imageUrl: string;
  gallery: string[];
  openingHours: string;
  openingDays: string;
  phone: string;
  whatsapp: string;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  tags: string[];
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
  published: boolean;
  featured: boolean;
}

export interface Review {
  id?: string;
  placeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin' | 'editor';
  favorites: string[];
  createdAt: Timestamp | any;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  }
