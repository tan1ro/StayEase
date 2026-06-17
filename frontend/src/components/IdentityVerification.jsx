import { useState } from 'react';
import { Shield, Upload } from 'lucide-react';
import { authApi } from '../api/api';
import StatusBadge from './StatusBadge';
import ErrorMessage from './ErrorMessage';
import Modal from './Modal';
import Spinner from './Spinner';

export default function IdentityVerification({ verified = false, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [idType, setIdType] = useState('aadhar');
  const [idNumber, setIdNumber] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a document');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('id_type', idType);
      fd.append('id_number', idNumber);
      fd.append('document', file);
      await authApi.verifyIdentity(fd);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err.normalized?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="identity-verification">
      <div className="identity-verification__header">
        <Shield size={20} />
        <span>Identity Verification</span>
        <StatusBadge status={verified ? 'verified' : 'pending'} />
      </div>
      {!verified && (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>
          <Upload size={14} /> Upload ID Proof
        </button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Verify Identity">
        <form onSubmit={handleSubmit}>
          <ErrorMessage message={error} />
          <div className="form-group">
            <label className="label">ID Type</label>
            <select className="select" value={idType} onChange={(e) => setIdType(e.target.value)}>
              <option value="aadhar">Aadhar (12 digits)</option>
              <option value="pan">PAN (AAAAA9999A)</option>
              <option value="passport">Passport</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">ID Number</label>
            <input className="input" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Document</label>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0])} required />
          </div>
          {loading ? <Spinner size={24} label="" /> : (
            <button type="submit" className="btn btn-primary">Submit</button>
          )}
        </form>
      </Modal>
      <style>{`
        .identity-verification__header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
      `}</style>
    </div>
  );
}
