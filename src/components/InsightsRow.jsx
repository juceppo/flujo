import { useCurrency } from '../context/CurrencyContext';
import { getCategory } from '../utils/categories';

export default function InsightsRow({ transactions, selectedMonth, allTransactions }) {
  const { format } = useCurrency();

  const expenses = transactions.filter((t) => t.type === 'expense');
  const income   = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const total    = expenses.reduce((s, t) => s + t.amount, 0);

  // ─── Top expense category ───────────────────────
  const byCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  const topEntry = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0];
  const topCat   = topEntry ? getCategory(topEntry[0]) : null;

  // ─── Savings rate ────────────────────────────────
  const savingsRate  = income > 0 ? Math.round(((income - total) / income) * 100) : 0;
  const savingsLabel = savingsRate >= 30 ? '¡Excelente!' : savingsRate >= 10 ? 'Bien' : savingsRate >= 0 ? 'Ajustado' : 'Déficit';
  const savingsColor = savingsRate >= 30 ? '#059669' : savingsRate >= 10 ? '#d97706' : savingsRate >= 0 ? '#f97316' : '#dc2626';

  // ─── vs previous month ───────────────────────────
  const [y, m]    = selectedMonth.split('-').map(Number);
  const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const prevExp   = allTransactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(prevMonth))
    .reduce((s, t) => s + t.amount, 0);
  const diffPct = prevExp > 0 ? Math.round(((total - prevExp) / prevExp) * 100) : null;

  // ─── Month-end projection ────────────────────────
  const today      = new Date();
  const isCurrentM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(y, m, 0).getDate();
  const avgDaily   = dayOfMonth > 0 && total > 0 ? total / dayOfMonth : 0;
  const projected  = Math.round(avgDaily * daysInMonth);
  const projBalance = income > 0 ? income - projected : null;

  // ─── No-spend streak ─────────────────────────────
  let streak = 0;
  if (allTransactions.length > 0) {
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const d = new Date(today0); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const hasExpense = allTransactions.some((t) => t.type === 'expense' && t.date === ds);
      if (hasExpense) break;
      streak++;
    }
  }

  if (transactions.length === 0) return null;

  const cards = [
    topCat && {
      icon: topCat.icon,
      label: 'Mayor gasto',
      value: topCat.label,
      sub: format(topEntry[1]),
      accent: topCat.color,
    },
    {
      icon: savingsRate >= 0 ? '💰' : '⚠️',
      label: 'Tasa de ahorro',
      value: `${Math.abs(savingsRate)}%`,
      sub: savingsLabel,
      accent: savingsColor,
    },
    diffPct !== null && {
      icon: diffPct > 0 ? '📈' : '📉',
      label: 'vs mes anterior',
      value: `${diffPct > 0 ? '+' : ''}${diffPct}%`,
      sub: diffPct > 0 ? 'más gasto' : 'menos gasto',
      accent: diffPct > 0 ? '#dc2626' : '#059669',
    },
    isCurrentM && avgDaily > 0 && projBalance !== null && {
      icon: projBalance >= 0 ? '🎯' : '🚨',
      label: 'Proyección fin de mes',
      value: format(Math.abs(projBalance)),
      sub: projBalance >= 0 ? 'de superávit estimado' : 'de déficit estimado',
      accent: projBalance >= 0 ? '#059669' : '#dc2626',
    },
    streak >= 1 && {
      icon: streak >= 7 ? '🔥' : '✨',
      label: 'Racha sin gastos',
      value: `${streak} día${streak !== 1 ? 's' : ''}`,
      sub: streak >= 7 ? '¡Increíble disciplina!' : streak >= 3 ? 'Sigue así' : 'Buen comienzo',
      accent: streak >= 7 ? '#d97706' : '#059669',
    },
  ].filter(Boolean);

  return (
    <div className="insights-row">
      {cards.map((card, i) => (
        <div key={i} className="insight-card">
          <span className="insight-icon">{card.icon}</span>
          <div className="insight-body">
            <p className="insight-label">{card.label}</p>
            <p className="insight-value" style={{ color: card.accent }}>{card.value}</p>
            <p className="insight-sub">{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
