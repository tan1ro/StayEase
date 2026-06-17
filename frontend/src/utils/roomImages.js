// Verified working hotel/stay images (Unsplash CDN).
export const ROOM_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop',
];

function hashKey(key = '') {
  return [...String(key)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

export function getRoomFallbackImage(seed = 'room', index = 0) {
  const base = hashKey(seed);
  return ROOM_IMAGE_POOL[(base + index) % ROOM_IMAGE_POOL.length];
}

export function getPrimaryRoomImage(room) {
  const photos = room?.photos || [];
  const sorted = [...photos].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  const id = room?._id || room?.id || 'room';
  return sorted[0]?.url || getRoomFallbackImage(id, 0);
}

export function getRoomGalleryImages(photos = [], roomId = 'room', count = 5) {
  const sorted = [...photos].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  const images = sorted.filter((p) => p?.url).slice(0, count);
  while (images.length < count) {
    images.push({
      url: getRoomFallbackImage(roomId, images.length),
      is_primary: images.length === 0,
    });
  }
  return images;
}

export function getAvatarUrl(name = 'Tourist', id = '') {
  const label = encodeURIComponent(name || 'Tourist');
  return `https://ui-avatars.com/api/?name=${label}&background=1A6BFF&color=fff&size=150&bold=true`;
}
