import { Wallet } from 'lucide-react';
import { formatCurrency } from '../../api/api';

const MOCK_PAYOUTS = [
  { id: 1, date: '2025-05-15', amount: 45000, status: 'paid', method: 'Bank transfer' },
  { id: 2, date: '2025-04-15', amount: 38200, status: 'paid', method: 'Bank transfer' },
  { id: 3, date: '2025-06-01', amount: 12500, status: 'pending', method: 'Bank transfer' },
];

export default function Payouts() {
  const total = MOCK_PAYOUTS.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pending = MOCK_PAYOUTS.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <h1 className="page-title">Payouts</h1>
      <div className="stat-cards">
        <div className="stat-card card"><div className="stat-card__label">Total paid out</div><div className="stat-card__value">{formatCurrency(total)}</div></div>
        <div className="stat-card card"><div className="stat-card__label">Pending</div><div className="stat-card__value">{formatCurrency(pending)}</div></div>
        <div className="stat-card card"><div className="stat-card__label"><Wallet size={16} /> Next payout</div><div className="stat-card__value">Jun 15</div></div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th></tr>
          </thead>
          <tbody>
            {MOCK_PAYOUTS.map((p) => (
              <tr key={p.id}>
                <td>{p.date}</td>
                <td>{formatCurrency(p.amount)}</td>
                <td>{p.method}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
