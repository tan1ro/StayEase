import { describe, it, expect } from 'vitest';
import { mergePriceBreakdown, sumMultiRoomPricing } from '../../utils/multiRoomPricing';

const roomPricing = (overrides = {}) => ({
  price_breakdown: [
    { label: 'Base price', amount: 20000, type: 'base' },
    { label: 'Sunrise side premium', amount: 2000, type: 'surcharge' },
    { label: 'Weekend surcharge', amount: 1000, type: 'surcharge' },
    { label: 'Long stay discount', amount: -2000, type: 'discount' },
    { label: 'StayEase service fee', amount: 3000, type: 'fee' },
  ],
  subtotal: 21000,
  total_price: 25000,
  gst_amount: 1000,
  guest_platform_fee: 3000,
  total_nights: 8,
  gst_rate: 0.05,
  ...overrides,
});

describe('mergePriceBreakdown', () => {
  it('returns single-room breakdown unchanged', () => {
    const items = [roomPricing()];
    const merged = mergePriceBreakdown(items, () => 'RAJ01');
    expect(merged).toEqual([
      { label: 'Base price', amount: 20000, type: 'base' },
      { label: 'Sunrise side premium', amount: 2000, type: 'surcharge' },
      { label: 'Weekend surcharge', amount: 1000, type: 'surcharge' },
      { label: 'Long stay discount', amount: -2000, type: 'discount' },
    ]);
  });

  it('shows per-room base prices when multiple rooms are selected', () => {
    const items = [
      roomPricing(),
      roomPricing({
        price_breakdown: [
          { label: 'Base price', amount: 18000, type: 'base' },
          { label: 'Sunrise side premium', amount: 1500, type: 'surcharge' },
          { label: 'Weekend surcharge', amount: 800, type: 'surcharge' },
          { label: 'Long stay discount', amount: -1800, type: 'discount' },
        ],
        subtotal: 18500,
      }),
    ];

    const merged = mergePriceBreakdown(items, (_, index) => (index === 0 ? 'RAJ01' : 'RAJ04'));

    expect(merged[0]).toMatchObject({
      label: 'Base price (RAJ01)',
      amount: 20000,
      multiRoom: true,
    });
    expect(merged[1]).toMatchObject({
      label: 'Base price (RAJ04)',
      amount: 18000,
      multiRoom: true,
    });
    expect(merged[2]).toMatchObject({
      label: 'Sunrise side premium',
      amount: 3500,
    });
    expect(merged[3]).toMatchObject({
      label: 'Weekend surcharge',
      amount: 1800,
    });
    expect(merged[4]).toMatchObject({
      label: 'Long stay discount',
      amount: -3800,
    });
  });
});

describe('sumMultiRoomPricing', () => {
  it('aggregates totals and merged breakdown for multiple rooms', () => {
    const items = [roomPricing(), roomPricing({ subtotal: 18500, total_price: 22000, gst_amount: 900 })];
    const result = sumMultiRoomPricing(items, (_, index) => (index === 0 ? 'RAJ01' : 'RAJ04'));

    expect(result.subtotal).toBe(39500);
    expect(result.total_price).toBe(47000);
    expect(result.gst_amount).toBe(1900);
    expect(result.room_count).toBe(2);
    expect(result.price_breakdown.filter((item) => item.type === 'base')).toHaveLength(2);
  });
});
