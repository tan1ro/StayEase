import {
  Ban,
  Beef,
  Building,
  Cigarette,
  CigaretteOff,
  DoorOpen,
  Droplets,
  Leaf,
  Mountain,
  TreePine,
  UtensilsCrossed,
  Waves,
  Wine,
} from 'lucide-react';
import Badge from './Badge';
import { Icon, ICON } from './ui/Icon';

const FOOD_CONFIG = {
  veg: { icon: Leaf, label: 'Veg Only' },
  nonveg: { icon: Beef, label: 'Non-Veg' },
  both: { icon: UtensilsCrossed, label: 'Both' },
};

const SMOKING_CONFIG = {
  smoking: { icon: Cigarette, label: 'Smoking' },
  non_smoking: { icon: CigaretteOff, label: 'Non-Smoking' },
};

const ALCOHOL_CONFIG = {
  alcohol: { icon: Wine, label: 'Alcohol' },
  non_alcohol: { icon: Ban, label: 'No Alcohol' },
};

const VIEW_CONFIG = {
  hill_view: { icon: Mountain, label: 'Hill View' },
  beach_view: { icon: Waves, label: 'Beach & Sea View' },
  sea_view: { icon: Waves, label: 'Beach & Sea View' },
  garden_view: { icon: TreePine, label: 'Garden View' },
  city_view: { icon: Building, label: 'City View' },
  pool_view: { icon: Droplets, label: 'Pool View' },
};

export default function RoomBadges({
  food_preference,
  smoking_policy,
  alcohol_policy,
  view_type,
  has_balcony,
  room_category,
  compact = false,
}) {
  const badges = [];

  if (food_preference && FOOD_CONFIG[food_preference]) {
    const cfg = FOOD_CONFIG[food_preference];
    badges.push({ key: 'food', ...cfg });
  }
  if (smoking_policy && SMOKING_CONFIG[smoking_policy]) {
    const cfg = SMOKING_CONFIG[smoking_policy];
    badges.push({ key: 'smoking', ...cfg });
  }
  if (alcohol_policy && ALCOHOL_CONFIG[alcohol_policy]) {
    const cfg = ALCOHOL_CONFIG[alcohol_policy];
    badges.push({ key: 'alcohol', ...cfg });
  }
  if (view_type && view_type !== 'none' && VIEW_CONFIG[view_type]) {
    const cfg = VIEW_CONFIG[view_type];
    badges.push({ key: 'view', ...cfg });
  }
  if (has_balcony) {
    badges.push({ key: 'balcony', icon: DoorOpen, label: 'Balcony' });
  }
  if (room_category && !compact) {
    badges.push({ key: 'category', icon: Building, label: room_category });
  }

  if (!badges.length) return null;

  return (
    <div className={`room-badges ${compact ? 'room-badges--compact' : ''}`}>
      {badges.map(({ key, icon: BadgeIcon, label }) => (
        <Badge key={key}>
          <Icon icon={BadgeIcon} size={ICON.sm} />
          {!compact && label}
        </Badge>
      ))}
    </div>
  );
}
