/** Host dashboard shell: /host and /host/... (not public /hosts/... profiles). */
export function isHostPortalPath(pathname) {
  return pathname === '/host' || pathname.startsWith('/host/');
}

export function isHostProfilePath(pathname) {
  return pathname.startsWith('/hosts/');
}
