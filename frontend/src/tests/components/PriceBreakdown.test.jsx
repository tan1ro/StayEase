import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PriceBreakdown from '../../components/PriceBreakdown';

const pricing = {
  price_breakdown: [
    { label: 'Base price', amount: 6000, type: 'base' },
    { label: 'Weekend surcharge', amount: 1200, type: 'surcharge' },
    { label: 'Peak season surcharge', amount: 900, type: 'surcharge' },
    { label: 'Long stay discount', amount: -600, type: 'discount' },
  ],
  subtotal: 7500,
  final_price_per_night: 2500,
  total_nights: 3,
  gst_rate: 0.05,
  gst_amount: 375,
  cgst_amount: 187.5,
  sgst_amount: 187.5,
  guest_platform_fee: 750,
  total_price: 9150,
};

describe('PriceBreakdown', () => {
  it('renders base price', () => {
    render(<PriceBreakdown pricing={pricing} />);
    expect(screen.getByText('Base price')).toBeInTheDocument();
  });

  it('shows weekend surcharge line item', () => {
    render(<PriceBreakdown pricing={pricing} />);
    expect(screen.getByText('Weekend surcharge')).toBeInTheDocument();
  });

  it('shows peak season surcharge', () => {
    render(<PriceBreakdown pricing={pricing} />);
    expect(screen.getByText('Peak season surcharge')).toBeInTheDocument();
  });

  it('shows long stay discount as negative', () => {
    render(<PriceBreakdown pricing={pricing} />);
    expect(screen.getByText('Long stay discount')).toBeInTheDocument();
  });

  it('shows GST line items (CGST + SGST)', () => {
    render(<PriceBreakdown pricing={pricing} />);
    expect(screen.getByTestId('cgst-amount')).toBeInTheDocument();
    expect(screen.getByTestId('sgst-amount')).toBeInTheDocument();
  });

  it('shows guest platform service fee', () => {
    render(<PriceBreakdown pricing={pricing} />);
    expect(screen.getByTestId('guest-platform-fee')).toBeInTheDocument();
    expect(screen.getByText('StayEase service fee')).toBeInTheDocument();
  });

  it('renders correct grand total', () => {
    render(<PriceBreakdown pricing={pricing} />);
    expect(screen.getByTestId('grand-total')).toHaveTextContent('₹9,150');
  });
});
