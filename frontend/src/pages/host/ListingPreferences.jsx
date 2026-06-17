import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import HostSideNav from '../../components/host/HostSideNav';
import { Icon, ICON } from '../../components/ui/Icon';
import { roomsApi } from '../../api/api';

const SECTIONS = [
  { id: 'status', label: 'Listing status', sub: 'Action required', dot: true },
  { id: 'languages', label: 'Languages', sub: 'English' },
  { id: 'guests', label: 'Guest requirements', sub: 'Profile photo not required' },
  { id: 'laws', label: 'Local laws', sub: 'Review Indian hospitality laws' },
  { id: 'taxes', label: 'Taxes', sub: 'GST invoicing on StayEase' },
  { id: 'remove', label: 'Remove listing', sub: 'Permanently remove your listing' },
];

const REMOVE_REASONS = [
  'I\'m no longer able to host.',
  'I\'m not ready to host right now.',
  'I expected more from StayEase.',
  'I was hoping to make more money.',
  'I expected things to go more smoothly with guests.',
  'This is a duplicate listing.',
];

export default function ListingPreferences() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [section, setSection] = useState('status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removeStep, setRemoveStep] = useState(null);
  const [selectedReasons, setSelectedReasons] = useState([]);

  useEffect(() => {
    roomsApi.get(id)
      .then(({ data }) => setRoom(data))
      .catch((err) => setError(err.normalized?.message || 'Listing not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
    );
  };

  const handleRemove = async () => {
    try {
      await roomsApi.remove(id);
      navigate('/host/rooms');
    } catch (err) {
      setError(err.normalized?.message || 'Remove failed');
    }
  };

  if (loading) return <Spinner />;
  if (error && !room) return <ErrorMessage message={error} />;

  return (
    <div className="host-page host-split">
      <div className="host-split__sidebar-wrap">
        <Link to={`/host/rooms/${id}/editor`} className="host-editor__back" style={{ marginBottom: '1rem' }}>
          <Icon icon={ArrowLeft} size={ICON.md} />
        </Link>
        <HostSideNav
          title="Edit preferences"
          items={SECTIONS.map((s) => ({ ...s, onClick: setSection }))}
          activeId={section}
        />
      </div>

      <div className="host-split__main">
        {section === 'status' && (
          <>
            <h1>Listing status</h1>
            <div className="host-empty-card">
              <div className="host-empty-card__art host-empty-card__art--house">
                <Icon icon={Building2} size={64} />
              </div>
              <h2>Finish up some final tasks</h2>
              <p>
                {room?.is_available
                  ? 'Your listing is live on StayEase. Guests can book with GST-inclusive pricing.'
                  : 'Before you can publish, complete photos, title, description, and pricing in the listing editor.'}
              </p>
              {!room?.is_available && (
                <Link to={`/host/rooms/${id}/editor`} className="btn btn-primary">Let&apos;s go</Link>
              )}
            </div>
          </>
        )}

        {section === 'taxes' && (
          <>
            <h1>Taxes</h1>
            <p className="host-page__subtitle">StayEase handles CGST &amp; SGST automatically on every booking. Guests receive tax invoices by email.</p>
          </>
        )}

        {section === 'remove' && (
          <>
            <h1>Remove listing</h1>
            <p className="host-page__subtitle">Permanently remove &ldquo;{room?.title}&rdquo; from StayEase.</p>
            <button type="button" className="btn btn-outline" onClick={() => setRemoveStep('reasons')}>
              Remove this listing
            </button>
          </>
        )}

        {section !== 'status' && section !== 'taxes' && section !== 'remove' && (
          <>
            <h1>{SECTIONS.find((s) => s.id === section)?.label}</h1>
            <p className="host-page__subtitle">{SECTIONS.find((s) => s.id === section)?.sub}</p>
          </>
        )}
      </div>

      <Modal open={removeStep === 'reasons'} onClose={() => setRemoveStep(null)} title="Let us know why you've changed your mind">
        <p className="host-page__subtitle">Choose all that apply</p>
        <div className="host-remove-list">
          {REMOVE_REASONS.map((reason) => (
            <label key={reason} className="host-remove-row">
              <span>{reason}</span>
              <input
                type="checkbox"
                checked={selectedReasons.includes(reason)}
                onChange={() => toggleReason(reason)}
              />
            </label>
          ))}
        </div>
        <div className="host-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setRemoveStep(null)}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedReasons.length}
            onClick={() => setRemoveStep('confirm')}
          >
            Next
          </button>
        </div>
      </Modal>

      <Modal open={removeStep === 'confirm'} onClose={() => setRemoveStep(null)}>
        <h2 className="host-publish-modal__title">Remove this listing?</h2>
        <p className="host-publish-modal__text">This is permanent — you&apos;ll no longer be able to find or edit this listing.</p>
        <div className="host-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setRemoveStep(null)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleRemove}>Yes, remove</button>
        </div>
      </Modal>

      <ErrorMessage message={error} />
    </div>
  );
}
