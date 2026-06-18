import { describe, it, expect } from 'vitest';
import {
  canToggleRoom,
  getRoomPickerStatus,
  isRoomAvailableForDates,
  isRoomPublishedToPlatform,
  resolveAvailableSelection,
  toggleRoomSelection,
} from '../../utils/adjacentRooms';

const rooms = [
  { _id: 'a', room_number: 'RAJ01', floor_number: 0, available_for_dates: true, is_available: true },
  { _id: 'b', room_number: 'RAJ02', floor_number: 0, available_for_dates: false, is_available: true },
  { _id: 'c', room_number: 'RAJ04', floor_number: 0, available_for_dates: true, is_available: true },
  { _id: 'd', room_number: 'RAJ05', floor_number: 0, available_for_dates: true, is_available: false },
];

describe('isRoomAvailableForDates', () => {
  it('treats only explicit false as unavailable', () => {
    expect(isRoomAvailableForDates({ available_for_dates: true })).toBe(true);
    expect(isRoomAvailableForDates({ available_for_dates: false })).toBe(false);
    expect(isRoomAvailableForDates({})).toBe(true);
  });

  it('treats unpublished rooms as unavailable', () => {
    expect(isRoomAvailableForDates({ is_available: false, available_for_dates: true })).toBe(false);
  });
});

describe('getRoomPickerStatus', () => {
  it('distinguishes open, booked, and unpublished rooms', () => {
    expect(getRoomPickerStatus(rooms[0])).toBe('open');
    expect(getRoomPickerStatus(rooms[1])).toBe('booked');
    expect(getRoomPickerStatus(rooms[3])).toBe('unpublished');
  });
});

describe('isRoomPublishedToPlatform', () => {
  it('returns false only when host has unpublished the room', () => {
    expect(isRoomPublishedToPlatform(rooms[0])).toBe(true);
    expect(isRoomPublishedToPlatform(rooms[3])).toBe(false);
  });
});

describe('canToggleRoom', () => {
  it('blocks booked rooms', () => {
    expect(canToggleRoom(rooms[1], ['b'])).toBe(false);
  });

  it('allows any open room to be selected', () => {
    expect(canToggleRoom(rooms[0], [])).toBe(true);
    expect(canToggleRoom(rooms[2], ['a'])).toBe(true);
  });
});

describe('toggleRoomSelection', () => {
  it('does not select booked rooms', () => {
    const booked = rooms[1];
    expect(toggleRoomSelection(booked, ['a'], rooms)).toEqual(['a']);
  });

  it('adds and removes open rooms freely', () => {
    expect(toggleRoomSelection(rooms[0], [], rooms)).toEqual(['a']);
    expect(toggleRoomSelection(rooms[2], ['a'], rooms)).toEqual(['a', 'c']);
    expect(toggleRoomSelection(rooms[0], ['a', 'c'], rooms)).toEqual(['c']);
    expect(toggleRoomSelection(rooms[0], ['a'], rooms)).toEqual([]);
  });
});

describe('resolveAvailableSelection', () => {
  it('clears booked selection without auto-picking another room', () => {
    const result = resolveAvailableSelection(['b'], rooms, 'b');
    expect(result.ids).toEqual([]);
    expect(result.notice).toMatch(/RAJ02 is booked/i);
  });

  it('does not auto-select when nothing is chosen', () => {
    const result = resolveAvailableSelection([], rooms, 'b');
    expect(result.ids).toEqual([]);
    expect(result.notice).toBe('');
  });

  it('keeps valid open selections', () => {
    const result = resolveAvailableSelection(['a', 'c'], rooms, 'a');
    expect(result.ids).toEqual(['a', 'c']);
    expect(result.notice).toBe('');
  });
});
