export const FACING_OPTIONS = [
  { value: 'none', label: 'Not specified' },
  { value: 'north', label: 'North-facing' },
  { value: 'south', label: 'South-facing' },
  { value: 'east', label: 'East-facing' },
  { value: 'west', label: 'West-facing' },
  { value: 'north_east', label: 'North-east' },
  { value: 'north_west', label: 'North-west' },
  { value: 'south_east', label: 'South-east' },
  { value: 'south_west', label: 'South-west' },
];

export const FACING_LABELS = Object.fromEntries(
  FACING_OPTIONS.map(({ value, label }) => [value, label]),
);

export const BEACH_SEA_VIEW_TYPES = ['beach_view', 'sea_view'];

export const VIEW_TYPE_LABELS = {
  hill_view: 'Mountain view',
  beach_view: 'Beach & sea view',
  garden_view: 'Garden view',
  sea_view: 'Beach & sea view',
  city_view: 'City view',
  pool_view: 'Pool view',
  none: 'Standard view',
};

export function toggleViewFilter(currentView, option) {
  const values = option.matchValues || [option.value];
  const allSelected = values.every((v) => currentView.includes(v));
  if (allSelected) return currentView.filter((v) => !values.includes(v));
  const next = [...currentView];
  for (const v of values) {
    if (!next.includes(v)) next.push(v);
  }
  return next;
}

export function isViewFilterActive(currentView, option) {
  const values = option.matchValues || [option.value];
  return values.some((v) => currentView.includes(v));
}

export function formatFacingSide(facing) {
  if (!facing || facing === 'none') return null;
  return FACING_LABELS[facing] || facing.replace(/_/g, ' ');
}

export function normalizeViewType(viewType) {
  if (viewType === 'sea_view') return 'beach_view';
  return viewType || 'none';
}

export function formatViewType(viewType) {
  if (!viewType || viewType === 'none') return null;
  return VIEW_TYPE_LABELS[viewType] || viewType.replace(/_/g, ' ');
}

export function buildRoomPlacementSummary(room) {
  if (!room) return [];
  const items = [];
  if (room.room_number) {
    items.push({ key: 'room', label: 'Room number', value: room.room_number });
  }
  if (room.floor_label) {
    items.push({ key: 'floor', label: 'Floor', value: room.floor_label });
  }
  const facing = formatFacingSide(room.facing_side);
  if (facing) {
    items.push({ key: 'facing', label: 'Facing', value: facing });
  }
  const view = formatViewType(room.view_type);
  if (view) {
    items.push({ key: 'view', label: 'View', value: view });
  }
  if (room.has_balcony) {
    items.push({ key: 'balcony', label: 'Balcony', value: 'Yes' });
  }
  return items;
}

export function getSunlightTraits(facingSide) {
  const facing = facingSide || 'none';
  const sunrise = ['east', 'north_east', 'south_east'].includes(facing);
  const sunset = ['west', 'north_west', 'south_west'].includes(facing);
  const traits = [];
  if (sunrise) traits.push({ id: 'sunrise', label: 'Sunrise', hint: 'Morning golden light' });
  if (sunset) traits.push({ id: 'sunset', label: 'Sunset', hint: 'Evening golden hour' });
  if (facing === 'south') traits.push({ id: 'daylight', label: 'All-day sun', hint: 'Bright afternoon light' });
  if (facing === 'north') traits.push({ id: 'shade', label: 'Soft light', hint: 'Cooler, shaded side' });
  return { sunrise, sunset, traits };
}

/** Parse numeric floor for grouping (BookMyShow-style floor map). */
export function parseFloorNumber(room) {
  if (room?.floor_number != null && !Number.isNaN(Number(room.floor_number))) {
    return Number(room.floor_number);
  }
  const label = String(room?.floor_label || '');
  const labelMatch = label.match(/(\d+)/);
  if (labelMatch) return Number(labelMatch[1]);

  const num = String(room?.room_number || '').trim();
  if (!num) return 0;
  if (/^G/i.test(num)) return 0;
  const digits = num.replace(/\D/g, '');
  if (digits.length >= 3) {
    const floor = parseInt(digits.slice(0, -2), 10);
    return Number.isNaN(floor) ? 0 : floor;
  }
  if (digits.length === 2) {
    const floor = parseInt(digits[0], 10);
    return Number.isNaN(floor) ? 0 : floor;
  }
  return 0;
}

export function formatFloorLabel(floorNumber) {
  if (floorNumber <= 0) return 'Ground floor';
  const suffix = floorNumber === 1 ? 'st' : floorNumber === 2 ? 'nd' : floorNumber === 3 ? 'rd' : 'th';
  return `${floorNumber}${suffix} floor`;
}

export function groupRoomsByFloor(rooms) {
  const groups = new Map();
  for (const room of rooms) {
    const floor = parseFloorNumber(room);
    if (!groups.has(floor)) groups.set(floor, []);
    groups.get(floor).push(room);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([floor, items]) => ({
      floor,
      label: formatFloorLabel(floor),
      rooms: items.sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })),
    }));
}

export function buildViewHighlight(room) {
  if (room?.view_description?.trim()) {
    return room.view_description.trim();
  }
  const facing = formatFacingSide(room?.facing_side);
  const view = formatViewType(room?.view_type);
  const { traits } = getSunlightTraits(room?.facing_side);
  const lightNote = traits.map((t) => t.label.toLowerCase()).join(' & ');
  if (facing && view && lightNote) {
    return `${facing} room with ${view.toLowerCase()} — great for ${lightNote}.`;
  }
  if (view) {
    return `This room offers a ${view.toLowerCase()} from the property.`;
  }
  if (facing) {
    return `${facing} room — ask the host about the best window views at check-in.`;
  }
  return null;
}
