import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import Badge from '../../components/Badge';
import DatePicker from '../../components/DatePicker';
import { offersApi } from '../../api/api';

export default function ManageOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: 10,
    min_booking_amount: 1000,
    max_discount: 500,
    valid_from: '',
    valid_until: '',
    usage_limit: 100,
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await offersApi.list();
      setOffers(data);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await offersApi.create(form);
      setForm({ code: '', type: 'percentage', value: 10, min_booking_amount: 1000, max_discount: 500, valid_from: '', valid_until: '', usage_limit: 100 });
      load();
    } catch (err) {
      setError(err.normalized?.message || 'Create failed');
    }
  };

  const toggle = async (offer) => {
    await offersApi.update(offer._id, { is_active: !offer.is_active });
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Manage Offers</h1>
      <ErrorMessage message={error} />
      <form onSubmit={create} className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2>Create Offer</h2>
        <div className="form-row">
          <div className="form-group"><label className="label">Code</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
          <div className="form-group">
            <label className="label">Type</label>
            <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percentage">Percentage</option>
              <option value="flat">Flat</option>
            </select>
          </div>
          <div className="form-group"><label className="label">Value</label><input type="number" className="input" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <DatePicker label="Valid from" value={form.valid_from} onChange={(v) => setForm({ ...form, valid_from: v })} required />
          </div>
          <div className="form-group">
            <DatePicker label="Valid until" value={form.valid_until} onChange={(v) => setForm({ ...form, valid_until: v })} min={form.valid_from || undefined} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Create Offer</button>
      </form>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o._id}>
                <td>{o.code}</td>
                <td>{o.type}</td>
                <td>{o.value}{o.type === 'percentage' ? '%' : ' INR'}</td>
                <td>{o.used_count}/{o.usage_limit}</td>
                <td>
                  <Badge variant={o.is_active ? 'success' : 'danger'}>
                    {o.valid_until < new Date().toISOString().split('T')[0] ? 'Expired' : o.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => toggle(o)}>
                    {o.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
