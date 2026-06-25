import { describe, it, expect } from 'vitest';
import { buildCSV } from './export';

const transactions = [
  { id: '1', type: 'income',  category: 'salary', description: 'Salario mensual', amount: 4500, date: '2025-01-05' },
  { id: '2', type: 'expense', category: 'food',   description: 'Supermercado',    amount: 280,  date: '2025-01-08' },
];

describe('buildCSV', () => {
  it('starts with UTF-8 BOM for Excel compatibility', () => {
    expect(buildCSV(transactions).startsWith('﻿')).toBe(true);
  });

  it('includes all header columns', () => {
    const csv = buildCSV(transactions);
    expect(csv).toContain('Fecha;Tipo;Categoría;Descripción;Importe');
  });

  it('translates income type to "Ingreso"', () => {
    expect(buildCSV(transactions)).toContain('Ingreso');
  });

  it('translates expense type to "Gasto"', () => {
    expect(buildCSV(transactions)).toContain('Gasto');
  });

  it('sorts rows newest date first', () => {
    const csv   = buildCSV(transactions);
    const lines = csv.split('\n');
    // Jan 8 > Jan 5 → expense row first, then income row
    expect(lines[1]).toContain('2025-01-08');
    expect(lines[2]).toContain('2025-01-05');
  });

  it('wraps description in quotes', () => {
    expect(buildCSV(transactions)).toContain('"Salario mensual"');
  });

  it('escapes double quotes inside descriptions', () => {
    const tricky = [{ id: '3', type: 'expense', category: 'food', description: 'Café "especial"', amount: 10, date: '2025-01-01' }];
    expect(buildCSV(tricky)).toContain('"Café ""especial"""');
  });

  it('uses the category Spanish label', () => {
    expect(buildCSV(transactions)).toContain('Comida');
  });

  it('uses semicolons as separator', () => {
    const lines = buildCSV(transactions).split('\n');
    expect(lines[0].split(';').length).toBe(5);
  });

  it('returns empty data rows for empty array', () => {
    const lines = buildCSV([]).split('\n');
    expect(lines).toHaveLength(1); // only header
  });
});
