import { Link } from 'react-router-dom';

export default function LegalAcceptance({
  checked,
  onChange,
  id = 'legal-acceptance',
  suffix = '',
  className = '',
}) {
  return (
    <label className={`legal-acceptance ${className}`.trim()} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="legal-acceptance__text">
        I agree to the{' '}
        <Link to="/terms" target="_blank" rel="noreferrer">Terms of Service</Link>,{' '}
        <Link to="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</Link>, and{' '}
        <Link to="/cookie-policy" target="_blank" rel="noreferrer">Cookie Policy</Link>
        {suffix}
      </span>
    </label>
  );
}
