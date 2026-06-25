import { useState } from 'react';

const KEY = 'flujo_savings_v1';

// Goal shape: { id, name, target, color, deadline, contributions: [{id, amount, date, note}], createdAt }

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(goals) {
  localStorage.setItem(KEY, JSON.stringify(goals));
}

export function useSavings() {
  const [goals, setGoals] = useState(load);

  const commit = (next) => { setGoals(next); persist(next); };

  const addGoal = ({ name, target, color, deadline }) => {
    commit([...goals, {
      id: crypto.randomUUID(),
      name,
      target:   Number(target),
      color,
      deadline: deadline || null,
      contributions: [],
      createdAt: new Date().toISOString(),
    }]);
  };

  const deleteGoal = (id) => commit(goals.filter((g) => g.id !== id));

  const contribute = (goalId, amount, note = '') => {
    commit(goals.map((g) =>
      g.id !== goalId ? g : {
        ...g,
        contributions: [
          ...g.contributions,
          { id: crypto.randomUUID(), amount: Number(amount), date: new Date().toISOString().split('T')[0], note },
        ],
      }
    ));
  };

  const removeContribution = (goalId, contribId) => {
    commit(goals.map((g) =>
      g.id !== goalId ? g : { ...g, contributions: g.contributions.filter((c) => c.id !== contribId) }
    ));
  };

  const getSaved = (goal) => goal.contributions.reduce((s, c) => s + c.amount, 0);

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline) - new Date();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  };

  return { goals, addGoal, deleteGoal, contribute, removeContribution, getSaved, getDaysLeft };
}
