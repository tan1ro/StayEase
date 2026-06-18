import { describe, it, expect } from 'vitest';
import {
  inferWizardStepId,
  isDraftListing,
  isPlaceholderTitle,
  getListingResumePath,
} from '../../utils/listingResume';

describe('listingResume', () => {
  it('detects draft listings', () => {
    expect(isDraftListing({ is_available: false })).toBe(true);
    expect(isDraftListing({ is_available: true })).toBe(false);
  });

  it('infers location step when city is missing', () => {
    expect(inferWizardStepId({
      photos: [{ url: 'x' }],
      title: 'Cozy Suite',
      description: 'A'.repeat(50),
      location: { city: '', area: 'MG Road' },
      price_per_night: 2000,
    })).toBe('location');
  });

  it('infers photos step when no images', () => {
    expect(inferWizardStepId({
      location: { city: 'Bangalore', area: 'MG Road' },
      title: 'Cozy Suite',
      description: 'A'.repeat(50),
      photos: [],
      price_per_night: 2000,
    })).toBe('photos');
  });

  it('infers title step for placeholder title', () => {
    expect(inferWizardStepId({
      location: { city: 'Bangalore', area: 'MG Road' },
      photos: [{ url: 'x' }],
      title: 'New StayEase listing',
      description: 'A'.repeat(50),
      price_per_night: 2000,
    })).toBe('title');
  });

  it('builds resume path', () => {
    expect(getListingResumePath('abc123')).toBe('/host/rooms/add?roomId=abc123');
  });

  it('flags placeholder titles', () => {
    expect(isPlaceholderTitle('New StayEase listing')).toBe(true);
    expect(isPlaceholderTitle('Sunrise Suite')).toBe(false);
  });
});
