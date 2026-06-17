import { useState } from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { bookingsApi, formatCurrency } from '../api/api';
import ErrorMessage from './ErrorMessage';
import { Icon, ICON } from './ui/Icon';

export default function MockPaymentPanel({ bookingId, totalPrice, onPaid }) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setPaying(true);
    setError('');
    try {
      const { data } = await bookingsApi.pay(bookingId);
      onPaid?.(data);
    } catch (err) {
      setError(err.normalized?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <section className="mock-payment card no-print" aria-labelledby="mock-payment-title">
      <div className="mock-payment__header">
        <Icon icon={CreditCard} size={ICON.lg} />
        <div>
          <h2 id="mock-payment-title">Complete payment</h2>
          <p className="mock-payment__subtitle">
            Mock payment gateway — no real charge. Confirms your booking and generates a GST invoice.
          </p>
        </div>
      </div>

      <div className="mock-payment__amount">
        <span>Amount due</span>
        <strong>{formatCurrency(totalPrice)}</strong>
      </div>

      <div className="mock-payment__form">
        <div className="form-group">
          <label className="label" htmlFor="mock-card">Card number</label>
          <input
            id="mock-card"
            className="input"
            value="4111 1111 1111 1111"
            readOnly
            aria-readonly="true"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label" htmlFor="mock-expiry">Expiry</label>
            <input id="mock-expiry" className="input" value="12/28" readOnly aria-readonly="true" />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="mock-cvv">CVV</label>
            <input id="mock-cvv" className="input" value="123" readOnly aria-readonly="true" />
          </div>
        </div>
      </div>

      <p className="mock-payment__secure">
        <Icon icon={ShieldCheck} size={ICON.sm} />
        Development mode — payment is simulated locally
      </p>

      <ErrorMessage message={error} />

      <button
        type="button"
        className="btn btn-primary mock-payment__submit"
        onClick={handlePay}
        disabled={paying}
      >
        {paying ? 'Processing…' : `Pay ${formatCurrency(totalPrice)}`}
      </button>
    </section>
  );
}
