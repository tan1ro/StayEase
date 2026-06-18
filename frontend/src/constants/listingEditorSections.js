import {
  BadgeIndianRupee,
  BedDouble,
  Camera,
  FileText,
  MapPin,
  Sparkles,
  Type,
  User,
  Users,
} from 'lucide-react';

export const SPACE_SECTIONS = [
  { id: 'photos', label: 'Photo tour', icon: Camera },
  { id: 'title', label: 'Title', icon: Type },
  { id: 'type', label: 'Property type', icon: BedDouble },
  { id: 'pricing', label: 'Pricing', icon: BadgeIndianRupee },
  { id: 'availability', label: 'Availability', icon: FileText },
  { id: 'guests', label: 'Number of guests', icon: Users },
  { id: 'description', label: 'Description', icon: FileText },
  { id: 'amenities', label: 'Amenities', icon: Sparkles },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'host', label: 'About the host', icon: User },
];

export const ARRIVAL_SECTIONS = [
  { id: 'checkin', label: 'Check-in & checkout', icon: FileText, split: true },
  { id: 'directions', label: 'Directions', icon: MapPin },
  { id: 'checkin_method', label: 'Check-in method', icon: FileText },
  { id: 'wifi', label: 'WiFi details', icon: FileText },
  { id: 'manual', label: 'House manual', icon: FileText },
  { id: 'rules', label: 'House rules', icon: FileText },
  { id: 'hospitality', label: 'Indian hospitality', icon: FileText },
  { id: 'checkout', label: 'Checkout instructions', icon: FileText },
  { id: 'guidebook', label: 'Local guidebook', icon: FileText },
  { id: 'interaction', label: 'Interaction preferences', icon: FileText },
  { id: 'safety', label: 'Guest safety', icon: FileText },
];

export const CHECK_IN_METHODS = [
  'Reception desk',
  'Host greets you in person',
  'Smart lock / keypad',
  'Lockbox',
  'Building staff',
  'Other',
];
