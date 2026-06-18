import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Download, Printer, Star } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import HotelVoucher from '../../components/HotelVoucher';
import MockPaymentPanel from '../../components/MockPaymentPanel';
import WriteReviewModal from '../../components/WriteReviewModal';
import { bookingsApi, reviewsApi, roomsApi } from '../../api/api';

export default function Receipt() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [room, setRoom] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [reviewState, setReviewState] = useState({ can_review: false, has_review: false });
  const [reviewOpen, setReviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paidNotice, setPaidNotice] = useState(false);

  const needsPayment = booking?.payment_status === 'pending' && booking?.status !== 'cancelled';
  const invoicePdfUrl = booking?.invoice_url || invoice?.pdf_url;

  const handlePaid = async (updatedBooking) => {
    setBooking(updatedBooking);
    setPaidNotice(true);
    try {
      const invoiceRes = await bookingsApi.invoice(id);
      if (invoiceRes?.data) setInvoice(invoiceRes.data);
    } catch {
      // Invoice may lag slightly; voucher still shows paid state.
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data: bookingData } = await bookingsApi.get(id);
        if (cancelled) return;
        setBooking(bookingData);
        const [roomRes, invoiceRes, reviewRes] = await Promise.all([
          roomsApi.get(bookingData.room_id),
          bookingsApi.invoice(id).catch(() => null),
          reviewsApi.byBooking(id).catch(() => ({ data: { can_review: false, has_review: false } })),
        ]);
        if (cancelled) return;
        setRoom(roomRes.data);
        if (invoiceRes?.data) setInvoice(invoiceRes.data);
        setReviewState(reviewRes.data || { can_review: false, has_review: false });
      } catch (err) {
        if (!cancelled) {
          setError(err.normalized?.message || 'Voucher not found');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Spinner label="Loading voucher..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!booking || !room) return null;

  return (
    <div className="receipt-page">
      {needsPayment && (
        <MockPaymentPanel
          bookingId={booking._id}
          totalPrice={booking.total_price}
          onPaid={handlePaid}
        />
      )}

      {booking.payment_status === 'paid' && (
        <div className="mock-payment-success no-print" role="status">
          <CheckCircle2 size={20} />
          <span>Booking confirmed. Your GST invoice is ready to download below.</span>
        </div>
      )}

      {paidNotice && (
        <div className="mock-payment-success no-print" role="status">
          <CheckCircle2 size={20} />
          <span>Payment successful. Your GST invoice has been emailed to you.</span>
        </div>
      )}

      {reviewState.can_review && (
        <div className="rate-stay-banner no-print">
          <div>
            <strong>How was your stay?</strong>
            <p>Rate {room.title} and help other travellers.</p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setReviewOpen(true)}>
            <Star size={14} /> Rate hotel
          </button>
        </div>
      )}

      {reviewState.has_review && (
        <div className="rate-stay-banner rate-stay-banner--done no-print" role="status">
          <CheckCircle2 size={18} />
          <span>Thanks — you&apos;ve already reviewed this stay.</span>
        </div>
      )}

      <div className="receipt-page__actions no-print">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
          <Printer size={16} /> Print voucher
        </button>
        {invoicePdfUrl && (
          <a href={invoicePdfUrl} className="btn btn-primary btn-sm" target="_blank" rel="noreferrer" download>
            <Download size={16} /> Download invoice (PDF)
          </a>
        )}
      </div>
      <HotelVoucher booking={booking} room={room} invoice={invoice} />
      <WriteReviewModal
        open={reviewOpen}
        booking={booking}
        roomTitle={room.title}
        onClose={() => setReviewOpen(false)}
        onSubmitted={() => {
          setReviewState({ can_review: false, has_review: true });
        }}
      />
    </div>
  );
}
