import { useState, useEffect } from 'react';

const STORAGE_KEY = 'flujo_transactions_v1';

const SAMPLE_DATA = [
  // Enero 2025
  { id: 'jan1', type: 'income',  category: 'salary',        description: 'Salario mensual',           amount: 4500, date: '2025-01-05' },
  { id: 'jan2', type: 'income',  category: 'freelance',     description: 'Proyecto diseño web',       amount: 1200, date: '2025-01-12' },
  { id: 'jan3', type: 'expense', category: 'housing',       description: 'Alquiler',                  amount: 1200, date: '2025-01-01' },
  { id: 'jan4', type: 'expense', category: 'food',          description: 'Supermercado',              amount: 280,  date: '2025-01-08' },
  { id: 'jan5', type: 'expense', category: 'transport',     description: 'Tarjeta de transporte',     amount: 95,   date: '2025-01-02' },
  { id: 'jan6', type: 'expense', category: 'entertainment', description: 'Netflix + Spotify',         amount: 28,   date: '2025-01-10' },
  { id: 'jan7', type: 'expense', category: 'health',        description: 'Gimnasio',                  amount: 30,   date: '2025-01-03' },
  { id: 'jan8', type: 'expense', category: 'food',          description: 'Cena en restaurante',       amount: 85,   date: '2025-01-20' },
  // Febrero 2025
  { id: 'feb1', type: 'income',  category: 'salary',        description: 'Salario mensual',           amount: 4500, date: '2025-02-05' },
  { id: 'feb2', type: 'expense', category: 'housing',       description: 'Alquiler',                  amount: 1200, date: '2025-02-01' },
  { id: 'feb3', type: 'expense', category: 'food',          description: 'Supermercado',              amount: 310,  date: '2025-02-09' },
  { id: 'feb4', type: 'expense', category: 'transport',     description: 'Transporte mensual + Uber', amount: 145,  date: '2025-02-02' },
  { id: 'feb5', type: 'expense', category: 'entertainment', description: 'Netflix + Spotify',         amount: 28,   date: '2025-02-10' },
  { id: 'feb6', type: 'expense', category: 'health',        description: 'Gimnasio + Médico',         amount: 115,  date: '2025-02-15' },
  { id: 'feb7', type: 'expense', category: 'shopping',      description: 'Ropa de invierno',          amount: 145,  date: '2025-02-22' },
  // Marzo 2025
  { id: 'mar1', type: 'income',  category: 'salary',        description: 'Salario mensual',           amount: 4500, date: '2025-03-05' },
  { id: 'mar2', type: 'income',  category: 'investment',    description: 'Dividendos',                amount: 350,  date: '2025-03-18' },
  { id: 'mar3', type: 'expense', category: 'housing',       description: 'Alquiler',                  amount: 1200, date: '2025-03-01' },
  { id: 'mar4', type: 'expense', category: 'food',          description: 'Supermercado',              amount: 265,  date: '2025-03-08' },
  { id: 'mar5', type: 'expense', category: 'transport',     description: 'Tarjeta de transporte',     amount: 95,   date: '2025-03-02' },
  { id: 'mar6', type: 'expense', category: 'entertainment', description: 'Netflix + Spotify + Cine',  amount: 75,   date: '2025-03-15' },
  { id: 'mar7', type: 'expense', category: 'health',        description: 'Gimnasio',                  amount: 30,   date: '2025-03-03' },
  { id: 'mar8', type: 'expense', category: 'food',          description: 'Cena de cumpleaños',        amount: 89,   date: '2025-03-25' },
  { id: 'mar9', type: 'expense', category: 'education',     description: 'Curso online',              amount: 49,   date: '2025-03-10' },
];

export function useTransactions() {
  const [transactions, setTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : SAMPLE_DATA;
    } catch {
      return SAMPLE_DATA;
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
