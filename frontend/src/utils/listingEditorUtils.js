import { formatCurrency } from '../api/api';
import { guestPaysPerNightInclGst } from './listingPricePreview';

export const LISTING_TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  const value = `${String(hours).padStart(2, '0')}:${minutes}`;
  const period = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const label = minutes === '00'
    ? `${hour12}:00 ${period}`
    : `${hour12}:30 ${period}`;
  return { value, label };
});

export function formatListingTime(time) {
  if (!time) return '';
  const match = LISTING_TIME_OPTIONS.find((opt) => opt.value === time);
  return match?.label || time;
}

export function truncateText(text, max = 42) {
  if (!text?.trim()) return '';
  const clean = text.trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export function spaceNavSummary(sectionId, room) {
  const photoCount = room?.photos?.length || 0;
  const loc = room?.location || {};
  const locationLine = [loc.area, loc.city, loc.state].filter(Boolean).join(', ');
  const guestNightly = guestPaysPerNightInclGst(room?.price_per_night || 0);
  const amenityPreview = (room?.amenities || []).slice(0, 2).join(' · ');

  switch (sectionId) {
    case 'photos':
      return photoCount
        ? `${photoCount} photo${photoCount !== 1 ? 's' : ''} · ${room.max_guests || 1} guest${room.max_guests !== 1 ? 's' : ''}`
        : 'Add photos';
    case 'title':
      return room?.title || 'Add title';
    case 'type':
      return `${room?.room_category || 'Room'} · ${room?.bed_configuration?.replace(/_/g, ' ') || 'bed'}`;
    case 'pricing':
      return `${formatCurrency(guestNightly)} per night incl. GST`;
    case 'availability':
      return room?.is_available ? 'Open for bookings' : 'Not published yet';
    case 'guests':
      return `${room?.max_guests || 1} guest${room?.max_guests !== 1 ? 's' : ''}`;
    case 'description':
      return room?.description?.trim()
        ? room.description.trim().slice(0, 48) + (room.description.length > 48 ? '…' : '')
        : 'Add details';
    case 'amenities':
      return amenityPreview || 'Add details';
    case 'location':
      return locationLine || 'Add details';
    case 'host':
      return room?.host?.name || 'Your host profile';
    default:
      return 'Add details';
  }
}

export function arrivalGuide(room) {
  return room?.arrival_guide || {};
}

export function arrivalNavSummary(sectionId, room) {
  const guide = arrivalGuide(room);
  const policies = room?.policies || {};

  switch (sectionId) {
    case 'checkin':
      return {
        checkIn: formatListingTime(policies.check_in_time) || 'Add details',
        checkOut: formatListingTime(policies.check_out_time) || 'Add details',
      };
    case 'directions':
      return truncateText(guide.directions) || 'Add details';
    case 'checkin_method':
      return guide.check_in_method || 'Add details';
    case 'wifi':
      return guide.wifi_network ? guide.wifi_network : 'Add details';
    case 'manual':
      return truncateText(guide.house_manual) || 'Add details';
    case 'rules':
      return `Check-in after ${formatListingTime(policies.check_in_time) || '2:00 pm'} · ${room?.max_guests || 1} guest max`;
    case 'hospitality':
      return room?.food_preference === 'veg'
        ? 'Pure veg'
        : room?.food_preference === 'nonveg'
          ? 'Non-veg only'
          : 'Veg & non-veg';
    case 'checkout':
      return truncateText(guide.checkout_instructions) || 'Add details';
    case 'guidebook':
      return truncateText(guide.guidebook) || 'Share local tips with guests';
    case 'interaction':
      return truncateText(guide.interaction_preferences) || 'Add details';
    case 'safety':
      return room?.amenities?.includes('CCTV') ? 'Safety details added' : 'Add details';
    default:
      return 'Add details';
  }
}
