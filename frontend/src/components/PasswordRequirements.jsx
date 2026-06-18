import { getPasswordChecks } from '../utils/passwordValidation';

const RULES = [
  { key: 'length', label: 'At least 8 characters' },
  { key: 'upper', label: 'One uppercase letter' },
  { key: 'number', label: 'One number' },
  { key: 'special', label: 'One special character' },
];

export default function PasswordRequirements({ password = '' }) {
  const checks = getPasswordChecks(password);
  const unmet = RULES.filter(({ key }) => !checks[key]);

  if (!unmet.length) return null;

  return (
    <ul className="password-requirements" aria-live="polite">
      {unmet.map(({ key, label }) => (
        <li key={key} className="password-requirements__item password-requirements__item--unmet">
          {label}
        </li>
      ))}
    </ul>
  );
}
