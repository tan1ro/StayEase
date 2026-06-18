import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';

const POLICY_DETAILS = {
  flexible: {
    title: 'Flexible',
    rules: [
      'Full refund if you cancel at least 24 hours before check-in',
      '50% refund if you cancel within 24 hours of check-in',
    ],
  },
  moderate: {
    title: 'Moderate',
    rules: [
      'Full refund if you cancel 5+ days before check-in',
      '50% refund if you cancel 1–5 days before check-in',
      'No refund if you cancel within 24 hours of check-in',
    ],
  },
  strict: {
    title: 'Strict',
    rules: [
      '50% refund if you cancel 7+ days before check-in',
      'No refund if you cancel within 7 days of check-in',
    ],
  },
};

export default function CancellationPolicy({ policy = 'moderate', compact = false }) {
  const details = POLICY_DETAILS[policy] || POLICY_DETAILS.moderate;

  if (compact) {
    return (
      <p className="cancellation-policy-compact">
        <Info size={14} />
        <span>
          <strong>{details.title}</strong> cancellation policy applies.
          <Link to="/help/cancellation"> Learn more</Link>
        </span>
      </p>
    );
  }

  return (
    <div className="cancellation-policy card">
      <h4>
        <Info size={18} /> Cancellation policy — {details.title}
      </h4>
      <ul>
        {details.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </div>
  );
}
