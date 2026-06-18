import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { PHONE_COUNTRIES } from '../constants/countryCodes';
import {
  formatPhoneNationalDisplay,
  normalizePhoneNational,
  validatePhone,
} from '../utils/identityValidation';

export default function PhoneInput({
  id,
  countryCode = 'IN',
  value = '',
  onChange,
  onCountryChange,
  onPhoneChange,
  label,
  hint,
  error,
  invalid = false,
  required = false,
  disabled = false,
  className = '',
  variant = 'default',
  autoComplete = 'tel-national',
}) {
  const country = PHONE_COUNTRIES.find((c) => c.code === countryCode) || PHONE_COUNTRIES[0];
  const displayValue = formatPhoneNationalDisplay(value, countryCode);
  const [countryOpen, setCountryOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const rootRef = useRef(null);
  const countryBtnRef = useRef(null);
  const menuRef = useRef(null);

  const emitChange = (nextCountryCode, nextNational) => {
    onChange?.({
      countryCode: nextCountryCode,
      national: nextNational,
      ...validatePhone(nextNational, nextCountryCode, { required }),
    });
  };

  const handleCountrySelect = (nextCountry) => {
    const normalized = normalizePhoneNational(value, nextCountry);
    onCountryChange?.(nextCountry);
    emitChange(nextCountry, normalized);
    setCountryOpen(false);
  };

  const handlePhoneChange = (e) => {
    const normalized = normalizePhoneNational(e.target.value, countryCode);
    onPhoneChange?.(normalized);
    emitChange(countryCode, normalized);
  };

  useEffect(() => {
    if (!countryOpen) return undefined;

    const updatePosition = () => {
      if (!countryBtnRef.current) return;
      const rect = countryBtnRef.current.getBoundingClientRect();
      const menuWidth = Math.max(rect.width, 280);
      let top = rect.bottom + 4;
      let left = rect.left;

      if (top + 280 > window.innerHeight - 12) {
        top = Math.max(12, rect.top - 284);
      }
      left = Math.max(12, Math.min(left, window.innerWidth - menuWidth - 12));

      setMenuStyle({
        position: 'fixed',
        top,
        left,
        width: menuWidth,
        zIndex: 1200,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const onDocClick = (e) => {
      if (
        rootRef.current?.contains(e.target)
        || menuRef.current?.contains(e.target)
      ) return;
      setCountryOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setCountryOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [countryOpen]);

  const rootClass = [
    'phone-input',
    `phone-input--${variant}`,
    invalid && 'phone-input--error',
    disabled && 'phone-input--disabled',
    countryOpen && 'phone-input--country-open',
    className,
  ].filter(Boolean).join(' ');

  const countryMenu = countryOpen ? (
    <div
      ref={menuRef}
      className="phone-input__country-menu"
      style={menuStyle}
      role="listbox"
      aria-label="Country code"
    >
      {PHONE_COUNTRIES.map((item) => (
        <button
          key={item.code}
          type="button"
          role="option"
          aria-selected={item.code === countryCode}
          className={[
            'phone-input__country-option',
            item.code === countryCode && 'phone-input__country-option--active',
          ].filter(Boolean).join(' ')}
          onClick={() => handleCountrySelect(item.code)}
        >
          <span className="phone-input__country-option-flag" aria-hidden>{item.flag}</span>
          <span className="phone-input__country-option-name">{item.name}</span>
          <span className="phone-input__country-option-dial">{item.dial}</span>
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className={rootClass} ref={rootRef}>
      {label && (
        <span className="phone-input__label label">{label}</span>
      )}
      <div className="phone-input__row">
        <button
          ref={countryBtnRef}
          type="button"
          id={id ? `${id}-country` : undefined}
          className="phone-input__country-btn"
          onClick={() => !disabled && setCountryOpen((open) => !open)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={countryOpen}
          aria-label={`Country code, ${country.name}`}
          title={country.name}
        >
          <span className="phone-input__country-flag" aria-hidden>{country.flag}</span>
          <span className="phone-input__country-dial">{country.dial}</span>
          <ChevronDown size={14} className="phone-input__country-chevron" aria-hidden />
        </button>
        <input
          id={id}
          className="phone-input__number"
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          placeholder={country.placeholder}
          value={displayValue}
          onChange={handlePhoneChange}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {countryMenu && createPortal(countryMenu, document.body)}
      {hint && <p className="form-hint">{hint}</p>}
      {error && (
        <span id={id ? `${id}-error` : undefined} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
