import { useState } from 'react';

const SALES_KEY    = 'flujo_sales_v1';
const PRODUCTS_KEY = 'flujo_products_v1';
const GOAL_KEY     = 'flujo_daily_goal_v1';

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

const todayStr = () => new Date().toISOString().split('T')[0];

function startOf(period) {
  const d = new Date();
  if (period === 'week')  d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
  if (period === 'month') d.setDate(1);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

export function useBusiness() {
  const [sales,    setSales]    = useState(() => load(SALES_KEY));
  const [products, setProducts] = useState(() => load(PRODUCTS_KEY));
  const [dailyGoal, setDailyGoalState] = useState(() => {
    try { return Number(localStorage.getItem(GOAL_KEY) || 0); } catch { return 0; }
  });

  // ── daily goal ───────────────────────────────────
  const setDailyGoal = (amount) => {
    const n = Number(amount);
    setDailyGoalState(n);
    localStorage.setItem(GOAL_KEY, n);
  };

  // ── products ──────────────────────────────────────
  const addProduct = (data) => {
    const next = [...products, {
      id: crypto.randomUUID(),
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

  const lowStockProducts  = products.filter((p) => p.stock <= p.minStock);
  const totalStockValue   = products.reduce((s, p) => s + p.stock * p.cost, 0);
  const totalInventoryQty = products.reduce((s, p) => s + p.stock, 0);

  // ── sales ────────────────────────────────────────
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
      date:        data.date || todayStr(),
      note:        data.note || '',
      createdAt:   new Date().toISOString(),
    };
    if (sale.productId) updateStock(sale.productId, -sale.qty);
    const next = [sale, ...sales];
    setSales(next); save(SALES_KEY, next);
  };

  const deleteSale = (id) => {
    const sale = sales.find((s) => s.id === id);
    if (sale?.productId) updateStock(sale.productId, sale.qty);
    const next = sales.filter((s) => s.id !== id);
    setSales(next); save(SALES_KEY, next);
  };

  // ── metrics ──────────────────────────────────────
  const totalIn = (period) => {
    const from = period === 'today' ? todayStr() : startOf(period);
    return sales.filter((s) => s.date >= from).reduce((sum, s) => sum + s.total, 0);
  };

  const countIn = (period) => {
    const from = period === 'today' ? todayStr() : startOf(period);
    return sales.filter((s) => s.date >= from).length;
  };

  const profitIn = (period) => {
    const from = period === 'today' ? todayStr() : startOf(period);
    return sales.filter((s) => s.date >= from).reduce((sum, s) => {
      const p = products.find((p) => p.id === s.productId);
      return sum + s.total - (p ? p.cost * s.qty : 0);
    }, 0);
  };

  const paymentBreakdown = (period) => {
    const from = period === 'today' ? todayStr() : startOf(period);
    const filtered = sales.filter((s) => s.date >= from);
    const totals = { efectivo: 0, tarjeta: 0, transferencia: 0, otro: 0 };
    filtered.forEach((s) => { totals[s.paymentMethod] = (totals[s.paymentMethod] || 0) + s.total; });
    const grand = filtered.reduce((sum, s) => sum + s.total, 0);
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([method, amount]) => ({ method, amount, pct: grand > 0 ? Math.round((amount / grand) * 100) : 0 }));
  };

  const topProducts = (period, n = 5) => {
    const from = period === 'today' ? todayStr() : startOf(period);
    const map  = {};
    sales.filter((s) => s.date >= from).forEach((s) => {
      if (!map[s.productName]) map[s.productName] = { name: s.productName, qty: 0, total: 0 };
      map[s.productName].qty   += s.qty;
      map[s.productName].total += s.total;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, n);
  };

  // Sales trend: last N days with totals
  const salesTrend = (days = 14) => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayTotal = sales.filter((s) => s.date === ds).reduce((sum, s) => sum + s.total, 0);
      result.push({ date: ds, label: formatDate(ds), total: dayTotal });
    }
    return result;
  };

  // Best selling products for quick-tap in Nueva Venta
  const quickProducts = () => {
    const map = {};
    sales.forEach((s) => {
      if (!s.productId) return;
      if (!map[s.productId]) map[s.productId] = { id: s.productId, qty: 0 };
      map[s.productId].qty += s.qty;
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6)
      .map((m) => products.find((p) => p.id === m.id))
      .filter(Boolean);
  };

  // CSV export
  const exportSalesCSV = (filteredSales, filename = 'ventas') => {
    const BOM = '﻿';
    const header = 'Fecha;Producto;Cantidad;Precio unitario;Total;Medio de pago;Nota\n';
    const rows = filteredSales.map((s) =>
      [s.date, `"${s.productName}"`, s.qty, s.unitPrice.toFixed(2), s.total.toFixed(2), s.paymentMethod, `"${s.note}"`].join(';')
    ).join('\n');
    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${filename}_${todayStr()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return {
    products, addProduct, updateStock, deleteProduct,
    lowStockProducts, totalStockValue, totalInventoryQty,
    sales, addSale, deleteSale,
    dailyGoal, setDailyGoal,
    totalIn, countIn, profitIn, paymentBreakdown, topProducts,
    salesTrend, quickProducts, exportSalesCSV,
  };
}
