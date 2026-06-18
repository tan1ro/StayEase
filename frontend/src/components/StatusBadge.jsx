import Badge from './Badge';
import { formatStatusLabel, getStatusBadgeVariant } from '../utils/statusBadge';

export default function StatusBadge({ status, label, ...rest }) {
  if (!status) return null;
  const displayLabel = label ?? formatStatusLabel(status);
  return (
    <Badge variant={getStatusBadgeVariant(status)} {...rest}>
      {displayLabel}
    </Badge>
  );
}
