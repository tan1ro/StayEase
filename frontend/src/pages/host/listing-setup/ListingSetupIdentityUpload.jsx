import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ErrorMessage from '../../../components/ErrorMessage';
import HostSetupShell from '../../../components/host/HostSetupShell';
import Spinner from '../../../components/Spinner';
import { authApi } from '../../../api/api';
import { useAuth } from '../../../context/AuthContext';
import { useListingSetupRoom } from '../../../hooks/useListingSetupRoom';

export default function ListingSetupIdentityUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method') === 'aadhaar' ? 'aadhaar' : 'document';
  const { room, loading, setupQuery } = useListingSetupRoom();
  const { refreshUser } = useAuth();

  const [idType, setIdType] = useState(method === 'aadhaar' ? 'aadhar' : 'pan');
  const [idNumber, setIdNumber] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a photo or PDF of your ID.');
      return;
    }
    if (!idNumber.trim()) {
      setError('Please enter your ID number.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('id_type', idType);
      fd.append('id_number', idNumber.trim());
      fd.append('document', file);
      await authApi.verifyIdentity(fd);
      await refreshUser();
      navigate(`/host/listings/setup${setupQuery}`);
    } catch (err) {
      setError(err.normalized?.message || 'Could not submit identity verification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HostSetupShell
      room={room}
      roomLoading={loading}
      onBack={() => navigate(`/host/listings/setup/identity${setupQuery}`)}
      onNext={handleSubmit}
      nextLabel={submitting ? 'Submitting…' : 'Submit'}
      nextDisabled={submitting}
    >
      <div className="host-setup-page host-setup-page--narrow">
        <h1 className="host-setup-page__title">
          {method === 'aadhaar' ? 'Confirm your Aadhaar details' : 'Upload your ID'}
        </h1>
        <p className="host-setup-page__subtitle">
          {method === 'aadhaar'
            ? 'Upload your Aadhaar or a DigiLocker export. StayEase reviews documents within 24 hours.'
            : 'Use a clear photo of your PAN card, passport, or driving licence.'}
        </p>

        <ErrorMessage message={error} />

        {method === 'document' && (
          <div className="form-group">
            <label className="label" htmlFor="id-type">ID type</label>
            <select
              id="id-type"
              className="select"
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
            >
              <option value="pan">PAN card</option>
              <option value="passport">Passport</option>
              <option value="aadhar">Aadhaar</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="label" htmlFor="id-number">
            {method === 'aadhaar' || idType === 'aadhar' ? 'Aadhaar number' : 'ID number'}
          </label>
          <input
            id="id-number"
            className="input"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder={idType === 'aadhar' ? '12-digit Aadhaar' : 'Enter ID number'}
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="id-document">Document</label>
          <input
            id="id-document"
            type="file"
            className="input"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {submitting && <Spinner size={24} label="Uploading document" />}
      </div>
    </HostSetupShell>
  );
}
