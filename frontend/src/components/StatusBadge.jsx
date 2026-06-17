import Badge from './Badge';
import { formatStatusLabel, getStatusBadgeVariant } from '../utils/statusBadge';

export default function StatusBadge({ status, ...rest }) {
  if (!status) return null;
  return (
    <Badge variant={getStatusBadgeVariant(status)} {...rest}>
      {formatStatusLabel(status)}
    </Badge>
  );
}
