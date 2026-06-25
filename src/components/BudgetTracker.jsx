import { useState } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import { useCurrency } from '../context/CurrencyContext';
import { EXPENSE_CATEGORIES, getCategory } from '../utils/categories';

function BudgetBar({ pct, color }) {
  const clamped = Math.min(pct, 100);
  const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : color;
  return (
    <div className="budget-bar">
      <div className="budget-bar__fill" style={{ width: `${clamped}%`, background: barColor }} />
    </div>
  );
}

export default function BudgetTracker({ transactions }) {
  const { budgets, setBudget } = useBudgets();
  const { format } = useCurrency();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  const byCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});

  const rows = EXPENSE_CATEGORIES
    .map((cat) => {
      const spent  = byCategory[cat.id] || 0;
      const budget = budgets[cat.id] || 0;
      const pct    = budget > 0 ? Math.round((spent / budget) * 100) : 0;
      return { ...cat, spent, budget, pct };
    })
    .filter((r) => r.budget > 0 || r.spent > 0)
    .sort((a, b) => b.pct - a.pct);

  const openEdit = () => {
    const d = {};
    EXPENSE_CATEGORIES.forEach((c) => { d[c.id] = budgets[c.id] ?? ''; });
    setDraft(d);
    setEditing(true);
  };

  const saveEdit = () => {
    Object.entries(draft).forEach(([cat, val]) => {
      if (val !== '' && Number(val) >= 0) setBudget(cat, val);
    });
    setEditing(false);
  };

  return (
    <div className="budget-card">
      <div className="budget-card__header">
        <div>
          <h3 className="budget-card__title">Presupuesto del mes</h3>
          <p className="budget-card__sub">
            {rows.filter((r) => r.pct >= 100).length > 0
              ? `⚠ ${rows.filter((r) => r.pct >= 100).length} categoría${rows.filter((r) => r.pct >= 100).length > 1 ? 's' : ''} al límite`
              : 'Todo bajo control'}
          </p>
        </div>
        <button className="btn-edit-budget" onClick={editing ? saveEdit : openEdit}>
          {editing ? '✓ Guardar' : '✎ Editar'}
        </button>
      </div>

      {editing ? (
        <div className="budget-edit-grid">
          {EXPENSE_CATEGORIES.map((cat) => (
            <div key={cat.id} className="budget-edit-row">
              <span className="budget-edit-icon" style={{ color: cat.color }}>{cat.icon}</span>
              <span className="budget-edit-label">{cat.label}</span>
              <input
                className="budget-edit-input"
                type="number"
                min="0"
                placeholder="0"
                value={draft[cat.id] ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, [cat.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="budget-rows">
          {rows.length === 0 ? (
            <p className="budget-empty">Sin presupuesto configurado. Pulsa <strong>Editar</strong> para establecer límites.</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="budget-row">
                <div className="budget-row__top">
                  <div className="budget-row__label">
                    <span className="budget-row__icon" style={{ color: r.color }}>{r.icon}</span>
                    <span className="budget-row__name">{r.label}</span>
                    {r.pct >= 100 && <span className="budget-row__badge budget-row__badge--over">Límite</span>}
                    {r.pct >= 80 && r.pct < 100 && <span className="budget-row__badge budget-row__badge--warn">Cerca</span>}
                  </div>
                  <div className="budget-row__amounts">
                    <span className="budget-row__spent" style={{ color: r.pct >= 100 ? '#ef4444' : 'inherit' }}>
                      {format(r.spent)}
                    </span>
                    {r.budget > 0 && (
                      <span className="budget-row__limit">/ {format(r.budget)}</span>
                    )}
                  </div>
                </div>
                {r.budget > 0 && <BudgetBar pct={r.pct} color={r.color} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
