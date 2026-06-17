import {
  Bed,
  BedDouble,
  BedSingle,
  Building2,
  Home,
  Hotel,
  Users,
} from 'lucide-react';

export const ROOM_CATEGORIES = [
  { value: 'Single', label: 'Single', icon: BedSingle },
  { value: 'Double', label: 'Double', icon: BedDouble },
  { value: 'Triple', label: 'Triple', icon: Bed },
  { value: 'Suite', label: 'Suite', icon: Building2 },
  { value: 'Villa', label: 'Villa', icon: Home },
  { value: 'Homestay', label: 'Homestay', icon: Hotel },
  { value: 'Dormitory', label: 'Dormitory', icon: Users },
];
