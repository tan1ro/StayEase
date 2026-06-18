import { Compass, Eye, Hash, Layers, Sunrise, Sunset } from 'lucide-react';
import {
  buildRoomPlacementSummary,
  buildViewHighlight,
  getSunlightTraits,
} from '../constants/roomPlacement';
import { Icon, ICON } from './ui/Icon';

const DETAIL_ICONS = {
  room: Hash,
  floor: Layers,
  facing: Compass,
  view: Eye,
};

const SUNLIGHT_ICONS = {
  sunrise: Sunrise,
  sunset: Sunset,
};

export default function RoomPlacementInfo({ room, compact = false, title = 'Your room' }) {
  const items = buildRoomPlacementSummary(room);
  const highlight = buildViewHighlight(room);
  const { traits } = getSunlightTraits(room?.facing_side);

  if (!items.length && !highlight && !traits.length) return null;

  return (
    <section className={`room-placement${compact ? ' room-placement--compact' : ''}`}>
      <h3 className="room-placement__title">{title}</h3>
      {highlight && (
        <p className="room-placement__highlight">{highlight}</p>
      )}
      {traits.length > 0 && (
        <div className="room-placement__sunlight">
          {traits.map((trait) => {
            const TraitIcon = SUNLIGHT_ICONS[trait.id];
            return (
              <span
                key={trait.id}
                className={`room-placement__sunlight-badge room-placement__sunlight-badge--${trait.id}`}
                title={trait.hint}
              >
                {TraitIcon && <TraitIcon size={14} aria-hidden />}
                {trait.label}
              </span>
            );
          })}
        </div>
      )}
      {items.length > 0 && (
        <ul className="room-placement__grid">
          {items.map(({ key, label, value }) => {
            const DetailIcon = DETAIL_ICONS[key] || Eye;
            return (
              <li key={key} className="room-placement__item">
                <Icon icon={DetailIcon} size={ICON.sm} />
                <div>
                  <span className="room-placement__label">{label}</span>
                  <strong className="room-placement__value">{value}</strong>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
