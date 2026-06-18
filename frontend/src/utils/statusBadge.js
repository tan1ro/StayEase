export function formatPaymentStatusLabel(paymentStatus) {
  const value = String(paymentStatus || '').toLowerCase();
  if (value === 'paid') return 'Paid';
  if (value === 'pending') return 'Unpaid';
  if (value === 'refunded') return 'Refunded';
  if (value === 'partial_refund') return 'Partial refund';
  if (value === 'no_refund') return 'No refund';
  return formatStatusLabel(paymentStatus);
}

export function formatStatusLabel(status) {
  if (!status) return '—';
  const normalized = String(status).trim().replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

export function getStatusBadgeVariant(status) {
  const value = String(status || '').toLowerCase();

  if (['confirmed', 'completed', 'paid', 'verified', 'success', 'live', 'active'].includes(value)) {
    return 'success';
  }
  if (['pending', 'processing', 'awaiting', 'unpaid'].includes(value)) {
    return 'warning';
  }
  if (['failed', 'cancelled', 'canceled', 'refunded', 'rejected', 'declined', 'error'].includes(value)) {
    return 'danger';
  }
  return 'default';
}
