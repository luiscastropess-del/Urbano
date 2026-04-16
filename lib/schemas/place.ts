import { z } from 'zod';

export const placeSchema = z.object({
  title: z.string().min(3),
  summary: z.string().max(200),
  description: z.string().min(1),
  category: z.string().min(1),

  price: z.number().min(1).max(4),

  openingHours: z.string().min(1),
  openingDays: z.string().min(1),

  address: z.string().min(5),
  lat: z.number(),
  lng: z.number(),

  phone: z.string().optional(),
  whatsapp: z.string().optional(),

  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),

  tags: z.array(z.string()).default([]),

  published: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export type PlaceInput = z.input<typeof placeSchema>;
export type PlaceOutput = z.output<typeof placeSchema>;
