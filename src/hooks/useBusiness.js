import { useState } from 'react';

const SALES_KEY    = 'flujo_sales_v1';
const PRODUCTS_KEY = 'flujo_products_v1';

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── helpers ──────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

function startOf(period) {
  const d = new Date();
  if (period === 'week') {
    d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
  } else if (period === 'month') {
    d.setDate(1);
  }
  return d.toISOString().split('T')[0];
}

export function useBusiness() {
  const [sales,    setSales]    = useState(() => load(SALES_KEY));
  const [products, setProducts] = useState(() => load(PRODUCTS_KEY));

  // ── products ──────────────────────────────────────────
  const addProduct = (data) => {
    const next = [...products, {
      id:       crypto.randomUUID(),
      name:     data.name.trim(),
      price:    Number(data.price),
      cost:     Number(data.cost || 0),
      stock:    Number(data.stock || 0),
      minStock: Number(data.minStock || 3),
      unit:     data.unit || 'unidad',
      createdAt: new Date().toISOString(),
    }];
    setProducts(next); save(PRODUCTS_KEY, next);
  };

  const updateStock = (id, delta) => {
    const next = products.map((p) =>
      p.id !== id ? p : { ...p, stock: Math.max(0, p.stock + Number(delta)) }
    );
    setProducts(next); save(PRODUCTS_KEY, next);
  };

  const deleteProduct = (id) => {
    const next = products.filter((p) => p.id !== id);
    setProducts(next); save(PRODUCTS_KEY, next);
  };

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // ── sales ────────────────────────────────────────────
  const addSale = (data) => {
    const qty   = Number(data.qty) || 1;
    const price = Number(data.unitPrice);
    const sale  = {
      id:          crypto.randomUUID(),
      productId:   data.productId || null,
      productName: data.productName.trim(),
      qty,
      unitPrice:   price,
      total:       qty * price,
      paymentMethod: data.paymentMethod || 'efectivo',
      date:        data.date || today(),
      note:        data.note || '',
      createdAt:   new Date().toISOString(),
    };
    // auto-decrement stock if tied to a product
    if (sale.productId) updateStock(sale.productId, -sale.qty);
    const next = [sale, ...sales];
    setSales(next); save(SALES_KEY, next);
  };

  const deleteSale = (id) => {
    const sale = sales.find((s) => s.id === id);
    if (sale?.productId) updateStock(sale.productId, sale.qty); // restore stock
    const next = sales.filter((s) => s.id !== id);
    setSales(next); save(SALES_KEY, next);
  };

  // ── metrics ──────────────────────────────────────────
  const totalIn = (period) => {
    const from = period === 'today' ? today() : startOf(period);
    return sales
      .filter((s) => s.date >= from)
      .reduce((sum, s) => sum + s.total, 0);
  };

  const profitIn = (period) => {
    const from = period === 'today' ? today() : startOf(period);
    return sales
      .filter((s) => s.date >= from)
      .reduce((sum, s) => {
        const p = products.find((p) => p.id === s.productId);
        const cost = p ? p.cost * s.qty : 0;
        return sum + s.total - cost;
      }, 0);
  };

  const paymentBreakdown = (period) => {
    const from = period === 'today' ? today() : startOf(period);
    const filtered = sales.filter((s) => s.date >= from);
    const totals = { efectivo: 0, tarjeta: 0, transferencia: 0, otro: 0 };
    filtered.forEach((s) => { totals[s.paymentMethod] = (totals[s.paymentMethod] || 0) + s.total; });
    const grand = filtered.reduce((sum, s) => sum + s.total, 0);
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([method, amount]) => ({ method, amount, pct: grand > 0 ? Math.round((amount / grand) * 100) : 0 }));
  };

  const topProducts = (period, n = 5) => {
    const from = period === 'today' ? today() : startOf(period);
    const map = {};
    sales.filter((s) => s.date >= from).forEach((s) => {
      if (!map[s.productName]) map[s.productName] = { name: s.productName, qty: 0, total: 0 };
      map[s.productName].qty   += s.qty;
      map[s.productName].total += s.total;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, n);
  };

  return {
    // products
    products, addProduct, updateStock, deleteProduct, lowStockProducts,
    // sales
    sales, addSale, deleteSale,
    // metrics
    totalIn, profitIn, paymentBreakdown, topProducts,
  };
}
