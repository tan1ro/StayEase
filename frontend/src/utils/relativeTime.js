export function formatRelativeTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
  ];

  for (const { label, seconds: unit } of intervals) {
    const count = Math.floor(seconds / unit);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}
