export function isValidRoomId(id) {
  return typeof id === 'string' && id.length === 24 && id !== 'None';
}
