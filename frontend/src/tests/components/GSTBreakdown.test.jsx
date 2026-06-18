import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GSTBreakdown, { calculateGST } from '../../components/GSTBreakdown';

describe('calculateGST', () => {
  it('5% GST for price up to 7500', () => {
    const gst = calculateGST(800, 2);
    expect(gst.gst_rate).toBe(0.05);
    expect(gst.total_gst).toBe(80);
  });

  it('5% GST for price 1000-7500', () => {
    const gst = calculateGST(2000, 2);
    expect(gst.gst_rate).toBe(0.05);
    expect(gst.total_gst).toBe(200);
  });

  it('18% GST for price > 7500', () => {
    const gst = calculateGST(8000, 1);
    expect(gst.gst_rate).toBe(0.18);
    expect(gst.total_gst).toBe(1440);
  });

  it('CGST and SGST split correctly', () => {
    const gst = calculateGST(2000, 2);
    expect(gst.cgst_amount).toBe(gst.sgst_amount);
    expect(gst.cgst_amount + gst.sgst_amount).toBe(gst.total_gst);
  });
});

describe('GSTBreakdown', () => {
  it('renders CGST and SGST rows', () => {
    render(<GSTBreakdown pricePerNight={2000} nights={2} />);
    expect(screen.getByTestId('cgst-amount')).toBeInTheDocument();
    expect(screen.getByTestId('sgst-amount')).toBeInTheDocument();
  });
});
