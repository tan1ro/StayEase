import { useEffect, useState } from 'react';
import { Percent, Tag, Ticket } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import Badge from '../../components/Badge';
import DatePicker from '../../components/DatePicker';
import {
  HostEmpty,
  HostHero,
  HostKpi,
  HostKpiGrid,
  HostList,
  HostListItem,
  HostPage,
  HostPanel,
} from '../../components/host/HostPageLayout';
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

  if (loading) return <Spinner label="Loading offers..." />;

  const active = offers.filter((o) => o.is_active && !isExpired(o)).length;

  return (
    <HostPage>
      <HostHero
        title="Offers"
        subtitle="Create promo codes for guests — percentage or flat discounts with usage limits."
        pills={[`${offers.length} total`, `${active} active`]}
      />

      <HostKpiGrid>
        <HostKpi icon={Tag} variant="bookings" label="Active offers" value={active} hint="Currently redeemable" />
        <HostKpi icon={Ticket} variant="earnings" label="Total codes" value={offers.length} hint="All time" />
        <HostKpi icon={Percent} variant="rating" label="Most used" value={offers.length ? Math.max(...offers.map((o) => o.used_count || 0)) : 0} hint="Redemptions" />
        <HostKpi icon={Tag} variant="occupancy" label="Expired" value={offers.filter(isExpired).length} hint="Needs renewal" />
      </HostKpiGrid>

      <ErrorMessage message={error} />

      <HostPanel title="Create offer">
        <form onSubmit={create}>
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
          <button type="submit" className="btn btn-primary">Create offer</button>
        </form>
      </HostPanel>

      <HostPanel title="Your offers" subtitle={`${offers.length} promo code${offers.length !== 1 ? 's' : ''}`}>
        {offers.length === 0 ? (
          <HostEmpty title="No offers yet" description="Create a promo code above to attract more bookings." />
        ) : (
          <HostList>
            {offers.map((o) => {
              const expired = isExpired(o);
              const pct = usagePercent(o);
              return (
                <HostListItem
                  key={o._id}
                  title={o.code}
                  meta={`${o.type === 'percentage' ? `${o.value}%` : formatCurrency(o.value)} off · Min ${formatCurrency(o.min_booking_amount || 0)} · Used ${o.used_count || 0}/${o.usage_limit || '∞'}`}
                  value={(
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                      <Badge variant={expired ? 'danger' : o.is_active ? 'success' : 'warning'}>
                        {expired ? 'Expired' : o.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {o.usage_limit ? (
                        <div style={{ width: 80, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 90 ? '#E85D75' : '#4F7FE8' }} />
                        </div>
                      ) : null}
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {!expired && (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => toggle(o)}>
                            {o.is_active ? 'Pause' : 'Activate'}
                          </button>
                        )}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(o)}>Delete</button>
                      </div>
                    </div>
                  )}
                />
              );
            })}
          </HostList>
        )}
      </HostPanel>
    </HostPage>
  );
}
