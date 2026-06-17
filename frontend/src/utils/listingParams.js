/** Parse listing deep-link query params (Airbnb-style share URLs). */

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const start = new Date(`${checkIn}T12:00:00`);
  const end = new Date(`${checkOut}T12:00:00`);
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : null;
}

export function listingParamsFromSearch(searchParams) {
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const guests = Math.max(1, Number(searchParams.get('guests') || 1));
  const nights = nightsBetween(checkIn, checkOut);
  const scrollToReview = searchParams.get('scroll_to_review');
  const photoId = searchParams.get('photo_id');

  return {
    checkIn,
    checkOut,
    guests,
    nights,
    scrollToReview,
    photoId,
  };
}
