import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useBusiness } from '../hooks/useBusiness';
import { useCurrency } from '../context/CurrencyContext';

const PAY_LABELS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transf.', otro: 'Otro' };
const PAY_COLORS = { efectivo: '#059669', tarjeta: '#2563eb', transferencia: '#7c3aed', otro: '#6b7280' };
const UNITS      = ['unidad', 'kg', 'g', 'litro', 'ml', 'caja', 'paquete', 'docena', 'par'];
const todayStr   = () => new Date().toISOString().split('T')[0];
const startOfStr = (p) => { const d = new Date(); if (p === 'week') d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); else if (p === 'month') d.setDate(1); return d.toISOString().split('T')[0]; };

// ── SVG Ring ─────────────────────────────────────────────────────
function Ring({ pct, size = 80, color = '#2563eb', label }) {
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (Math.min(pct, 100) / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={7} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.5px' }}>{Math.min(pct, 100)}%</span>
        {label && <span style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.6px' }}>{label}</span>}
      </div>
    </div>
  );
}

// ── Custom bar tooltip ────────────────────────────────────────────
function BarTooltip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__month">{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{format(payload[0].value)}</p>
    </div>
  );
}

// ── Resumen ──────────────────────────────────────────────────────
function BizResumen({ biz, format, setTab }) {
  const [period, setPeriod] = useState('today');
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const total     = biz.totalIn(period);
  const count     = biz.countIn(period);
  const profit    = biz.profitIn(period);
  const hasCosts  = biz.products.some((p) => p.cost > 0);
  const breakdown = biz.paymentBreakdown(period);
  const top       = biz.topProducts(period);
  const trend     = biz.salesTrend(14);
  const goalPct   = biz.dailyGoal > 0 ? Math.round((biz.totalIn('today') / biz.dailyGoal) * 100) : 0;
  const hasTrendData = trend.some((d) => d.total > 0);

  const handleSaveGoal = () => {
    if (goalInput && +goalInput > 0) biz.setDailyGoal(goalInput);
    setEditGoal(false); setGoalInput('');
  };

  return (
    <div className="biz-tab-content">
      <div className="biz-period-tabs">
        {[{ key: 'today', label: 'Hoy' }, { key: 'week', label: 'Esta semana' }, { key: 'month', label: 'Este mes' }].map((p) => (
          <button key={p.key} className={`biz-period-btn ${period === p.key ? 'biz-period-btn--active' : ''}`}
            onClick={() => setPeriod(p.key)}>{p.label}</button>
        ))}
      </div>

      {/* Daily goal + KPIs */}
      <div className="biz-top-row">
        {/* Goal ring */}
        <div className="biz-goal-card">
          <div className="biz-goal-card__left">
            <Ring pct={goalPct} color={goalPct >= 100 ? '#059669' : '#2563eb'} label="meta" />
          </div>
          <div className="biz-goal-card__right">
            <p className="biz-stat__label">Meta del día</p>
            {biz.dailyGoal > 0 ? (
              <>
                <p className="biz-goal-value">{format(biz.totalIn('today'))} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/ {format(biz.dailyGoal)}</span></p>
                <p className="biz-stat__sub" style={{ color: goalPct >= 100 ? '#059669' : 'var(--text-3)' }}>
                  {goalPct >= 100 ? '¡Meta alcanzada! 🎉' : `Faltan ${format(biz.dailyGoal - biz.totalIn('today'))}`}
                </p>
              </>
            ) : (
              <p className="biz-stat__sub">Sin meta configurada</p>
            )}
            {editGoal ? (
              <div className="biz-goal-edit">
                <input className="form-input biz-goal-input" type="number" placeholder="Ej: 500000" autoFocus
                  value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()} />
                <button className="biz-stock-ok" onClick={handleSaveGoal}>✓</button>
                <button className="biz-stock-cancel" onClick={() => setEditGoal(false)}>✕</button>
              </div>
            ) : (
              <button className="biz-add-stock-btn" style={{ marginTop: 6 }} onClick={() => setEditGoal(true)}>
                {biz.dailyGoal > 0 ? 'Cambiar meta' : 'Poner meta'}
              </button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="biz-kpi-grid">
          <div className="biz-kpi">
            <p className="biz-stat__label">Ventas</p>
            <p className="biz-kpi__value" style={{ color: '#2563eb' }}>{format(total)}</p>
            <p className="biz-stat__sub">{count} transacciones</p>
          </div>
          {hasCosts && (
            <div className="biz-kpi">
              <p className="biz-stat__label">Ganancia</p>
              <p className="biz-kpi__value" style={{ color: profit >= 0 ? '#059669' : '#dc2626' }}>{format(profit)}</p>
              <p className="biz-stat__sub">{total > 0 ? `Margen ~${Math.round((profit / total) * 100)}%` : '—'}</p>
            </div>
          )}
          <div className="biz-kpi">
            <p className="biz-stat__label">Stock bajo</p>
            <p className="biz-kpi__value" style={{ color: biz.lowStockProducts.length > 0 ? '#dc2626' : '#059669' }}>
              {biz.lowStockProducts.length}
            </p>
            <p className="biz-stat__sub">{biz.lowStockProducts.length > 0 ? 'Productos para reabastecer' : 'Todo en orden'}</p>
          </div>
          <div className="biz-kpi">
            <p className="biz-stat__label">Valor inventario</p>
            <p className="biz-kpi__value">{format(biz.totalStockValue)}</p>
            <p className="biz-stat__sub">{biz.totalInventoryQty} unidades totales</p>
          </div>
        </div>
      </div>

      {/* Sales trend chart */}
      {hasTrendData ? (
        <div className="biz-card biz-card--full">
          <h3 className="biz-card__title">Tendencia de ventas — últimos 14 días</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={22}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<BarTooltip format={format} />} cursor={{ fill: 'var(--bg-2)' }} />
              <Bar dataKey="total" radius={[5, 5, 0, 0]}>
                {trend.map((entry, i) => (
                  <Cell key={i} fill={entry.date === todayStr() ? '#2563eb' : '#2563eb44'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>La barra sólida es el día de hoy</p>
        </div>
      ) : null}

      <div className="biz-resumen-grid">
        {/* Payment donut */}
        {breakdown.length > 0 && (
          <div className="biz-card">
            <h3 className="biz-card__title">Medios de pago</h3>
            <div className="biz-pay-donut-wrap">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={breakdown} dataKey="amount" nameKey="method" cx="50%" cy="50%"
                    innerRadius={38} outerRadius={58} paddingAngle={3}>
                    {breakdown.map((entry) => (
                      <Cell key={entry.method} fill={PAY_COLORS[entry.method]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => format(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="biz-pay-legend">
                {breakdown.map(({ method, amount, pct }) => (
                  <div key={method} className="biz-pay-row">
                    <span className="biz-pay-dot" style={{ background: PAY_COLORS[method] }} />
                    <span className="biz-pay-name">{PAY_LABELS[method]}</span>
                    <span className="biz-pay-pct">{pct}%</span>
                    <span className="biz-pay-amount">{format(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top products */}
        {top.length > 0 && (
          <div className="biz-card">
            <h3 className="biz-card__title">Más vendidos</h3>
            <ResponsiveContainer width="100%" height={top.length * 38 + 10}>
              <BarChart data={top} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }} barSize={14}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val) => format(val)} cursor={{ fill: 'var(--bg-2)' }} />
                <Bar dataKey="total" fill="#e8622a" radius={[0, 5, 5, 0]} label={{ position: 'right', fontSize: 11, fill: 'var(--text-3)', formatter: (v) => format(v) }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Low stock alerts */}
      {biz.lowStockProducts.length > 0 && (
        <div className="biz-card biz-card--full">
          <h3 className="biz-card__title">⚠ Productos con stock bajo</h3>
          <div className="biz-alert-list">
            {biz.lowStockProducts.map((p) => (
              <div key={p.id} className="biz-alert-item">
                <span className="biz-alert-name">{p.name}</span>
                <span className="biz-alert-stock" style={{ color: '#dc2626' }}>{p.stock} {p.unit} restantes</span>
                <span className="biz-alert-min">Mín: {p.minStock}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && biz.sales.length === 0 && (
        <div className="biz-empty">
          <p className="biz-empty__icon">🏪</p>
          <p className="biz-empty__text">No hay ventas registradas todavía.</p>
          <p className="biz-empty__hint">Registra tu primera venta en <strong>Nueva venta</strong>.</p>
          <button className="biz-btn-add" style={{ marginTop: 12 }} onClick={() => setTab('venta')}>
            + Registrar primera venta
          </button>
        </div>
      )}
    </div>
  );
}

// ── Nueva venta ──────────────────────────────────────────────────
function BizNewSale({ biz, format, onSaved }) {
  const empty = { productId: '', productName: '', qty: 1, unitPrice: '', paymentMethod: 'efectivo', note: '', date: todayStr() };
  const [form, setForm]   = useState(empty);
  const [mode, setMode]   = useState('inventario');
  const [error, setError] = useState('');
  const quick             = biz.quickProducts();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const selectProduct = (id) => {
    const p = biz.products.find((p) => p.id === id);
    if (p) setForm((f) => ({ ...f, productId: p.id, productName: p.name, unitPrice: p.price }));
    else   setForm((f) => ({ ...f, productId: '', productName: '', unitPrice: '' }));
  };

  const quickFill = (p) => {
    setMode('inventario');
    setForm((f) => ({ ...f, productId: p.id, productName: p.name, unitPrice: p.price, qty: 1 }));
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

  const total           = (+form.qty || 0) * (+form.unitPrice || 0);
  const selectedProduct = form.productId ? biz.products.find((p) => p.id === form.productId) : null;

  return (
    <div className="biz-tab-content">
      <div className="biz-card biz-card--full">
        <h3 className="biz-card__title">Registrar venta</h3>

        {/* Quick products */}
        {quick.length > 0 && (
          <div className="biz-quick-section">
            <p className="biz-quick-label">Acceso rápido — más vendidos</p>
            <div className="biz-quick-grid">
              {quick.map((p) => (
                <button key={p.id} type="button"
                  className={`biz-quick-chip ${form.productId === p.id ? 'biz-quick-chip--active' : ''}`}
                  onClick={() => quickFill(p)}
                >
                  <span className="biz-quick-chip__name">{p.name}</span>
                  <span className="biz-quick-chip__price">{format(p.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode switch */}
        <div className="biz-mode-switch">
          <button type="button"
            className={`biz-mode-btn ${mode === 'inventario' ? 'biz-mode-btn--active' : ''}`}
            onClick={() => { setMode('inventario'); setForm((f) => ({ ...f, productId: '', productName: '', unitPrice: '' })); }}>
            Desde inventario
          </button>
          <button type="button"
            className={`biz-mode-btn ${mode === 'manual' ? 'biz-mode-btn--active' : ''}`}
            onClick={() => { setMode('manual'); setForm((f) => ({ ...f, productId: '', productName: '', unitPrice: '' })); }}>
            Venta manual
          </button>
        </div>

        <form onSubmit={handleSubmit} className="biz-form">
          {mode === 'inventario' ? (
            <div className="biz-form-field">
              <label className="form-label">Producto del inventario</label>
              {biz.products.length === 0 ? (
                <p className="biz-hint">No tienes productos en inventario todavía.</p>
              ) : (
                <select className="form-input" value={form.productId} onChange={(e) => selectProduct(e.target.value)}>
                  <option value="">— Selecciona un producto —</option>
                  {biz.products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · Stock: {p.stock} {p.unit} · {format(p.price)}</option>
                  ))}
                </select>
              )}
              {selectedProduct && (
                <p className="biz-stock-hint" style={{ color: selectedProduct.stock <= selectedProduct.minStock ? '#dc2626' : 'var(--green)' }}>
                  Stock actual: {selectedProduct.stock} {selectedProduct.unit}
                  {selectedProduct.stock <= selectedProduct.minStock && ' · ⚠ Stock bajo'}
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
              <input className="form-input" type="number" min="0.1" step="any" value={form.qty} onChange={set('qty')} />
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

          <div className="biz-form-field">
            <label className="form-label">Medio de pago</label>
            <div className="biz-pay-selector">
              {Object.entries(PAY_LABELS).map(([key, label]) => (
                <button key={key} type="button"
                  className={`biz-pay-chip ${form.paymentMethod === key ? 'biz-pay-chip--active' : ''}`}
                  style={form.paymentMethod === key ? { background: PAY_COLORS[key] + '20', borderColor: PAY_COLORS[key], color: PAY_COLORS[key] } : {}}
                  onClick={() => setForm((f) => ({ ...f, paymentMethod: key }))}>{label}</button>
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

          <button type="submit" className="biz-btn-submit">Registrar venta →</button>
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

  const exportCSV = () => {
    const label = { today: 'hoy', week: 'semana', month: 'mes', all: 'todo' }[filter];
    biz.exportSalesCSV(filtered, `ventas_${label}`);
  };

  return (
    <div className="biz-tab-content">
      <div className="biz-filter-row">
        {[{ key: 'today', label: 'Hoy' }, { key: 'week', label: 'Esta semana' }, { key: 'month', label: 'Este mes' }, { key: 'all', label: 'Todo' }].map((f) => (
          <button key={f.key}
            className={`biz-period-btn ${filter === f.key ? 'biz-period-btn--active' : ''}`}
            onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
        {filtered.length > 0 && (
          <>
            <span className="biz-filter-total">{filtered.length} ventas · {format(total)}</span>
            <button className="biz-btn-export" onClick={exportCSV}>⬇ Exportar CSV</button>
          </>
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
            {filtered.map((s) => <SaleRow key={s.id} sale={s} format={format} onDelete={biz.deleteSale} />)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Inventario ───────────────────────────────────────────────────
function BizInventario({ biz, format }) {
  const [showForm, setShowForm]     = useState(false);
  const [addingStock, setAddingStock] = useState(null);
  const [stockDelta, setStockDelta] = useState('');
  const [sortBy, setSortBy]         = useState('name');

  const handleAddStock = (id) => {
    if (!stockDelta || +stockDelta === 0) return;
    biz.updateStock(id, +stockDelta);
    setAddingStock(null); setStockDelta('');
  };

  const sorted = [...biz.products].sort((a, b) => {
    if (sortBy === 'stock') return a.stock - b.stock;
    if (sortBy === 'price') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="biz-tab-content">
      <div className="biz-inv-header">
        <div>
          <p className="biz-inv-summary">
            {biz.products.length} productos · {biz.totalInventoryQty} uds. · Valor: {format(biz.totalStockValue)}
          </p>
          {biz.lowStockProducts.length > 0 && (
            <p className="biz-inv-alert">⚠ {biz.lowStockProducts.length} producto{biz.lowStockProducts.length !== 1 ? 's' : ''} con stock bajo</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="month-select" style={{ fontSize: 12 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">A–Z</option>
            <option value="stock">Menor stock primero</option>
            <option value="price">Mayor precio primero</option>
          </select>
          <button className="biz-btn-add" onClick={() => setShowForm((v) => !v)}>
            {showForm ? '✕ Cancelar' : '+ Agregar producto'}
          </button>
        </div>
      </div>

      {showForm && <ProductForm onAdd={(data) => { biz.addProduct(data); setShowForm(false); }} />}

      {biz.products.length === 0 && !showForm ? (
        <div className="biz-empty">
          <p className="biz-empty__icon">🗄️</p>
          <p className="biz-empty__text">No tienes productos en el inventario.</p>
          <p className="biz-empty__hint">Agrega productos para controlar stock y registrar ventas en un clic.</p>
          <button className="biz-btn-add biz-btn-add--center" onClick={() => setShowForm(true)}>+ Agregar primer producto</button>
        </div>
      ) : (
        <div className="biz-product-grid">
          {sorted.map((p) => {
            const isLow = p.stock <= p.minStock;
            return (
              <div key={p.id} className={`biz-product-card ${isLow ? 'biz-product-card--low' : ''}`}>
                <div className="biz-product-card__top">
                  <div>
                    <h4 className="biz-product-name">{p.name}</h4>
                    <p className="biz-product-unit">{p.unit}</p>
                  </div>
                  <button className="btn-goal-delete" onClick={() => biz.deleteProduct(p.id)}>🗑</button>
                </div>

                <div className="biz-product-prices">
                  <div className="biz-product-price">
                    <span className="biz-product-price__label">Venta</span>
                    <span className="biz-product-price__value">{format(p.price)}</span>
                  </div>
                  {p.cost > 0 && <>
                    <div className="biz-product-price">
                      <span className="biz-product-price__label">Costo</span>
                      <span className="biz-product-price__value biz-product-price__value--muted">{format(p.cost)}</span>
                    </div>
                    <div className="biz-product-price">
                      <span className="biz-product-price__label">Margen</span>
                      <span className="biz-product-price__value" style={{ color: '#059669' }}>
                        {Math.round(((p.price - p.cost) / p.price) * 100)}%
                      </span>
                    </div>
                    <div className="biz-product-price">
                      <span className="biz-product-price__label">Valor stock</span>
                      <span className="biz-product-price__value" style={{ fontSize: 12 }}>{format(p.stock * p.cost)}</span>
                    </div>
                  </>}
                </div>

                <div className="biz-stock-row">
                  <div>
                    <span className={`biz-stock-badge ${isLow ? 'biz-stock-badge--low' : 'biz-stock-badge--ok'}`}>
                      {isLow ? '⚠' : '✓'} {p.stock} {p.unit}
                    </span>
                    <span className="biz-stock-min">Alerta en: {p.minStock}</span>
                  </div>
                  {addingStock === p.id ? (
                    <div className="biz-add-stock-form">
                      <input className="form-input biz-stock-input" type="number" placeholder="+10 o −5" autoFocus
                        value={stockDelta} onChange={(e) => setStockDelta(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStock(p.id)} />
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
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Escribe el nombre del producto.');
    if (!form.price || +form.price <= 0) return setError('El precio de venta debe ser mayor a 0.');
    setError(''); onAdd(form);
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
        <div className="biz-form-field"><label className="form-label">Precio de venta</label>
          <input className="form-input" type="number" min="0" step="any" placeholder="0" value={form.price} onChange={set('price')} /></div>
        <div className="biz-form-field"><label className="form-label">Costo <span style={{ color: 'var(--text-3)' }}>(opcional)</span></label>
          <input className="form-input" type="number" min="0" step="any" placeholder="0" value={form.cost} onChange={set('cost')} /></div>
        <div className="biz-form-field"><label className="form-label">Stock inicial</label>
          <input className="form-input" type="number" min="0" step="any" placeholder="0" value={form.stock} onChange={set('stock')} /></div>
        <div className="biz-form-field"><label className="form-label">Alerta en</label>
          <input className="form-input" type="number" min="0" step="1" placeholder="3" value={form.minStock} onChange={set('minStock')} /></div>
      </div>
      {error && <p className="form-error">⚠ {error}</p>}
      <div className="biz-product-form__footer">
        <button type="submit" className="biz-btn-submit">Agregar producto →</button>
      </div>
    </form>
  );
}

// ── Sale row ─────────────────────────────────────────────────────
function SaleRow({ sale, format, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="biz-sale-item">
      <div className="biz-sale-item__dot" style={{ background: PAY_COLORS[sale.paymentMethod] }} />
      <div className="biz-sale-item__info">
        <span className="biz-sale-item__name">{sale.productName}</span>
        <span className="biz-sale-item__date">{sale.date}{sale.note && ` · ${sale.note}`}</span>
      </div>
      <span className="biz-sale-item__qty">{sale.qty} × {format(sale.unitPrice)}</span>
      <span className="biz-sale-item__total">{format(sale.total)}</span>
      <span className="biz-sale-pay-chip" style={{ background: PAY_COLORS[sale.paymentMethod] + '18', color: PAY_COLORS[sale.paymentMethod] }}>
        {PAY_LABELS[sale.paymentMethod]}
      </span>
      {confirm ? (
        <div className="tx-confirm">
          <button className="btn-delete-confirm" onClick={() => onDelete(sale.id)}>Sí</button>
          <button className="btn-delete-cancel"  onClick={() => setConfirm(false)}>No</button>
        </div>
      ) : (
        <button className="tx-delete" style={{ opacity: 1 }} onClick={() => setConfirm(true)}>✕</button>
      )}
    </li>
  );
}

// ── Main ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'resumen',    label: 'Resumen'     },
  { key: 'venta',      label: 'Nueva venta' },
  { key: 'historial',  label: 'Historial'   },
  { key: 'inventario', label: 'Inventario'  },
];

export default function BusinessSection() {
  const biz    = useBusiness();
  const { format } = useCurrency();
  const [tab, setTab] = useState('resumen');

  return (
    <div className="biz-section">
      <div className="biz-tabs-bar">
        {TABS.map((t) => (
          <button key={t.key}
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
      {tab === 'resumen'    && <BizResumen    biz={biz} format={format} setTab={setTab} />}
      {tab === 'venta'      && <BizNewSale    biz={biz} format={format} onSaved={() => setTab('historial')} />}
      {tab === 'historial'  && <BizHistorial  biz={biz} format={format} />}
      {tab === 'inventario' && <BizInventario biz={biz} format={format} />}
    </div>
  );
}
