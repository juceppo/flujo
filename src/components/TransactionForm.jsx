import { useState } from 'react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import { useCurrency } from '../context/CurrencyContext';

export default function TransactionForm({ onAdd, onClose }) {
  const { currency } = useCurrency();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    type: 'expense', category: 'food',
    description: '', amount: '', date: today,
  });
  const [error, setError] = useState('');

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleTypeChange = (type) =>
    setForm((f) => ({ ...f, type, category: type === 'income' ? 'salary' : 'food' }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim()) return setError('Añade una descripción.');
    if (!form.amount || +form.amount <= 0) return setError('El importe debe ser mayor a 0.');
    setError('');
    onAdd(form);
    onClose();
  };

  const isIncome = form.type === 'income';

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <div>
            <h2 className="modal__title">Nuevo movimiento</h2>
            <p className="modal__sub">Moneda activa: <strong>{currency.code} — {currency.label?.split('—')[1]?.trim()}</strong></p>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn type-btn--expense ${!isIncome ? 'active' : ''}`}
              onClick={() => handleTypeChange('expense')}
            >
              <span className="type-btn__icon">↓</span> Gasto
            </button>
            <button
              type="button"
              className={`type-btn type-btn--income ${isIncome ? 'active' : ''}`}
              onClick={() => handleTypeChange('income')}
            >
              <span className="type-btn__icon">↑</span> Ingreso
            </button>
          </div>

          <div className="form-field">
            <label className="form-label">Descripción</label>
            <input
              className="form-input"
              type="text"
              placeholder={isIncome ? 'Ej: Salario de enero' : 'Ej: Compra en supermercado'}
              value={form.description}
              onChange={set('description')}
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Importe ({currency.code})</label>
              <div className="amount-input-wrap">
                <span className="amount-input-symbol">{currency.code === 'EUR' ? '€' : currency.code === 'GBP' ? '£' : '$'}</span>
                <input
                  className="form-input amount-input"
                  type="number"
                  placeholder="0"
                  min="0.01"
                  step="any"
                  value={form.amount}
                  onChange={set('amount')}
                />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Fecha</label>
              <input className="form-input" type="date" value={form.date} onChange={set('date')} />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Categoría</label>
            <div className="category-grid">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`category-chip ${form.category === c.id ? 'category-chip--active' : ''}`}
                  style={form.category === c.id ? { borderColor: c.color, background: c.color + '18', color: c.color } : {}}
                  onClick={() => setForm((f) => ({ ...f, category: c.id }))}
                >
                  <span>{c.icon}</span>
                  <span className="category-chip__label">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="form-error">⚠ {error}</p>}

          <button type="submit" className={`btn-submit btn-submit--${form.type}`}>
            {isIncome ? '↑ Registrar ingreso' : '↓ Registrar gasto'}
          </button>
        </form>
      </div>
    </div>
  );
}
