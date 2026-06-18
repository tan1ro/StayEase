import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, FileText, Printer, Receipt as ReceiptIcon } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import MockPaymentPanel from '../../components/MockPaymentPanel';
import HotelVoucher from '../../components/HotelVoucher';
import TaxInvoice from '../../components/TaxInvoice';
import { bookingsApi, downloadBlob, hostsApi, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function Receipt() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [room, setRoom] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [hostPhone, setHostPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('voucher');
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data: bookingData } = await bookingsApi.get(id);
        if (cancelled) return;
        setBooking(bookingData);
        const [{ data: roomData }] = await Promise.all([
          roomsApi.get(bookingData.room_id),
        ]);
        if (!cancelled) setRoom(roomData);
        if (bookingData.payment_status === 'paid') {
          try {
            const { data: invoiceData } = await bookingsApi.invoice(id);
            if (!cancelled) setInvoice(invoiceData);
          } catch {
            /* invoice may not exist for legacy bookings */
          }
        }
        if (roomData?.host_id) {
          try {
            const { data: hostProfile } = await hostsApi.getProfile(roomData.host_id);
            if (!cancelled) setHostPhone(hostProfile?.phone || '');
          } catch {
            /* optional */
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.normalized?.message || 'Receipt not found');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const isPaid = booking?.payment_status === 'paid';
  const receiptUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receipt/${id}`
    : `/receipt/${id}`;

  const handleDownload = async (type) => {
    if (!isPaid) return;
    setDownloading(type);
    try {
      const apiCall = type === 'voucher'
        ? bookingsApi.downloadVoucherPdf
        : bookingsApi.downloadTaxInvoicePdf;
      const { data } = await apiCall(id);
      const suffix = invoice?.invoice_number || String(id).slice(-6);
      const filename = type === 'voucher'
        ? `StayEase-Voucher-${suffix}.pdf`
        : `StayEase-Tax-Invoice-${suffix}.pdf`;
      downloadBlob(data, filename);
    } catch (err) {
      setError(err.normalized?.message || 'Could not download PDF');
    } finally {
      setDownloading('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Spinner label="Loading receipt..." />;
  if (error && !booking) return <ErrorMessage message={error} />;
  if (!booking || !room) return null;

  const needsPayment = booking.payment_status === 'pending' && booking.status !== 'cancelled';

  return (
    <div className="receipt-page">
      {needsPayment && (
        <div className="no-print">
          <MockPaymentPanel
            bookingId={booking._id || booking.id}
            totalPrice={booking.total_price}
            onPaid={(updated) => setBooking(updated)}
          />
        </div>
      )}

      {error && <div className="no-print"><ErrorMessage message={error} /></div>}

      <div className="receipt-page__actions no-print">
        <div className="receipt-page__tabs" role="tablist" aria-label="Document type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'voucher'}
            className={`receipt-page__tab${tab === 'voucher' ? ' receipt-page__tab--active' : ''}`}
            onClick={() => setTab('voucher')}
          >
            <ReceiptIcon size={16} aria-hidden />
            Booking Voucher
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'invoice'}
            className={`receipt-page__tab${tab === 'invoice' ? ' receipt-page__tab--active' : ''}`}
            onClick={() => setTab('invoice')}
          >
            <FileText size={16} aria-hidden />
            Tax Invoice
          </button>
        </div>
        <div className="receipt-page__download-actions">
          {isPaid && (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={Boolean(downloading)}
                onClick={() => handleDownload(tab === 'invoice' ? 'invoice' : 'voucher')}
              >
                <Download size={16} />
                {downloading ? 'Downloading…' : `Download ${tab === 'invoice' ? 'Invoice' : 'Voucher'} PDF`}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={Boolean(downloading)}
                onClick={() => handleDownload('voucher')}
              >
                <Download size={16} /> Voucher PDF
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={Boolean(downloading)}
                onClick={() => handleDownload('invoice')}
              >
                <Download size={16} /> Invoice PDF
              </button>
            </>
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
          <Link to="/bookings" className="btn btn-ghost btn-sm">My Bookings</Link>
        </div>
      </div>

      <div className="receipt-page__document" role="tabpanel">
        {tab === 'voucher' ? (
          <HotelVoucher
            booking={booking}
            room={room}
            invoice={invoice}
            hostPhone={hostPhone}
            qrData={receiptUrl}
          />
        ) : (
          <TaxInvoice
            booking={booking}
            room={room}
            invoice={invoice}
            guestEmail={user?.email || booking.guest_email}
          />
        )}
      </div>
    </div>
  );
}
