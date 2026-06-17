import { Camera, CreditCard, ShieldCheck } from 'lucide-react';
import { Icon, ICON } from './ui/Icon';

function idTypeLabel(type) {
  if (type === 'aadhar') return 'Aadhar';
  if (type === 'pan') return 'PAN';
  if (type === 'passport') return 'Passport';
  return 'ID';
}

export default function CheckInVerificationCard({ booking, showBooker = false }) {
  const verification = booking?.check_in_verification;
  if (!verification) return null;

  const isOther = verification.booking_for === 'other';
  const proof = verification.identity_proof;

  return (
    <div className="check-in-verification card">
      <div className="check-in-verification__header">
        <Icon icon={ShieldCheck} size={ICON.md} />
        <h3>Check-in verification</h3>
      </div>
      <p className="check-in-verification__note">{verification.check_in_note}</p>

      {showBooker && booking.booker_name && booking.booker_name !== booking.guest_name && (
        <p><strong>Booked by:</strong> {booking.booker_name}</p>
      )}

      {isOther ? (
        <>
          <p><strong>Staying guest:</strong> {verification.staying_guest_name || booking.guest_name}</p>
          {verification.staying_guest_phone && (
            <p><strong>Guest phone:</strong> {verification.staying_guest_phone}</p>
          )}
          {verification.guest_photo_url && (
            <div className="check-in-verification__media">
              <p className="check-in-verification__media-label">
                <Icon icon={Camera} size={ICON.sm} /> Guest photograph
              </p>
              <img src={verification.guest_photo_url} alt="Guest check-in photograph" />
            </div>
          )}
        </>
      ) : (
        proof && (
          <>
            <p>
              <strong>ID type:</strong> {idTypeLabel(proof.type)}
            </p>
            <p>
              <strong>ID number:</strong> {proof.number}
            </p>
            {proof.document_url && (
              <div className="check-in-verification__media">
                <p className="check-in-verification__media-label">
                  <Icon icon={CreditCard} size={ICON.sm} /> Government ID proof
                </p>
                {proof.document_url.toLowerCase().endsWith('.pdf') ? (
                  <a href={proof.document_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    View ID document (PDF)
                  </a>
                ) : (
                  <img src={proof.document_url} alt="Government ID proof" />
                )}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
