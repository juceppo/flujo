import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransactions } from './useTransactions';

describe('useTransactions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads sample data when storage is empty', () => {
    const { result } = renderHook(() => useTransactions());
    expect(result.current.transactions.length).toBeGreaterThan(0);
  });

  it('adds a new transaction to the list', () => {
    const { result } = renderHook(() => useTransactions());
    const before = result.current.transactions.length;

    act(() => {
      result.current.addTransaction({
        type: 'income', category: 'salary',
        description: 'Bono navideño', amount: '500', date: '2025-03-20',
      });
    });

    expect(result.current.transactions.length).toBe(before + 1);
  });

  it('converts amount string to float', () => {
    const { result } = renderHook(() => useTransactions());

    act(() => {
      result.current.addTransaction({
        type: 'expense', category: 'food',
        description: 'Café', amount: '3.50', date: '2025-03-01',
      });
    });

    const added = result.current.transactions.find((t) => t.description === 'Café');
    expect(added.amount).toBe(3.5);
    expect(typeof added.amount).toBe('number');
  });

  it('assigns a unique id on add', () => {
    const { result } = renderHook(() => useTransactions());

    act(() => {
      result.current.addTransaction({ type: 'income', category: 'salary', description: 'A', amount: '100', date: '2025-03-01' });
      result.current.addTransaction({ type: 'income', category: 'salary', description: 'B', amount: '200', date: '2025-03-02' });
    });

    const ids = result.current.transactions.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('deletes a transaction by id', () => {
    const { result } = renderHook(() => useTransactions());
    const target = result.current.transactions[0].id;

    act(() => {
      result.current.deleteTransaction(target);
    });

    expect(result.current.transactions.find((t) => t.id === target)).toBeUndefined();
  });

  it('getAvailableMonths returns unique months sorted newest first', () => {
    const { result } = renderHook(() => useTransactions());
    const months = result.current.getAvailableMonths();

    expect(months.length).toBeGreaterThan(0);
    const unique = new Set(months);
    expect(unique.size).toBe(months.length);

    for (let i = 0; i < months.length - 1; i++) {
      expect(months[i] > months[i + 1]).toBe(true);
    }
  });

  it('persists transactions to localStorage on change', () => {
    const { result } = renderHook(() => useTransactions());

    act(() => {
      result.current.addTransaction({ type: 'expense', category: 'food', description: 'Test', amount: '50', date: '2025-03-01' });
    });

    const stored = JSON.parse(localStorage.getItem('flujo_transactions_v1'));
    expect(stored.some((t) => t.description === 'Test')).toBe(true);
  });
});
