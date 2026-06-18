import { parseFloorNumber } from '../constants/roomPlacement';

export function isRoomPublishedToPlatform(room) {
  return room?.is_available !== false;
}

export function isRoomAvailableForDates(room) {
  if (!isRoomPublishedToPlatform(room)) return false;
  return room?.available_for_dates !== false;
}

export function getRoomPickerStatus(room) {
  if (!isRoomPublishedToPlatform(room)) return 'unpublished';
  if (room?.available_for_dates === false) return 'booked';
  return 'open';
}

export function sortRoomsOnFloor(rooms) {
  return [...rooms].sort((a, b) => (
    String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })
  ));
}

export function roomsAreContiguous(selectedRooms, floorRooms) {
  if (!selectedRooms.length) return false;
  const sortedFloor = sortRoomsOnFloor(floorRooms);
  const idToIndex = new Map(sortedFloor.map((room, index) => [room._id, index]));
  const indices = selectedRooms
    .map((room) => idToIndex.get(room._id))
    .filter((index) => index != null)
    .sort((a, b) => a - b);
  if (indices.length !== selectedRooms.length) return false;
  for (let i = 1; i < indices.length; i += 1) {
    if (indices[i] !== indices[i - 1] + 1) return false;
  }
  return true;
}

export function getFloorRooms(allRooms, room) {
  const floor = parseFloorNumber(room);
  return sortRoomsOnFloor(allRooms.filter((item) => parseFloorNumber(item) === floor));
}

export function canToggleRoom(room, selectedIds) {
  if (!isRoomAvailableForDates(room)) return false;
  return true;
}

export function toggleRoomSelection(room, selectedIds, allRooms) {
  if (!room || !isRoomAvailableForDates(room)) return selectedIds;
  const isSelected = selectedIds.includes(room._id);
  if (isSelected) {
    return selectedIds.filter((id) => id !== room._id);
  }
  return [...selectedIds, room._id];
}

export function getAdjacentAvailableRooms(room, allRooms) {
  const floorRooms = getFloorRooms(allRooms, room);
  const index = floorRooms.findIndex((item) => item._id === room._id);
  if (index < 0) return [];
  const adjacent = [];
  if (isRoomAvailableForDates(floorRooms[index - 1])) adjacent.push(floorRooms[index - 1]);
  if (isRoomAvailableForDates(floorRooms[index + 1])) adjacent.push(floorRooms[index + 1]);
  return adjacent;
}

export function resolveAvailableSelection(selectedIds, allRooms, preferredRoomId) {
  const available = allRooms.filter(isRoomAvailableForDates);
  if (!available.length) {
    return { ids: [], notice: 'No rooms are open for these dates. Try different dates or join the waitlist.' };
  }

  if (!selectedIds.length) {
    return { ids: [], notice: '' };
  }

  const stillValid = selectedIds.filter((id) => available.some((room) => room._id === id));
  if (stillValid.length) {
    return { ids: stillValid, notice: '' };
  }

  const preferred = allRooms.find((room) => room._id === preferredRoomId);
  const notice = preferred && selectedIds.includes(preferred._id)
    ? `Room ${preferred.room_number} is booked for these dates — pick an open room from the floor map.`
    : 'One or more selected rooms are booked for these dates — pick open rooms from the floor map.';

  return { ids: [], notice };
}
