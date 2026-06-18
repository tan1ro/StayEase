import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import Badge from '../../components/Badge';
import DatePicker from '../../components/DatePicker';
import { deleteOffer, formatCurrency, offersApi } from '../../api/api';

function isExpired(offer) {
  const today = new Date().toISOString().split('T')[0];
  return offer.valid_until && offer.valid_until < today;
}

function usagePercent(offer) {
  if (!offer.usage_limit) return 0;
  return Math.min(100, Math.round(((offer.used_count || 0) / offer.usage_limit) * 100));
}

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

  const remove = async (offer) => {
    if (!window.confirm(`Delete offer ${offer.code}?`)) return;
    try {
      await deleteOffer(offer._id);
      load();
    } catch (err) {
      setError(err.normalized?.message || 'Delete failed');
    }
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
          <div className="form-group"><label className="label">Min booking amount</label><input type="number" className="input" value={form.min_booking_amount} onChange={(e) => setForm({ ...form, min_booking_amount: Number(e.target.value) })} /></div>
          <div className="form-group"><label className="label">Max discount</label><input type="number" className="input" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: Number(e.target.value) })} /></div>
          <div className="form-group"><label className="label">Usage limit</label><input type="number" className="input" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })} /></div>
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
            <tr><th>Code</th><th>Type</th><th>Value</th><th>Min amount</th><th>Usage</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {offers.map((o) => {
              const expired = isExpired(o);
              const pct = usagePercent(o);
              return (
                <tr key={o._id}>
                  <td><strong>{o.code}</strong></td>
                  <td>{o.type}</td>
                  <td>{o.value}{o.type === 'percentage' ? '%' : ' INR'}</td>
                  <td>{formatCurrency(o.min_booking_amount || 0)}</td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ fontSize: '0.85rem', marginBottom: 4 }}>{o.used_count || 0}/{o.usage_limit || '∞'}</div>
                    {o.usage_limit ? (
                      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 90 ? '#E85D75' : '#4F7FE8' }} />
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <Badge variant={expired ? 'danger' : o.is_active ? 'success' : 'warning'}>
                      {expired ? 'Expired' : o.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!expired && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => toggle(o)}>
                        {o.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(o)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
