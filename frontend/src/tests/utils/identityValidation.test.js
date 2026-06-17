import { describe, it, expect } from 'vitest';
import {
  formatAadharDisplay,
  normalizeIdNumber,
  validateIdNumber,
  validateIndianPhone,
} from '../../utils/identityValidation';

describe('identityValidation', () => {
  describe('validateIdNumber', () => {
    it('rejects Aadhar that is not exactly 12 digits', () => {
      expect(validateIdNumber('aadhar', '34242343242').valid).toBe(false);
      expect(validateIdNumber('aadhar', '34242343242').message).toMatch(/12 digits/);
    });

    it('accepts valid 12-digit Aadhar', () => {
      expect(validateIdNumber('aadhar', '123456789012').valid).toBe(true);
      expect(validateIdNumber('aadhar', '748384328492').valid).toBe(true);
    });

    it('accepts Aadhar when extra digits are pasted (uses first 12)', () => {
      expect(validateIdNumber('aadhar', '7483843284921').valid).toBe(true);
      expect(validateIdNumber('aadhar', '7483843284921').value).toBe('748384328492');
    });

    it('normalizes Aadhar input to digits only', () => {
      expect(normalizeIdNumber('aadhar', '1234 5678 9012')).toBe('123456789012');
    });

    it('formats Aadhar for display with spaces', () => {
      expect(formatAadharDisplay('748384328492')).toBe('7483 8432 8492');
    });

    it('rejects invalid PAN format', () => {
      expect(validateIdNumber('pan', 'ABCDE1234').valid).toBe(false);
    });

    it('accepts valid PAN', () => {
      expect(validateIdNumber('pan', 'abcde1234f').valid).toBe(true);
      expect(validateIdNumber('pan', 'abcde1234f').value).toBe('ABCDE1234F');
    });

    it('rejects passport without leading letter', () => {
      expect(validateIdNumber('passport', '12345678').valid).toBe(false);
    });

    it('accepts valid passport', () => {
      expect(validateIdNumber('passport', 'a1234567').valid).toBe(true);
    });
  });

  describe('validateIndianPhone', () => {
    it('accepts empty optional phone', () => {
      expect(validateIndianPhone('').valid).toBe(true);
    });

    it('rejects phone that is not 10 digits', () => {
      expect(validateIndianPhone('12345').valid).toBe(false);
    });

    it('accepts 10-digit phone', () => {
      expect(validateIndianPhone('9876543210').valid).toBe(true);
    });
  });
});
