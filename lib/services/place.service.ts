import {
  getPlaceById as fbGet,
  updatePlace as fbUpdate,
  createPlace as fbCreate,
} from '@/lib/firebase-services';

export async function getPlaceById(id: string) {
  return fbGet(id);
}

export async function updatePlace(id: string, data: any) {
  return fbUpdate(id, data);
}

export async function createPlace(data: any) {
  return fbCreate(data);
}
