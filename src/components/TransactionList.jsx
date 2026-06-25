import { useState } from 'react';
import { getCategory } from '../utils/categories';
import { formatDate } from '../utils/format';
import { useCurrency } from '../context/CurrencyContext';
import { exportCSV } from '../utils/export';

export default function TransactionList({ transactions, onDelete }) {
  const { format } = useCurrency();
  const [pendingId, setPendingId] = useState(null);
  const [search, setSearch]       = useState('');

  const filtered = transactions
    .filter((t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      getCategory(t.category).label.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="list-card">
      <div className="list-card__header">
        <h3 className="list-card__title">Movimientos</h3>
        <div className="list-card__actions">
          <span className="list-card__count">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
          {transactions.length > 0 && (
            <button className="btn-export" onClick={() => exportCSV(transactions)} title="Exportar a CSV">
              ↓ CSV
            </button>
          )}
        </div>
      </div>

      {transactions.length > 3 && (
        <div className="tx-search-wrap">
          <span className="tx-search-icon">🔍</span>
          <input
            className="tx-search"
            type="search"
            placeholder="Buscar descripción o categoría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="tx-search-clear" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">✕</button>
          )}
        </div>
      )}

      {filtered.length === 0 && transactions.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">Sin movimientos este mes.</p>
          <p className="empty-state__hint">Pulsa "+ Nuevo movimiento" para empezar.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">Nada para "{search}"</p>
        </div>
      ) : (
        <ul className="tx-list">
          {filtered.map((t) => {
            const cat = getCategory(t.category);
            return (
              <li
                key={t.id}
                className="tx-item"
                style={{ '--tx-color': cat.color }}
              >
                <span
                  className="tx-icon"
                  style={{ background: cat.color + '18', color: cat.color }}
                >
                  {cat.icon}
                </span>
                <div className="tx-info">
                  <p className="tx-desc">{t.description}</p>
                  <p className="tx-meta">{cat.label} · {formatDate(t.date)}</p>
                </div>
                <div className="tx-right">
                  <span className={`tx-amount tx-amount--${t.type}`}>
                    {t.type === 'income' ? '+' : '−'}{format(t.amount)}
                  </span>
                  {pendingId === t.id ? (
                    <span className="tx-confirm">
                      <button className="btn-delete-confirm" onClick={() => { onDelete(t.id); setPendingId(null); }}>
                        Eliminar
                      </button>
                      <button className="btn-delete-cancel" onClick={() => setPendingId(null)}>
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button className="tx-delete" onClick={() => setPendingId(t.id)} aria-label="Eliminar">✕</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
