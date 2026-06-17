import {
  ArrowUpDown,
  Bell,
  Camera,
  Car,
  Coffee,
  DoorOpen,
  Droplets,
  Dumbbell,
  GlassWater,
  Shield,
  Shirt,
  Thermometer,
  TreePine,
  Mountain,
  Tv,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
  Zap,
} from 'lucide-react';
import { Icon, ICON } from './ui/Icon';

const AMENITY_MAP = {
  Wifi: Wifi,
  WiFi: Wifi,
  'Free Wi-Fi': Wifi,
  'High-speed Wi-Fi': Wifi,
  'Premium Wi-Fi': Wifi,
  AC: Wind,
  'Air conditioning': Wind,
  TV: Tv,
  'Smart TV': Tv,
  'Cable TV': Tv,
  Parking: Car,
  'Free parking': Car,
  'Valet parking': Car,
  Kitchen: UtensilsCrossed,
  Kitchenette: UtensilsCrossed,
  'Full kitchen': UtensilsCrossed,
  Jacuzzi: Droplets,
  'Jacuzzi tub': Droplets,
  Pool: Waves,
  'Indoor pool': Waves,
  'Outdoor pool': Waves,
  'Private pool': Waves,
  'Private Pool': Waves,
  'Beach access': Waves,
  Beachfront: Waves,
  Gym: Dumbbell,
  'Fitness center': Dumbbell,
  Balcony: DoorOpen,
  Terrace: DoorOpen,
  Minibar: GlassWater,
  'Mini Bar': GlassWater,
  'Sea View': Waves,
  'Sea view': Waves,
  'Ocean view': Waves,
  'Garden View': TreePine,
  'Garden view': TreePine,
  'Mountain view': Mountain,
  Laundry: Shirt,
  'Laundry service': Shirt,
  'Washing machine': Shirt,
  Washer: Shirt,
  Iron: Shirt,
  'Bed linen': Shirt,
  'Bed sheets': Shirt,
  Hangers: Shirt,
  'Room-darkening blinds': DoorOpen,
  'Room-darkening shades': DoorOpen,
  Shampoo: GlassWater,
  'Shower gel': GlassWater,
  Bidet: Droplets,
  'Hair Dryer': Wind,
  'Hair dryer': Wind,
  'Hot Water': Thermometer,
  'Hot water': Thermometer,
  CCTV: Camera,
  'Security cameras': Camera,
  'Security Guard': Shield,
  'Carbon monoxide alarm': Shield,
  '24-hour security': Shield,
  Lift: ArrowUpDown,
  'Elevator/lift': ArrowUpDown,
  'Room Service': Bell,
  'Room service': Bell,
  '24-hour room service': Bell,
  Breakfast: Coffee,
  'Complimentary breakfast': Coffee,
  Restaurant: UtensilsCrossed,
  Bar: Coffee,
  Spa: Droplets,
  Sauna: Thermometer,
  'Power Backup': Zap,
  'EV charger': Zap,
  'EV charging station': Zap,
  'Pets allowed': TreePine,
  'Pet friendly': TreePine,
};

export function getAmenityIcon(name) {
  return AMENITY_MAP[name] || Wifi;
}

export default function AmenityIcon({ name, size = ICON.sm, showLabel = false }) {
  const AmenityLucideIcon = getAmenityIcon(name);

  return (
    <span className="amenity-icon">
      <Icon icon={AmenityLucideIcon} size={size} />
      {showLabel && <span>{name}</span>}
    </span>
  );
}

export const AMENITY_LIST = Object.keys(AMENITY_MAP);
