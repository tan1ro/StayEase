import { describe, it, expect } from 'vitest';
import {
  parseFloorNumber,
  formatFloorLabel,
  groupRoomsByFloor,
  getSunlightTraits,
} from '../../constants/roomPlacement';

describe('parseFloorNumber', () => {
  it('uses floor_number when set', () => {
    expect(parseFloorNumber({ floor_number: 4, room_number: '101' })).toBe(4);
  });

  it('parses ground rooms', () => {
    expect(parseFloorNumber({ room_number: 'G01' })).toBe(0);
  });

  it('parses standard hotel room numbers', () => {
    expect(parseFloorNumber({ room_number: '401' })).toBe(4);
    expect(parseFloorNumber({ room_number: '202' })).toBe(2);
  });
});

describe('formatFloorLabel', () => {
  it('labels ground and numbered floors', () => {
    expect(formatFloorLabel(0)).toBe('Ground floor');
    expect(formatFloorLabel(1)).toBe('1st floor');
    expect(formatFloorLabel(3)).toBe('3rd floor');
  });
});

describe('groupRoomsByFloor', () => {
  it('groups and sorts rooms by floor', () => {
    const groups = groupRoomsByFloor([
      { room_number: '401', floor_number: 4 },
      { room_number: '101', floor_number: 1 },
      { room_number: 'G01', floor_number: 0 },
    ]);
    expect(groups.map((g) => g.floor)).toEqual([0, 1, 4]);
    expect(groups[1].rooms.map((r) => r.room_number)).toEqual(['101']);
  });
});

describe('getSunlightTraits', () => {
  it('marks east-facing rooms for sunrise', () => {
    const { sunrise, sunset, traits } = getSunlightTraits('east');
    expect(sunrise).toBe(true);
    expect(sunset).toBe(false);
    expect(traits.some((t) => t.id === 'sunrise')).toBe(true);
  });

  it('marks west-facing rooms for sunset', () => {
    const { sunrise, sunset } = getSunlightTraits('west');
    expect(sunrise).toBe(false);
    expect(sunset).toBe(true);
  });
});
