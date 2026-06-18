import { describe, it, expect } from 'vitest';
import {
  canToggleRoom,
  isRoomAvailableForDates,
  resolveAvailableSelection,
  toggleRoomSelection,
} from '../../utils/adjacentRooms';

const rooms = [
  { _id: 'a', room_number: 'RAJ01', floor_number: 0, available_for_dates: true },
  { _id: 'b', room_number: 'RAJ02', floor_number: 0, available_for_dates: false },
  { _id: 'c', room_number: 'RAJ04', floor_number: 0, available_for_dates: true },
];

describe('isRoomAvailableForDates', () => {
  it('treats only explicit false as unavailable', () => {
    expect(isRoomAvailableForDates({ available_for_dates: true })).toBe(true);
    expect(isRoomAvailableForDates({ available_for_dates: false })).toBe(false);
    expect(isRoomAvailableForDates({})).toBe(true);
  });
});

describe('toggleRoomSelection', () => {
  it('does not select booked rooms', () => {
    const booked = rooms[1];
    expect(toggleRoomSelection(booked, ['a'], rooms)).toEqual(['a']);
  });
});

describe('canToggleRoom', () => {
  it('blocks booked rooms even when already selected', () => {
    expect(canToggleRoom(rooms[1], ['b'], rooms)).toBe(false);
  });
});

describe('resolveAvailableSelection', () => {
  it('replaces booked selection with an open room', () => {
    const result = resolveAvailableSelection(['b'], rooms, 'b');
    expect(result.ids).toEqual(['a']);
    expect(result.notice).toMatch(/RAJ02 is booked/i);
  });

  it('keeps valid open selections', () => {
    const result = resolveAvailableSelection(['a', 'c'], rooms, 'a');
    expect(result.ids).toEqual(['a', 'c']);
    expect(result.notice).toBe('');
  });
});
