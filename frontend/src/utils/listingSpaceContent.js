function hasAmenity(amenities, names) {
  const normalized = new Set(amenities.map((a) => a.toLowerCase()));
  return names.some((name) => normalized.has(name.toLowerCase()));
}

export function splitDescription(description = '') {
  const text = description.trim();
  if (!text) return { intro: '', spaceDetails: '', hasMore: false };

  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) {
    return {
      intro: paragraphs[0],
      spaceDetails: paragraphs.slice(1).join('\n\n'),
      hasMore: true,
    };
  }

  if (text.length <= 320) {
    return { intro: text, spaceDetails: '', hasMore: false };
  }

  const cut = text.slice(0, 320);
  const lastSpace = cut.lastIndexOf(' ');
  const intro = (lastSpace > 200 ? cut.slice(0, lastSpace) : cut).trim();

  return {
    intro,
    spaceDetails: text.slice(intro.length).trim(),
    hasMore: true,
  };
}

export function getDescriptionPreview(description = '') {
  const { intro, hasMore } = splitDescription(description);
  return { intro, hasMore };
}

export function buildAboutSpaceSections(room) {
  const amenities = room.amenities || [];
  const guestAccess = [];
  const category = (room.room_category || 'room').toLowerCase();

  guestAccess.push(`You'll have the ${category} to yourself during your stay.`);

  const shared = [];
  if (hasAmenity(amenities, ['Pool', 'Shared pool', 'Indoor pool', 'Outdoor pool', 'Private pool'])) {
    shared.push('swimming pool');
  }
  if (hasAmenity(amenities, ['Gym', 'Fitness center', 'Shared gym'])) {
    shared.push('gym');
  }
  if (hasAmenity(amenities, ['Garden', 'Backyard', 'Terrace', 'Rooftop deck'])) {
    shared.push('outdoor spaces');
  }
  if (shared.length) {
    guestAccess.push(`You'll also have shared access to the ${shared.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`);
  }

  const notes = [];
  if (room.policies?.smoking_allowed || room.smoking_policy === 'smoking') {
    notes.push('Smoking is permitted in designated areas only.');
  } else {
    notes.push('Smoking is not allowed inside the property.');
  }

  if (room.policies?.pet_allowed) {
    notes.push('Pets are welcome — please mention them when booking.');
  } else {
    notes.push('Pets are not allowed.');
  }

  const checkIn = room.policies?.check_in_time || '14:00';
  const checkOut = room.policies?.check_out_time || '11:00';
  notes.push(`Check-in is from ${checkIn} and checkout is by ${checkOut}.`);

  if (room.food_preference === 'veg') {
    notes.push('This stay serves vegetarian food only.');
  } else if (room.food_preference === 'nonveg') {
    notes.push('Non-vegetarian meals are available at this property.');
  }

  const offers = amenities.length
    ? amenities
    : [
        `${room.max_guests} guests`,
        room.bed_configuration?.replace(/_/g, ' '),
        room.room_category,
      ].filter(Boolean);

  return [
    { title: 'What this space offers', items: offers, type: 'list' },
    { title: 'Guest access', paragraphs: guestAccess, type: 'text' },
    { title: 'Other things to note', paragraphs: notes, type: 'list' },
  ];
}
