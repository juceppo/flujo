import { getCategory } from './categories';

export function buildCSV(transactions) {
  const bom     = '﻿';
  const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Importe'];
  const rows    = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => [
      t.date,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      getCategory(t.category).label,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
    ]);

  return bom + [headers, ...rows].map((r) => r.join(';')).join('\n');
}

export function exportCSV(transactions) {
  const csv  = buildCSV(transactions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `flujo-${new Date().toISOString().slice(0, 7)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
