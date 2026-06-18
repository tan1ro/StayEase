import { formatCurrency } from '../api/api';

const GSTIN = '29AABCU9603R1ZX';
const HSN_SAC = '998552';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimestamp(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MetaRow({ label, value }) {
  return (
    <div className="tax-invoice__meta-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function TaxInvoice({ booking, room, invoice, guestEmail }) {
  if (!booking || !room) return null;

  const invoiceNumber = invoice?.invoice_number
    || `INV-${(booking.check_in_date || '').replace(/-/g, '')}-${String(booking._id || booking.id).slice(-6).toUpperCase()}`;
  const location = room.location || {};
  const address = [room.title, location.area, location.city].filter(Boolean).join(', ');
  const breakdown = booking.price_breakdown || [];
  const gstRate = booking.gst_rate ?? 0.18;
  const cgstRate = gstRate / 2;
  const sgstRate = gstRate / 2;
  const cgst = (booking.gst_amount || 0) / 2;
  const sgst = (booking.gst_amount || 0) / 2;
  const guestFee = booking.guest_platform_fee || 0;
  const discount = booking.discount_amount || 0;
  const nights = booking.total_nights || 1;

  return (
    <article className="tax-invoice" id="tax-invoice-print">
      <header className="tax-invoice__header">
        <div className="tax-invoice__brand">
          <img src="/stayease_logo.svg" alt="StayEase" className="tax-invoice__logo" />
          <div>
            <strong>StayEase — Smart Hotel Management</strong>
            <p>GSTIN: {GSTIN}</p>
            <p>HSN/SAC: {HSN_SAC} (Reservation services for accommodation)</p>
            <p>Place of Supply: {location.city || 'India'}</p>
          </div>
        </div>
        <div className="tax-invoice__title-block">
          <h1>TAX INVOICE</h1>
          <p className="tax-invoice__copy-label">Original for Recipient</p>
        </div>
      </header>

      <div className="tax-invoice__refs">
        <MetaRow label="Invoice No." value={invoiceNumber} />
        <MetaRow label="Booking Ref." value={booking._id || booking.id} />
        <MetaRow label="Invoice Date" value={formatTimestamp(booking.created_at)} />
        <MetaRow label="Status" value="PAID" />
        <MetaRow label="Payment Mode" value="Online (StayEase)" />
      </div>

      <div className="tax-invoice__columns">
        <section>
          <h2>Bill To</h2>
          <MetaRow label="Guest Name" value={booking.guest_name || 'Guest'} />
          <MetaRow label="Email" value={guestEmail || booking.guest_email || '—'} />
          <MetaRow label="Phone" value={booking.guest_phone || '—'} />
          <MetaRow label="Customer GSTIN" value={booking.customer_gstin || '—'} />
        </section>
        <section>
          <h2>Service Details</h2>
          <MetaRow label="Property" value={address} />
          <MetaRow label="Room No." value={room.room_number || '—'} />
          <MetaRow label="Check-in" value={formatDate(booking.check_in_date)} />
          <MetaRow label="Check-out" value={formatDate(booking.check_out_date)} />
          <MetaRow label="Nights" value={String(nights)} />
          <MetaRow label="Guests" value={String(booking.num_guests || 1)} />
        </section>
      </div>

      <section className="tax-invoice__guest-table-wrap">
        <h2>Guest Details</h2>
        <table className="tax-invoice__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Guests</th>
              <th>Room</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{booking.guest_name || '—'}</td>
              <td>{booking.guest_phone || '—'}</td>
              <td>{booking.num_guests || 1}</td>
              <td>{room.room_number || '—'}</td>
              <td>CONFIRMED</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="tax-invoice__fare">
        <h2>Fare Details</h2>
        <table className="tax-invoice__table">
          <thead>
            <tr>
              <th>Description</th>
              <th>HSN/SAC</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.length > 0 ? breakdown.map((item) => (
              <tr key={item.label}>
                <td>{item.label}</td>
                <td>{HSN_SAC}</td>
                <td>{nights}</td>
                <td>{formatCurrency((item.amount || 0) / nights)}</td>
                <td>{formatCurrency(item.amount || 0)}</td>
              </tr>
            )) : (
              <tr>
                <td>Room tariff</td>
                <td>{HSN_SAC}</td>
                <td>{nights}</td>
                <td>{formatCurrency((booking.subtotal || 0) / nights)}</td>
                <td>{formatCurrency(booking.subtotal || 0)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="tax-invoice__totals">
          <div className="tax-invoice__total-row"><span>Subtotal</span><strong>{formatCurrency(booking.subtotal)}</strong></div>
          <div className="tax-invoice__total-row"><span>CGST ({(cgstRate * 100).toFixed(1)}%)</span><strong>{formatCurrency(cgst)}</strong></div>
          <div className="tax-invoice__total-row"><span>SGST ({(sgstRate * 100).toFixed(1)}%)</span><strong>{formatCurrency(sgst)}</strong></div>
          {guestFee > 0 && (
            <div className="tax-invoice__total-row"><span>StayEase service fee</span><strong>{formatCurrency(guestFee)}</strong></div>
          )}
          {discount > 0 && (
            <div className="tax-invoice__total-row">
              <span>Discount{booking.offer_code ? ` (${booking.offer_code})` : ''}</span>
              <strong>-{formatCurrency(discount)}</strong>
            </div>
          )}
          <div className="tax-invoice__total-row tax-invoice__total-row--grand">
            <span>Total Amount Paid</span>
            <strong>{formatCurrency(booking.total_price)}</strong>
          </div>
        </div>
      </section>

      <p className="tax-invoice__note">
        Tax is payable on reverse charge basis: No. GST shown as CGST + SGST for intra-state supplies.
        This is a computer-generated tax invoice and does not require a signature.
      </p>

      <section className="tax-invoice__terms">
        <h2>Important Information</h2>
        <ul>
          <li>Booking is confirmed only after successful payment through StayEase.</li>
          <li>Cancellation and refunds follow the policy selected for this property.</li>
          <li>Room charges and applicable GST are collected on behalf of the host/property.</li>
          <li>Present a valid government photo ID at check-in.</li>
          <li>For support, visit My Trips in your StayEase account.</li>
        </ul>
      </section>

      <footer className="tax-invoice__footer">
        <span>Booked by: {guestEmail || booking.guest_email || '—'}</span>
        <span>Booked on: {formatTimestamp(booking.created_at)}</span>
        <p className="tax-invoice__wish">WISH YOU A PLEASANT STAY</p>
      </footer>
    </article>
  );
}
