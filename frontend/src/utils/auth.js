export const PHONE_PLACEHOLDER = '0000000000';

export function userNeedsPhone(user) {
  return user?.phone === PHONE_PLACEHOLDER;
}
