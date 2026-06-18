const round2 = (amount) => Math.round(amount * 100) / 100;

export function mergePriceBreakdown(roomItems, getRoomLabel) {
  if (!roomItems?.length) return [];

  if (roomItems.length === 1) {
    return (roomItems[0].price_breakdown || []).filter((item) => item.type !== 'fee');
  }

  const baseRows = [];
  const ancillaryOrder = [];
  const ancillaryMap = new Map();

  roomItems.forEach((roomPricing, index) => {
    const roomLabel = getRoomLabel?.(roomPricing, index) || `Room ${index + 1}`;

    (roomPricing.price_breakdown || [])
      .filter((item) => item.type !== 'fee')
      .forEach((item) => {
        if (item.type === 'base') {
          baseRows.push({
            ...item,
            label: `Base price (${roomLabel})`,
            roomLabel,
            multiRoom: true,
          });
          return;
        }

        if (!ancillaryMap.has(item.label)) {
          ancillaryOrder.push(item.label);
          ancillaryMap.set(item.label, { ...item, amount: item.amount || 0 });
          return;
        }

        const existing = ancillaryMap.get(item.label);
        existing.amount = round2(existing.amount + (item.amount || 0));
      });
  });

  return [...baseRows, ...ancillaryOrder.map((label) => ancillaryMap.get(label))];
}

export function sumMultiRoomPricing(items, getRoomLabel) {
  if (!items.length) return null;

  const totalNights = items[0]?.total_nights || 0;
  const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const gstAmount = items.reduce((sum, item) => sum + (item.gst_amount || 0), 0);
  const guestPlatformFee = items.reduce((sum, item) => sum + (item.guest_platform_fee || 0), 0);
  const discountAmount = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);

  return {
    ...items[0],
    price_breakdown: mergePriceBreakdown(items, getRoomLabel),
    subtotal,
    total_price: totalPrice,
    gst_amount: gstAmount,
    guest_platform_fee: guestPlatformFee,
    discount_amount: discountAmount,
    total_nights: totalNights,
    room_count: items.length,
    room_breakdown: items,
    gst_breakdown: items[0]?.gst_breakdown ? {
      cgst_amount: round2(gstAmount / 2),
      sgst_amount: round2(gstAmount / 2),
      cgst_rate: (items[0]?.gst_rate || 0) / 2,
      sgst_rate: (items[0]?.gst_rate || 0) / 2,
      total_gst: gstAmount,
      gst_rate: items[0]?.gst_rate,
    } : undefined,
  };
}

export function sumBookingPricings(bookings, getRoomLabel) {
  const items = bookings.map((booking) => ({
    price_breakdown: booking.price_breakdown,
    subtotal: booking.subtotal,
    total_price: booking.total_price,
    gst_amount: booking.gst_amount,
    guest_platform_fee: booking.guest_platform_fee,
    discount_amount: booking.discount_amount,
    total_nights: booking.total_nights,
    gst_rate: booking.gst_rate,
    gst_breakdown: booking.gst_breakdown,
    final_price_per_night: booking.final_price_per_night,
  }));

  return sumMultiRoomPricing(items, getRoomLabel);
}
