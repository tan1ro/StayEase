export const ROOM_TAG_CONFIG = {
  best_rated: {
    key: 'best_rated',
    label: 'Best rated',
    className: 'room-card__tag--best-rated',
    priority: 1,
  },
  most_famous: {
    key: 'most_famous',
    label: 'Most famous',
    className: 'room-card__tag--most-famous',
    priority: 2,
  },
  best_selling: {
    key: 'best_selling',
    label: 'Best selling',
    className: 'room-card__tag--best-selling',
    priority: 3,
  },
  guest_favourite: {
    key: 'guest_favourite',
    label: 'Guest favourite',
    className: 'room-card__tag--guest-favourite',
    priority: 4,
    testId: 'tourist-favourite',
  },
  trending: {
    key: 'trending',
    label: 'Trending',
    className: 'room-card__tag--trending',
    priority: 5,
  },
  beachfront: {
    key: 'beachfront',
    label: 'Beachfront',
    className: 'room-card__tag--beachfront',
    priority: 6,
  },
  mountain_view: {
    key: 'mountain_view',
    label: 'Mountain view',
    className: 'room-card__tag--mountain',
    priority: 7,
  },
  great_value: {
    key: 'great_value',
    label: 'Great value',
    className: 'room-card__tag--great-value',
    priority: 8,
  },
  new_listing: {
    key: 'new_listing',
    label: 'New',
    className: 'room-card__tag--new',
    priority: 9,
  },
};

const TAG_PRIORITY = Object.fromEntries(
  Object.values(ROOM_TAG_CONFIG).map((tag) => [tag.key, tag.priority]),
);

function roomKey(room) {
  return room._id || room.id;
}

function addTag(map, room, tagKey) {
  const id = roomKey(room);
  if (!id) return;
  if (!map.has(id)) map.set(id, new Set());
  map.get(id).add(tagKey);
}

function topRooms(rooms, selector, count = 1) {
  const scored = rooms
    .map((room) => ({ room, score: selector(room) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return [];

  const bestScore = scored[0].score;
  const leaders = scored.filter(({ score }) => score === bestScore).map(({ room }) => room);
  if (leaders.length >= count) return leaders.slice(0, count);

  const seen = new Set(leaders.map(roomKey));
  const extras = scored
    .filter(({ room, score }) => !seen.has(roomKey(room)) && score > 0)
    .slice(0, count - leaders.length)
    .map(({ room }) => room);

  return [...leaders, ...extras];
}

/** Compute marketing / context tags for a collection of rooms (city row or search results). */
export function computeRoomTagsForCollection(rooms = []) {
  const map = new Map();
  if (!rooms.length) return map;

  for (const room of topRooms(rooms, (r) => r.avg_rating || 0, 1)) {
    addTag(map, room, 'best_rated');
  }

  for (const room of topRooms(rooms, (r) => r.total_reviews || 0, 1)) {
    addTag(map, room, 'best_selling');
    addTag(map, room, 'most_famous');
  }

  if (rooms.length > 1) {
    const minPrice = Math.min(...rooms.map((r) => r.price_per_night || Infinity));
    rooms
      .filter((r) => r.price_per_night === minPrice)
      .forEach((room) => addTag(map, room, 'great_value'));
  }

  const reviewThreshold = Math.max(...rooms.map((r) => r.total_reviews || 0), 0);
  if (reviewThreshold >= 20) {
    for (const room of topRooms(rooms, (r) => (r.total_reviews || 0) + (r.avg_rating || 0), 2)) {
      addTag(map, room, 'trending');
    }
  }

  for (const room of rooms) {
    if (room.avg_rating >= 4.85 && room.total_reviews >= 10) {
      addTag(map, room, 'guest_favourite');
    }
    if (room.view_type === 'beach_view' || room.view_type === 'sea_view') {
      addTag(map, room, 'beachfront');
    }
    if (room.view_type === 'hill_view') {
      addTag(map, room, 'mountain_view');
    }
    if (room.total_reviews <= 2 && room.avg_rating === 0) {
      addTag(map, room, 'new_listing');
    }
  }

  return map;
}

export function getTagsForRoom(tagMap, room, maxTags = 2) {
  const id = roomKey(room);
  const keys = [...(tagMap.get(id) || [])];
  keys.sort((a, b) => (TAG_PRIORITY[a] || 99) - (TAG_PRIORITY[b] || 99));
  return keys
    .slice(0, maxTags)
    .map((key) => ROOM_TAG_CONFIG[key])
    .filter(Boolean);
}
