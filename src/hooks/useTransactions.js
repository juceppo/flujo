import { useState, useEffect } from 'react';

const STORAGE_KEY = 'flujo_transactions_v1';

export function useTransactions() {
  const [transactions, setTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction) => {
    const newTx = { ...transaction, id: crypto.randomUUID(), amount: parseFloat(transaction.amount) };
    setTransactions((prev) =>
      [newTx, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    );
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const getAvailableMonths = () =>
    [...new Set(transactions.map((t) => t.date.substring(0, 7)))].sort().reverse();

  return { transactions, addTransaction, deleteTransaction, getAvailableMonths };
}
