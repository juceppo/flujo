import { useState } from 'react';

const KEY = 'flujo_budgets_v1';

const DEFAULT_BUDGETS = {
  food:          500,
  housing:       1400,
  transport:     150,
  entertainment: 100,
  health:        120,
  shopping:      200,
  education:     80,
  other:         100,
};

function load() {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? { ...DEFAULT_BUDGETS, ...JSON.parse(stored) } : DEFAULT_BUDGETS;
  } catch {
    return DEFAULT_BUDGETS;
  }
}

export function useBudgets() {
  const [budgets, setBudgetsState] = useState(load);

  const setBudget = (category, amount) => {
    setBudgetsState((prev) => {
      const next = { ...prev, [category]: Number(amount) };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const getBudget = (category) => budgets[category] ?? 0;

  return { budgets, setBudget, getBudget };
}
