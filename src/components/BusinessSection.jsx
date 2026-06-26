import { useState } from 'react';
import { useBusiness } from '../hooks/useBusiness';
import { useCurrency } from '../context/CurrencyContext';

const PAY_LABELS  = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', otro: 'Otro' };
const PAY_COLORS  = { efectivo: '#059669', tarjeta: '#2563eb', transferencia: '#7c3aed', otro: '#6b7280' };
const UNITS       = ['unidad', 'kg', 'g', 'litro', 'ml', 'caja', 'paquete', 'docena', 'par'];
const PERIODS     = [
  { key: 'today', label: 'Hoy' },
  { key: 'week',  label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
];

// ── Stat card ────────────────────────────────────────────────────
function BizStat({ icon, label, value, sub, accent }) {
  return (
    <div className="biz-stat">
      <span className="biz-stat__icon">{icon}</span>
      <div>
        <p className="biz-stat__label">{label}</p>
        <p className="biz-stat__value" style={{ color: accent }}>{value}</p>
        {sub && <p className="biz-stat__sub">{sub}</p>}
      </div>
    </div>
  );
}

// ── Resumen ──────────────────────────────────────────────────────
function BizResumen({ biz, format }) {
  const [period, setPeriod] = useState('today');
  const total    = biz.totalIn(period);
  const profit   = biz.profitIn(period);
  const breakdown = biz.paymentBreakdown(period);
  const top      = biz.topProducts(period);
  const recentSales = biz.sales.slice(0, 6);

  return (
    <div className="biz-tab-content">
      {/* Period selector */}
      <div className="biz-period-tabs">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={`biz-period-btn ${period === p.key ? 'biz-period-btn--active' : ''}`}
            onClick={() => setPeriod(p.key)}
          >{p.label}</button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="biz-stats-row">
        <BizStat icon="💰" label="Ventas" value={format(total)}
          sub={`${biz.sales.filter(s => s.date >= (period === 'today' ? todayStr() : startOfStr(period))).length} transacciones`}
          accent="#2563eb" />
        {biz.products.some(p => p.cost > 0) && (
          <BizStat icon="📊" label="Ganancia estimada" value={format(profit)}
            sub={total > 0 ? `Margen ~${Math.round((profit/total)*100)}%` : '—'}
            accent={profit >= 0 ? '#059669' : '#dc2626'} />
        )}
        <BizStat icon="📦" label="Productos en stock bajo"
          value={biz.lowStockProducts.length}
          sub={biz.lowStockProducts.length > 0 ? biz.lowStockProducts.map(p => p.name).join(', ') : 'Todo en orden'}
          accent={biz.lowStockProducts.length > 0 ? '#dc2626' : '#059669'} />
        <BizStat icon="🛍️" label="Total productos"
          value={biz.products.length}
          sub={`${biz.products.reduce((s, p) => s + p.stock, 0)} unidades en total`}
          accent="var(--text)" />
      </div>

      <div className="biz-resumen-grid">
        {/* Payment breakdown */}
        {breakdown.length > 0 && (
          <div className="biz-card">
            <h3 className="biz-card__title">Medios de pago</h3>
            <div className="biz-pay-breakdown">
              {breakdown.map(({ method, amount, pct }) => (
                <div key={method} className="biz-pay-row">
                  <div className="biz-pay-info">
                    <span className="biz-pay-dot" style={{ background: PAY_COLORS[method] }} />
                    <span className="biz-pay-name">{PAY_LABELS[method]}</span>
                    <span className="biz-pay-pct">{pct}%</span>
                  </div>
                  <div className="biz-pay-bar-wrap">
                    <div className="biz-pay-bar" style={{ width: `${pct}%`, background: PAY_COLORS[method] }} />
                  </div>
                  <span className="biz-pay-amount">{format(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top products */}
        {top.length > 0 && (
          <div className="biz-card">
            <h3 className="biz-card__title">Más vendidos</h3>
            <div className="biz-top-list">
              {top.map((item, i) => (
                <div key={item.name} className="biz-top-item">
                  <span className="biz-top-rank">{i + 1}</span>
                  <span className="biz-top-name">{item.name}</span>
                  <span className="biz-top-qty">{item.qty} uds.</span>
                  <span className="biz-top-total">{format(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent sales */}
      {recentSales.length > 0 && (
        <div className="biz-card biz-card--full">
          <h3 className="biz-card__title">Últimas ventas</h3>
          <ul className="biz-sale-list">
            {recentSales.map((s) => (
              <SaleRow key={s.id} sale={s} format={format} onDelete={biz.deleteSale} compact />
            ))}
          </ul>
        </div>
      )}

      {total === 0 && biz.sales.length === 0 && (
        <div className="biz-empty">
          <p className="biz-empty__icon">🏪</p>
          <p className="biz-empty__text">No hay ventas registradas todavía.</p>
          <p className="biz-empty__hint">Registra tu primera venta en la pestaña <strong>Nueva venta</strong>.</p>
        </div>
      )}
    </div>
  );
}

// ── Nueva venta ──────────────────────────────────────────────────
function BizNewSale({ biz, format, onSaved }) {
  const empty = { productId: '', productName: '', qty: 1, unitPrice: '', paymentMethod: 'efectivo', note: '', date: todayStr() };
  const [form, setForm] = useState(empty);
  const [mode, setMode]   = useState('inventario'); // 'inventario' | 'manual'
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const selectProduct = (id) => {
    const p = biz.products.find((p) => p.id === id);
    if (p) setForm((f) => ({ ...f, productId: p.id, productName: p.name, unitPrice: p.price }));
    else   setForm((f) => ({ ...f, productId: '', productName: '', unitPrice: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.productName.trim()) return setError('Escribe el nombre del producto.');
    if (!form.unitPrice || +form.unitPrice <= 0) return setError('El precio debe ser mayor a 0.');
    if (+form.qty <= 0) return setError('La cantidad debe ser mayor a 0.');
    if (mode === 'inventario' && form.productId) {
      const p = biz.products.find((p) => p.id === form.productId);
      if (p && p.stock < +form.qty) return setError(`Stock insuficiente. Disponible: ${p.stock} ${p.unit}.`);
    }
    setError('');
    biz.addSale(form);
    setForm(empty);
    onSaved();
  };

  const total = (+form.qty || 0) * (+form.unitPrice || 0);
  const selectedProduct = form.productId ? biz.products.find(p => p.id === form.productId) : null;

  return (
    <div className="biz-tab-content">
      <div className="biz-card biz-card--full">
        <h3 className="biz-card__title">Registrar venta</h3>

        {/* Mode switcher */}
        <div className="biz-mode-switch">
          <button
            type="button"
            className={`biz-mode-btn ${mode === 'inventario' ? 'biz-mode-btn--active' : ''}`}
            onClick={() => { setMode('inventario'); setForm(f => ({ ...f, productId: '', productName: '', unitPrice: '' })); }}
          >Desde inventario</button>
          <button
            type="button"
            className={`biz-mode-btn ${mode === 'manual' ? 'biz-mode-btn--active' : ''}`}
            onClick={() => { setMode('manual'); setForm(f => ({ ...f, productId: '', productName: '', unitPrice: '' })); }}
          >Venta manual</button>
        </div>

        <form onSubmit={handleSubmit} className="biz-form">
          {mode === 'inventario' ? (
            <div className="biz-form-field">
              <label className="form-label">Producto del inventario</label>
              {biz.products.length === 0 ? (
                <p className="biz-hint">No tienes productos en inventario. Agrégalos en la pestaña <strong>Inventario</strong>.</p>
              ) : (
                <select className="form-input" value={form.productId} onChange={(e) => selectProduct(e.target.value)}>
                  <option value="">— Selecciona un producto —</option>
                  {biz.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Stock: {p.stock} {p.unit} — {format(p.price)}
                    </option>
                  ))}
                </select>
              )}
              {selectedProduct && (
                <p className="biz-stock-hint" style={{ color: selectedProduct.stock <= selectedProduct.minStock ? '#dc2626' : 'var(--green)' }}>
                  Stock actual: {selectedProduct.stock} {selectedProduct.unit}
                  {selectedProduct.stock <= selectedProduct.minStock && ' ⚠ Stock bajo'}
                </p>
              )}
            </div>
          ) : (
            <div className="biz-form-field">
              <label className="form-label">Nombre del producto / servicio</label>
              <input className="form-input" type="text" placeholder="Ej: Camisa talla M, Café americano…"
                value={form.productName} onChange={set('productName')} autoFocus />
            </div>
          )}

          <div className="biz-form-row">
            <div className="biz-form-field">
              <label className="form-label">Cantidad</label>
              <input className="form-input" type="number" min="0.1" step="any"
                value={form.qty} onChange={set('qty')} />
            </div>
            <div className="biz-form-field">
              <label className="form-label">Precio unitario</label>
              <input className="form-input" type="number" min="0" step="any" placeholder="0"
                value={form.unitPrice} onChange={set('unitPrice')} />
            </div>
            <div className="biz-form-field">
              <label className="form-label">Fecha</label>
              <input className="form-input" type="date" value={form.date} onChange={set('date')} />
            </div>
          </div>

          {/* Payment method */}
          <div className="biz-form-field">
            <label className="form-label">Medio de pago</label>
            <div className="biz-pay-selector">
              {Object.entries(PAY_LABELS).map(([key, label]) => (
                <button
                  key={key} type="button"
                  className={`biz-pay-chip ${form.paymentMethod === key ? 'biz-pay-chip--active' : ''}`}
                  style={form.paymentMethod === key ? { background: PAY_COLORS[key] + '20', borderColor: PAY_COLORS[key], color: PAY_COLORS[key] } : {}}
                  onClick={() => setForm((f) => ({ ...f, paymentMethod: key }))}
                >{label}</button>
              ))}
            </div>
          </div>

          <div className="biz-form-field">
            <label className="form-label">Nota <span style={{ color: 'var(--text-3)' }}>(opcional)</span></label>
            <input className="form-input" type="text" placeholder="Ej: Cliente: María García"
              value={form.note} onChange={set('note')} />
          </div>

          {error && <p className="form-error">⚠ {error}</p>}

          {total > 0 && (
            <div className="biz-total-preview">
              <span className="biz-total-label">Total a cobrar</span>
              <span className="biz-total-value">{format(total)}</span>
            </div>
          )}

          <button type="submit" className="biz-btn-submit">
            Registrar venta →
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Historial ────────────────────────────────────────────────────
function BizHistorial({ biz, format }) {
  const [filter, setFilter] = useState('all');

  const filtered = biz.sales.filter((s) => {
    if (filter === 'today') return s.date === todayStr();
    if (filter === 'week')  return s.date >= startOfStr('week');
    if (filter === 'month') return s.date >= startOfStr('month');
    return true;
  });

  const total = filtered.reduce((s, v) => s + v.total, 0);

  return (
    <div className="biz-tab-content">
      <div className="biz-filter-row">
        {[{ key: 'today', label: 'Hoy' }, { key: 'week', label: 'Esta semana' }, { key: 'month', label: 'Este mes' }, { key: 'all', label: 'Todo' }].map((f) => (
          <button key={f.key}
            className={`biz-period-btn ${filter === f.key ? 'biz-period-btn--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >{f.label}</button>
        ))}
        {filtered.length > 0 && (
          <span className="biz-filter-total">{filtered.length} ventas · {format(total)}</span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="biz-empty">
          <p className="biz-empty__icon">📋</p>
          <p className="biz-empty__text">No hay ventas en este período.</p>
        </div>
      ) : (
        <div className="biz-card biz-card--full">
          <ul className="biz-sale-list">
            {filtered.map((s) => (
              <SaleRow key={s.id} sale={s} format={format} onDelete={biz.deleteSale} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Inventario ───────────────────────────────────────────────────
function BizInventario({ biz, format }) {
  const [showForm, setShowForm] = useState(false);
  const [addingStock, setAddingStock] = useState(null);
  const [stockDelta, setStockDelta] = useState('');

  const handleAddStock = (id) => {
    if (!stockDelta || +stockDelta === 0) return;
    biz.updateStock(id, +stockDelta);
    setAddingStock(null); setStockDelta('');
  };

  return (
    <div className="biz-tab-content">
      <div className="biz-inv-header">
        <div>
          <p className="biz-inv-summary">
            {biz.products.length} productos · {biz.products.reduce((s, p) => s + p.stock, 0)} unidades en total
          </p>
          {biz.lowStockProducts.length > 0 && (
            <p className="biz-inv-alert">⚠ {biz.lowStockProducts.length} producto{biz.lowStockProducts.length !== 1 ? 's' : ''} con stock bajo</p>
          )}
        </div>
        <button className="biz-btn-add" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '✕ Cancelar' : '+ Agregar producto'}
        </button>
      </div>

      {showForm && <ProductForm onAdd={(data) => { biz.addProduct(data); setShowForm(false); }} />}

      {biz.products.length === 0 && !showForm ? (
        <div className="biz-empty">
          <p className="biz-empty__icon">🗄️</p>
          <p className="biz-empty__text">No tienes productos en el inventario.</p>
          <p className="biz-empty__hint">Agrega tus productos para registrar ventas con control de stock.</p>
          <button className="biz-btn-add biz-btn-add--center" onClick={() => setShowForm(true)}>+ Agregar primer producto</button>
        </div>
      ) : (
        <div className="biz-product-grid">
          {biz.products.map((p) => {
            const isLow = p.stock <= p.minStock;
            return (
              <div key={p.id} className={`biz-product-card ${isLow ? 'biz-product-card--low' : ''}`}>
                <div className="biz-product-card__top">
                  <div>
                    <h4 className="biz-product-name">{p.name}</h4>
                    <p className="biz-product-unit">{p.unit}</p>
                  </div>
                  <button className="btn-goal-delete" onClick={() => biz.deleteProduct(p.id)} aria-label="Eliminar">🗑</button>
                </div>

                <div className="biz-product-prices">
                  <div className="biz-product-price">
                    <span className="biz-product-price__label">Venta</span>
                    <span className="biz-product-price__value">{format(p.price)}</span>
                  </div>
                  {p.cost > 0 && (
                    <div className="biz-product-price">
                      <span className="biz-product-price__label">Costo</span>
                      <span className="biz-product-price__value biz-product-price__value--muted">{format(p.cost)}</span>
                    </div>
                  )}
                  {p.cost > 0 && (
                    <div className="biz-product-price">
                      <span className="biz-product-price__label">Margen</span>
                      <span className="biz-product-price__value" style={{ color: '#059669' }}>
                        {Math.round(((p.price - p.cost) / p.price) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="biz-stock-row">
                  <div>
                    <span className={`biz-stock-badge ${isLow ? 'biz-stock-badge--low' : 'biz-stock-badge--ok'}`}>
                      {isLow ? '⚠' : '✓'} {p.stock} {p.unit}
                    </span>
                    <span className="biz-stock-min">Mín: {p.minStock}</span>
                  </div>
                  {addingStock === p.id ? (
                    <div className="biz-add-stock-form">
                      <input
                        className="form-input biz-stock-input"
                        type="number" placeholder="+10 o −5" autoFocus
                        value={stockDelta}
                        onChange={(e) => setStockDelta(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStock(p.id)}
                      />
                      <button className="biz-stock-ok" onClick={() => handleAddStock(p.id)}>✓</button>
                      <button className="biz-stock-cancel" onClick={() => { setAddingStock(null); setStockDelta(''); }}>✕</button>
                    </div>
                  ) : (
                    <button className="biz-add-stock-btn" onClick={() => setAddingStock(p.id)}>Ajustar stock</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Product form ─────────────────────────────────────────────────
function ProductForm({ onAdd }) {
  const [form, setForm] = useState({ name: '', price: '', cost: '', stock: '', minStock: '3', unit: 'unidad' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Escribe el nombre del producto.');
    if (!form.price || +form.price <= 0) return setError('El precio de venta debe ser mayor a 0.');
    setError('');
    onAdd(form);
  };

  return (
    <form className="biz-product-form" onSubmit={handleSubmit}>
      <div className="biz-form-row biz-form-row--3">
        <div className="biz-form-field" style={{ flex: 2 }}>
          <label className="form-label">Nombre del producto</label>
          <input className="form-input" type="text" placeholder="Ej: Camisa talla M" value={form.name} onChange={set('name')} autoFocus />
        </div>
        <div className="biz-form-field">
          <label className="form-label">Unidad</label>
          <select className="form-input" value={form.unit} onChange={set('unit')}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="biz-form-row biz-form-row--4">
        <div className="biz-form-field">
          <label className="form-label">Precio de venta</label>
          <input className="form-input" type="number" min="0" step="any" placeholder="0" value={form.price} onChange={set('price')} />
        </div>
        <div className="biz-form-field">
          <label className="form-label">Costo <span style={{ color: 'var(--text-3)' }}>(opcional)</span></label>
          <input className="form-input" type="number" min="0" step="any" placeholder="0" value={form.cost} onChange={set('cost')} />
        </div>
        <div className="biz-form-field">
          <label className="form-label">Stock inicial</label>
          <input className="form-input" type="number" min="0" step="any" placeholder="0" value={form.stock} onChange={set('stock')} />
        </div>
        <div className="biz-form-field">
          <label className="form-label">Alerta en</label>
          <input className="form-input" type="number" min="0" step="1" placeholder="3" value={form.minStock} onChange={set('minStock')} />
        </div>
      </div>
      {error && <p className="form-error">⚠ {error}</p>}
      <div className="biz-product-form__footer">
        <button type="submit" className="biz-btn-submit">Agregar producto →</button>
      </div>
    </form>
  );
}

// ── Sale row ─────────────────────────────────────────────────────
function SaleRow({ sale, format, onDelete, compact }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="biz-sale-item">
      <div className="biz-sale-item__dot" style={{ background: PAY_COLORS[sale.paymentMethod] }} />
      <div className="biz-sale-item__info">
        <span className="biz-sale-item__name">{sale.productName}</span>
        {!compact && <span className="biz-sale-item__date">{sale.date}</span>}
        {sale.note && <span className="biz-sale-item__note">{sale.note}</span>}
      </div>
      <span className="biz-sale-item__qty">{sale.qty} × {format(sale.unitPrice)}</span>
      <span className="biz-sale-item__total">{format(sale.total)}</span>
      <span className="biz-sale-pay-chip" style={{ background: PAY_COLORS[sale.paymentMethod] + '18', color: PAY_COLORS[sale.paymentMethod] }}>
        {PAY_LABELS[sale.paymentMethod]}
      </span>
      {!compact && (
        confirm ? (
          <div className="tx-confirm">
            <button className="btn-delete-confirm" onClick={() => onDelete(sale.id)}>Sí</button>
            <button className="btn-delete-cancel"  onClick={() => setConfirm(false)}>No</button>
          </div>
        ) : (
          <button className="tx-delete" onClick={() => setConfirm(true)}>✕</button>
        )
      )}
    </li>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split('T')[0]; }
function startOfStr(period) {
  const d = new Date();
  if (period === 'week') d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
  else if (period === 'month') d.setDate(1);
  return d.toISOString().split('T')[0];
}

// ── Main export ───────────────────────────────────────────────────
const TABS = [
  { key: 'resumen',     label: 'Resumen'     },
  { key: 'venta',       label: 'Nueva venta' },
  { key: 'historial',   label: 'Historial'   },
  { key: 'inventario',  label: 'Inventario'  },
];

export default function BusinessSection() {
  const biz    = useBusiness();
  const { format } = useCurrency();
  const [tab, setTab] = useState('resumen');

  return (
    <div className="biz-section">
      <div className="biz-tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`biz-tab-btn ${tab === t.key ? 'biz-tab-btn--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === 'inventario' && biz.lowStockProducts.length > 0 && (
              <span className="biz-tab-badge">{biz.lowStockProducts.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'resumen'    && <BizResumen    biz={biz} format={format} />}
      {tab === 'venta'      && <BizNewSale    biz={biz} format={format} onSaved={() => setTab('historial')} />}
      {tab === 'historial'  && <BizHistorial  biz={biz} format={format} />}
      {tab === 'inventario' && <BizInventario biz={biz} format={format} />}
    </div>
  );
}
