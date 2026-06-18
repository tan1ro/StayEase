import {
  ArrowUpDown,
  Bell,
  Camera,
  Car,
  Coffee,
  Droplet,
  DoorOpen,
  Droplets,
  Dumbbell,
  GlassWater,
  GraduationCap,
  HandCoins,
  Heater,
  Hotel,
  Key,
  LandPlot,
  Laptop,
  Leaf,
  Lock,
  Mic,
  Microwave,
  Mountain,
  Music,
  PawPrint,
  Phone,
  PlugZap,
  Printer,
  Refrigerator,
  ShieldAlert,
  ShowerHead,
  Soup,
  Sparkles,
  Ticket,
  Train,
  Shield,
  Shirt,
  Signal,
  Snowflake,
  Speaker,
  Sun,
  Tv2,
  Thermometer,
  Timer,
  TreePine,
  Tv,
  Utensils,
  UtensilsCrossed,
  Vegan,
  Video,
  Waves,
  Wifi,
  Wind,
  Zap,
} from 'lucide-react';
import { Icon, ICON } from './ui/Icon';
import { findAmenityCategory } from '../constants/amenities';

function Svg({ size = 18, children, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

// Custom SVG set for the Host “Guest favourites / Standout / Safety” list.
// These render before Lucide mappings so the UI has consistent, branded icons.
function getCustomAmenitySvg(name, size) {
  switch (String(name || '').trim()) {
    // Guest favourites
    case 'Wifi':
    case 'WiFi':
    case 'Free Wi-Fi':
    case 'High-speed Wi-Fi':
    case 'Premium Wi-Fi':
      return (
        <Svg size={size} title={name}>
          <path d="M5 10.5c4.7-4.2 9.3-4.2 14 0" />
          <path d="M7.6 13c3.1-2.7 5.7-2.7 8.8 0" />
          <path d="M10.2 15.6c1.6-1.3 2-1.3 3.6 0" />
          <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
        </Svg>
      );
    case 'TV':
    case 'Smart TV':
    case 'Cable TV':
      return (
        <Svg size={size} title={name}>
          <rect x="4" y="6" width="16" height="10" rx="2" />
          <path d="M8 20h8" />
          <path d="M10 16v4" />
          <path d="M14 16v4" />
        </Svg>
      );
    case 'Kitchen':
    case 'Full kitchen':
    case 'Kitchenette':
      return (
        <Svg size={size} title={name}>
          <path d="M7 3v18" />
          <path d="M7 7h4" />
          <path d="M11 3v4" />
          <path d="M16 3v8" />
          <path d="M14 11h4" />
          <path d="M14 21h4" />
          <path d="M14 14h4" />
        </Svg>
      );
    case 'Washing machine':
    case 'Washer':
      return (
        <Svg size={size} title={name}>
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <circle cx="12" cy="13" r="3.5" />
          <path d="M8 7h.01" />
          <path d="M11 7h.01" />
        </Svg>
      );
    case 'Free parking on premises':
    case 'Free parking':
    case 'Paid parking on premises':
    case 'Paid parking':
    case 'Parking':
      return (
        <Svg size={size} title={name}>
          <path d="M7 20V4h6a4 4 0 0 1 0 8H7" />
          <path d="M14 12h3" />
        </Svg>
      );
    case 'Air conditioning':
    case 'AC':
    case 'Central AC':
    case 'Portable AC':
      return (
        <Svg size={size} title={name}>
          <path d="M4 7h16" />
          <path d="M4 11h16" />
          <path d="M4 15h16" />
          <path d="M8 18c0 1.5 1 2.5 2.5 2.5S13 19.5 13 18" />
          <path d="M16 18c0 1.5 1 2.5 2.5 2.5" />
        </Svg>
      );
    case 'Dedicated workspace':
      return (
        <Svg size={size} title={name}>
          <path d="M4.5 8h15" />
          <path d="M7 8v10" />
          <path d="M17 8v10" />
          <path d="M6 12h12" />
          <path d="M9 18v2" />
          <path d="M15 18v2" />
        </Svg>
      );

    // Standout amenities
    case 'Pool':
    case 'Indoor pool':
    case 'Outdoor pool':
    case 'Infinity pool':
      return (
        <Svg size={size} title={name}>
          <path d="M4 18c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 8 0" />
          <path d="M6 14c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 8 0" />
          <path d="M4 10h6" />
          <path d="M6 10V6a2 2 0 0 1 4 0v4" />
        </Svg>
      );
    case 'Hot tub':
    case 'Jacuzzi':
    case 'Jacuzzi tub':
      return (
        <Svg size={size} title={name}>
          <path d="M6 12h12a2 2 0 0 1 2 2v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4z" />
          <path d="M8 10c0-2 2-2 2-4" />
          <path d="M12 10c0-2 2-2 2-4" />
          <path d="M16 10c0-2 2-2 2-4" />
        </Svg>
      );
    case 'Patio':
    case 'Private patio':
      return (
        <Svg size={size} title={name}>
          <path d="M4 20h16" />
          <path d="M6 20V6h12v14" />
          <path d="M9 10h6" />
          <path d="M9 14h6" />
        </Svg>
      );
    case 'BBQ grill':
    case 'BBQ facilities':
      return (
        <Svg size={size} title={name}>
          <path d="M6 11h12" />
          <path d="M7 11l-2 6h14l-2-6" />
          <path d="M10 17v3" />
          <path d="M14 17v3" />
          <path d="M9 7c0-1.5 1-2.5 2.5-3" />
          <path d="M15 7c0-1.5-1-2.5-2.5-3" />
        </Svg>
      );
    case 'Outdoor dining area':
      return (
        <Svg size={size} title={name}>
          <path d="M7 7h10" />
          <path d="M6 10h12" />
          <path d="M8 10v10" />
          <path d="M16 10v10" />
          <path d="M6 20h12" />
        </Svg>
      );
    case 'Fire pit':
    case 'Firepit':
      return (
        <Svg size={size} title={name}>
          <path d="M12 3c2.2 2 3.5 4 3.5 6.2A3.5 3.5 0 0 1 12 13a3.5 3.5 0 0 1-3.5-3.8C8.5 7 9.8 5 12 3z" />
          <path d="M6 21h12" />
          <path d="M8 17h8" />
        </Svg>
      );
    case 'Pool table':
    case 'Billiards':
      return (
        <Svg size={size} title={name}>
          <rect x="4" y="7" width="16" height="8" rx="2" />
          <path d="M6 15l-1.2 6" />
          <path d="M18 15l1.2 6" />
          <circle cx="9" cy="11" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="15" cy="11" r="0.9" fill="currentColor" stroke="none" />
        </Svg>
      );
    case 'Indoor fireplace':
      return (
        <Svg size={size} title={name}>
          <path d="M7 21V6h10v15" />
          <path d="M10.5 17c-1.5-1.4-1.6-3.1-.2-4.6 1.1-1.2 1.2-2.1 1.2-3.4 1.8 1.6 2.7 3.2 2.7 5a3 3 0 0 1-3.1 3z" />
        </Svg>
      );
    case 'Piano':
      return (
        <Svg size={size} title={name}>
          <rect x="5" y="6" width="14" height="12" rx="2" />
          <path d="M8 6v12" />
          <path d="M11 6v12" />
          <path d="M14 6v12" />
          <path d="M17 6v12" />
        </Svg>
      );
    case 'Exercise equipment':
    case 'Gym':
    case 'Fitness center':
      return (
        <Svg size={size} title={name}>
          <path d="M6 10v4" />
          <path d="M18 10v4" />
          <path d="M8 9h8" />
          <path d="M8 15h8" />
          <path d="M10 7v10" />
          <path d="M14 7v10" />
        </Svg>
      );
    case 'Lake access':
    case 'Beach access':
    case 'Beachfront':
      return (
        <Svg size={size} title={name}>
          <path d="M4 18c2 1.4 4 1.4 6 0s4-1.4 6 0 4 1.4 8 0" />
          <path d="M6 10c2-3 6-3 8 0" />
          <path d="M16 6c2.2 1 3.5 2.8 4 5" />
        </Svg>
      );
    case 'Ski-in/ski-out':
    case 'Ski-in/out':
      return (
        <Svg size={size} title={name}>
          <path d="M7 4l10 10" />
          <path d="M9 12l-2 8" />
          <path d="M15 12l2 8" />
          <path d="M4 20c4 2 12 2 16 0" />
        </Svg>
      );
    case 'Outdoor shower':
      return (
        <Svg size={size} title={name}>
          <path d="M7 6a5 5 0 0 1 10 0v2" />
          <path d="M17 8H9v12" />
          <path d="M13 12h.01" />
          <path d="M15 14h.01" />
          <path d="M11 14h.01" />
        </Svg>
      );

    // Safety items
    case 'Smoke alarm':
    case 'Smoke detectors':
      return (
        <Svg size={size} title={name}>
          <circle cx="12" cy="12" r="6.5" />
          <path d="M9 12h6" />
          <path d="M12 9v6" />
          <path d="M8 18c-1.5 1-2 2-2 3" />
          <path d="M16 18c1.5 1 2 2 2 3" />
        </Svg>
      );
    case 'First aid kit':
      return (
        <Svg size={size} title={name}>
          <rect x="5" y="7" width="14" height="12" rx="2" />
          <path d="M9 7V6a3 3 0 0 1 6 0v1" />
          <path d="M12 11v4" />
          <path d="M10 13h4" />
        </Svg>
      );
    case 'Fire extinguisher':
    case 'Fire extinguishers':
      return (
        <Svg size={size} title={name}>
          <path d="M10 3h4" />
          <path d="M12 3v3" />
          <path d="M9 6h6" />
          <path d="M10 6v15h4V6" />
          <path d="M14 10h2" />
        </Svg>
      );
    case 'Carbon monoxide alarm':
      return (
        <Svg size={size} title={name}>
          <circle cx="12" cy="12" r="7" />
          <path d="M9 12a3 3 0 0 0 6 0" />
          <path d="M9.5 10.5h.01" />
          <path d="M14.5 10.5h.01" />
          <path d="M8 19c.8 1 2.4 2 4 2" />
        </Svg>
      );
    default:
      return null;
  }
}

const AMENITY_MAP = {
  Wifi: Wifi,
  WiFi: Wifi,
  'Free Wi-Fi': Wifi,
  'High-speed Wi-Fi': Wifi,
  'Premium Wi-Fi': Wifi,
  'Wired internet': Signal,
  'Ethernet connection': Signal,
  'Business internet access': Signal,
  AC: Wind,
  'Air conditioning': Wind,
  'Central AC': Wind,
  'Portable AC': Wind,
  Heating: Heater,
  'Central heating': Heater,
  'Ceiling fan': Wind,
  'Radiant heating': Heater,
  'Heated floors': Heater,
  'Portable heater': Heater,
  TV: Tv,
  'Smart TV': Tv,
  'Cable TV': Tv,
  'Streaming services': Tv2,
  Netflix: Tv2,
  'Disney+': Tv2,
  'Amazon Prime Video': Tv2,
  Parking: Car,
  'Free parking': Car,
  'Valet parking': Car,
  'Paid parking': Car,
  Garage: Car,
  'Private parking': Car,
  'Accessible parking': Car,
  Kitchen: UtensilsCrossed,
  Kitchenette: UtensilsCrossed,
  'Full kitchen': UtensilsCrossed,
  Jacuzzi: Droplets,
  'Jacuzzi tub': Droplets,
  'Hot tub': Droplets,
  Pool: Waves,
  'Indoor pool': Waves,
  'Outdoor pool': Waves,
  'Private pool': Waves,
  'Private Pool': Waves,
  'Infinity pool': Waves,
  'Shared pool': Waves,
  "Children's pool": Waves,
  'Beach access': Waves,
  Beachfront: Waves,
  'Private beach': Waves,
  'Beach essentials': Waves,
  'Sun loungers': Sun,
  'Pool cabanas': Sun,
  Gym: Dumbbell,
  'Fitness center': Dumbbell,
  'Shared gym': Dumbbell,
  'Private gym': Dumbbell,
  'Yoga studio': Dumbbell,
  'Personal trainer': Dumbbell,
  Balcony: DoorOpen,
  Terrace: DoorOpen,
  'Private patio': DoorOpen,
  'Connecting rooms': DoorOpen,
  Minibar: GlassWater,
  'Mini Bar': GlassWater,
  'Mini fridge': Refrigerator,
  Refrigerator: Refrigerator,
  Microwave: Microwave,
  Freezer: Refrigerator,
  Oven: Utensils,
  Stove: Utensils,
  'Gas stove': Utensils,
  'Electric stove': PlugZap,
  Dishwasher: PlugZap,
  Toaster: PlugZap,
  Blender: PlugZap,
  'Rice maker': PlugZap,
  Kettle: PlugZap,
  'Electric kettle': PlugZap,
  'Coffee maker': Coffee,
  'Tea maker': Coffee,
  Restaurant: UtensilsCrossed,
  'Coffee shop': Coffee,
  Café: Coffee,
  Bar: Coffee,
  Lounge: Coffee,
  'Rooftop bar': Coffee,
  'Poolside bar': Coffee,
  Breakfast: Coffee,
  'Complimentary breakfast': Coffee,
  'Breakfast included': Coffee,
  'Buffet breakfast': Soup,
  'Continental breakfast': Soup,
  'Vegan options': Vegan,
  'Vegetarian options': Vegan,
  'Ocean view': Waves,
  'Garden view': TreePine,
  'Mountain view': Mountain,
  'Hill view': Mountain,
  'City view': LandPlot,
  'City skyline view': LandPlot,
  'Pool view': Waves,
  Waterfront: Waves,
  'Lake access': Waves,
  Laundry: Shirt,
  'Laundry service': Shirt,
  'Washing machine': Shirt,
  Washer: Shirt,
  Dryer: Shirt,
  'Dry cleaning': Shirt,
  'Self-service laundry': Shirt,
  'Laundry facilities': Shirt,
  'Express laundry': Shirt,
  'Turndown service': Shirt,
  Iron: Shirt,
  'Ironing board': Shirt,
  'Iron and ironing board': Shirt,
  'Bed linen': Shirt,
  'Bed sheets': Shirt,
  Hangers: Shirt,
  'King bed': Hotel,
  'Queen bed': Hotel,
  'Twin beds': Hotel,
  'Sofa bed': Hotel,
  Crib: Hotel,
  'Crib available': Hotel,
  'Travel crib': Hotel,
  'Rollaway bed': Hotel,
  'Room-darkening blinds': DoorOpen,
  'Room-darkening shades': DoorOpen,
  'Blackout curtains': DoorOpen,
  'Soundproof rooms': Speaker,
  'In-room safe': Lock,
  Safe: Lock,
  Shampoo: GlassWater,
  'Shower gel': GlassWater,
  Conditioner: GlassWater,
  'Body soap': GlassWater,
  Soap: GlassWater,
  'Toilet paper': GlassWater,
  Towels: GlassWater,
  'Towels provided': GlassWater,
  'Makeup mirror': Sparkles,
  Bidet: Droplets,
  'Hair dryer': Wind,
  Bathrobe: Shirt,
  Slippers: Shirt,
  'Rain shower': ShowerHead,
  Shower: ShowerHead,
  'Walk-in shower': ShowerHead,
  'Roll-in shower': ShowerHead,
  'Roll-in showers': ShowerHead,
  'Shower chair': ShowerHead,
  Bathtub: Droplet,
  'Outdoor shower': ShowerHead,
  'Hot Water': Thermometer,
  'Hot water': Thermometer,
  'Cleaning products': Sparkles,
  CCTV: Camera,
  'Security cameras': Camera,
  'Security guard': Shield,
  'Security Guard': Shield,
  'Carbon monoxide alarm': Shield,
  'Smoke alarm': ShieldAlert,
  'Smoke detectors': ShieldAlert,
  'Fire extinguisher': ShieldAlert,
  'Fire extinguishers': ShieldAlert,
  'First aid kit': ShieldAlert,
  '24-hour security': Shield,
  Lift: ArrowUpDown,
  'Elevator/lift': ArrowUpDown,
  'Room Service': Bell,
  'Room service': Bell,
  '24-hour room service': Bell,
  Spa: Droplets,
  Sauna: Thermometer,
  'Steam room': Thermometer,
  'Massage services': Droplets,
  'Beauty salon': Sparkles,
  'Wellness center': Droplets,
  'Meditation room': Sparkles,
  'Power Backup': Zap,
  'EV charger': Zap,
  'EV charging station': Zap,
  'Pets allowed': TreePine,
  'Pet friendly': TreePine,
  'Dog-friendly': PawPrint,
  'Cat-friendly': PawPrint,
  'Pet sitting': PawPrint,
  'Pet grooming': PawPrint,
  'Pet beds': PawPrint,
  'Pet bowls': PawPrint,
  'Recycling program': Leaf,
  'Solar power': Sun,
  'Water-saving systems': Droplet,
  'Electric vehicle charging': Zap,
  'Plastic-free toiletries': Leaf,
  'Green certification': Leaf,
  'Energy-efficient lighting': Zap,
  'Airport shuttle': Train,
  'Free airport shuttle': Train,
  'Airport transfer': Train,
  'Airport Transfer': Train,
  'Train station shuttle': Train,
  'Taxi service': Car,
  Shuttle: Car,
  'Car rental': Car,
  'Bicycle rental': Car,
  'Scooter rental': Car,
  '24-hour front desk': Bell,
  Concierge: Bell,
  'Express check-in': Timer,
  'Express check-out': Timer,
  'Mobile check-in': Phone,
  'Self check-in': Key,
  'Self check-in kiosk': Key,
  'Keypad entry': Key,
  'Smart lock': Lock,
  'Luggage storage': DoorOpen,
  Lockers: Lock,
  'Currency exchange': HandCoins,
  'Tour desk': Ticket,
  'Ticket service': Ticket,
  'Multilingual staff': Mic,
  'Wake-up service': Bell,
  'Building staff': Bell,
  'Host greets you': Bell,
  'Business center': Laptop,
  'Business Centre': Laptop,
  'Meeting rooms': Video,
  'Conference hall': Video,
  'Banquet hall': Utensils,
  'Co-working space': Laptop,
  'Audio/visual equipment': Speaker,
  'Fax services': Printer,
  'Secretarial services': GraduationCap,
  Printer: Printer,
  Desk: Laptop,
  'Work desk': Laptop,
  'Work Desk': Laptop,
  'Office chair': Laptop,
  'Ergonomic chair': Laptop,
  'Dedicated workspace': Laptop,
  'Laptop-friendly workspace': Laptop,
  'Printing services': Printer,
  'Public computer station': Laptop,
  'Accessibility features': ArrowUpDown,
  'Wheelchair accessible': ArrowUpDown,
  'Accessible rooms': ArrowUpDown,
  'Accessible bathrooms': ArrowUpDown,
  'Braille signage': ArrowUpDown,
  'Hearing-accessible rooms': ArrowUpDown,
  'Visual alarms': ShieldAlert,
  'Step-free entrance': DoorOpen,
  'Wide doorway': DoorOpen,
  'Grab bars': Shield,
  'Accessible-height toilet': ArrowUpDown,
  'Accessible-height bed': ArrowUpDown,
  'Lit path to entrance': Sun,
  Backyard: TreePine,
  Garden: TreePine,
  'Outdoor furniture': TreePine,
  'Outdoor dining area': TreePine,
  Hammock: TreePine,
  'Fire pit': Thermometer,
  'Rooftop deck': Mountain,
  'Game room': Music,
  'Pool table': Music,
  Billiards: Music,
  'Table tennis': Music,
  'Ping pong table': Music,
  Bowling: Music,
  Karaoke: Mic,
  Nightclub: Music,
  Casino: Sparkles,
  'Cinema/theater': Video,
  'Home theater': Video,
  'Game console': Video,
  Books: GraduationCap,
  'Board games': GraduationCap,
  Piano: Music,
  'Sound system': Speaker,
  Projector: Video,
  'DVD player': Video,
  'Kids club': Sparkles,
  "Children's playground": TreePine,
  Babysitting: Bell,
  'Childcare services': Bell,
  "Children's activities": Sparkles,
  "Children's meals": Utensils,
  'High chair': Utensils,
  "Children's dinnerware": Utensils,
  'Changing table': Sparkles,
  'Baby bath': Droplets,
  'Baby monitor': Camera,
  'Outlet covers': Shield,
  'Fireplace guards': Shield,
  'Window guards': Shield,
  'Stair gates': Shield,
  'Private villas': Hotel,
  Helipad: Sparkles,
  'Helicopter transfer': Sparkles,
  'Yacht access': Waves,
  'Wine cellar': Sparkles,
  'Cigar lounge': Sparkles,
  'Executive lounge': Sparkles,
  'Club lounge access': Sparkles,
  'Lounge Access': Sparkles,
  'VIP services': Sparkles,
  'Guided tours': Ticket,
  'Nature Trails': TreePine,
  Hiking: Mountain,
  Cycling: Car,
  Snorkeling: Waves,
  'Snorkeling gear': Waves,
  'Scuba diving': Waves,
  Fishing: Waves,
  'Horse riding': TreePine,
  Skiing: Snowflake,
  Snowboarding: Snowflake,
  Surfing: Waves,
  'Surfboards': Waves,
  Kayaking: Waves,
  Kayaks: Waves,
  Canoes: Waves,
  'Paddle boards': Waves,
  'Jet skis': Waves,
  'Cooking classes': UtensilsCrossed,
  'Cultural experiences': Sparkles,
  'Wine tasting': Sparkles,
  'Coffee Tasting': Coffee,
  'Plantation Walk': TreePine,
  Bonfire: Thermometer,
  Campfire: Thermometer,
};

const CATEGORY_ICON_MAP = {
  'Internet & Connectivity': Wifi,
  'Room Amenities': Hotel,
  'Bathroom Amenities': ShowerHead,
  Essentials: Sparkles,
  'Bedroom & Laundry': Shirt,
  'Food & Beverage': UtensilsCrossed,
  Entertainment: Video,
  'Wellness & Fitness': Dumbbell,
  'Pool & Recreation': Waves,
  'Family-Friendly Amenities': Sparkles,
  'Business Amenities': Laptop,
  Transportation: Car,
  'Heating & Cooling': Thermometer,
  Outdoor: TreePine,
  'Location Features': Mountain,
  Accessibility: ArrowUpDown,
  'Front Desk & Guest Services': Bell,
  'Security & Safety': Shield,
  'Pet-Friendly Amenities': PawPrint,
  'Sustainability Features': Leaf,
  'Resort & Luxury Amenities': Sparkles,
  'Activities & Experiences': Ticket,
  Other: Wifi,
};

function normalizeAmenityName(name) {
  return String(name || '').trim();
}

function iconFromKeywords(raw) {
  const name = raw.toLowerCase();
  if (!name) return null;

  // Internet / work
  if (name.includes('wifi') || name.includes('wi-fi')) return Wifi;
  if (name.includes('ethernet') || name.includes('wired internet')) return Signal;
  if (name.includes('workspace') || name.includes('desk') || name.includes('printer') || name.includes('computer')) return Laptop;

  // Room comfort
  if (name.includes('ac') || name.includes('air conditioning') || name.includes('fan')) return Wind;
  if (name.includes('heat') || name.includes('heater')) return Heater;
  if (name.includes('soundproof') || name.includes('sound system') || name.includes('speaker')) return Speaker;

  // Views / outdoors
  if (name.includes('ocean') || name.includes('sea') || name.includes('lake') || name.includes('waterfront')) return Waves;
  if (name.includes('mountain') || name.includes('hill')) return Mountain;
  if (name.includes('garden') || name.includes('backyard') || name.includes('trail')) return TreePine;

  // Food
  if (name.includes('breakfast') || name.includes('coffee') || name.includes('café') || name.includes('cafe')) return Coffee;
  if (name.includes('restaurant') || name.includes('kitchen') || name.includes('bbq') || name.includes('dining')) return UtensilsCrossed;

  // Bath / toiletries
  if (name.includes('shower') || name.includes('bath')) return ShowerHead;
  if (name.includes('soap') || name.includes('shampoo') || name.includes('toilet paper') || name.includes('towel')) return GlassWater;

  // Safety / access
  if (name.includes('cctv') || name.includes('camera')) return Camera;
  if (name.includes('alarm') || name.includes('extinguisher') || name.includes('first aid')) return ShieldAlert;
  if (name.includes('lock') || name.includes('key') || name.includes('keypad')) return Lock;

  // Transport
  if (name.includes('parking') || name.includes('taxi') || name.includes('car')) return Car;
  if (name.includes('shuttle') || name.includes('train')) return Train;
  if (name.includes('ev') || name.includes('charger') || name.includes('charging')) return Zap;

  // Pets
  if (name.includes('pet') || name.includes('dog') || name.includes('cat')) return PawPrint;

  // Fitness
  if (name.includes('gym') || name.includes('fitness') || name.includes('yoga')) return Dumbbell;
  if (name.includes('spa') || name.includes('massage') || name.includes('wellness')) return Droplets;

  // Entertainment
  if (name.includes('tv') || name.includes('netflix') || name.includes('disney') || name.includes('prime video')) return Tv2;
  if (name.includes('karaoke') || name.includes('piano') || name.includes('music')) return Music;

  return null;
}

export function getAmenityIcon(name) {
  const normalized = normalizeAmenityName(name);
  if (AMENITY_MAP[normalized]) return AMENITY_MAP[normalized];

  const keyword = iconFromKeywords(normalized);
  if (keyword) return keyword;

  const category = findAmenityCategory(normalized);
  return CATEGORY_ICON_MAP[category] || Wifi;
}

export default function AmenityIcon({ name, size = ICON.sm, showLabel = false }) {
  const custom = getCustomAmenitySvg(name, typeof size === 'number' ? size : 18);
  const AmenityLucideIcon = custom ? null : getAmenityIcon(name);

  return (
    <span className="amenity-icon">
      {custom || <Icon icon={AmenityLucideIcon} size={size} />}
      {showLabel && <span>{name}</span>}
    </span>
  );
}

export const AMENITY_LIST = Object.keys(AMENITY_MAP);
