import { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useTheme } from './hooks/useTheme';
import { useCurrency, CURRENCIES } from './context/CurrencyContext';
import SummaryCards from './components/SummaryCards';
import CategoryPieChart from './components/CategoryPieChart';
import MonthlyBarChart from './components/MonthlyBarChart';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import InsightsRow from './components/InsightsRow';
import BudgetTracker from './components/BudgetTracker';
import SavingsGoals from './components/SavingsGoals';
import { getMonthLabel } from './utils/format';

export default function App() {
  const { transactions, addTransaction, deleteTransaction, getAvailableMonths } = useTransactions();
  const { isDark, toggle } = useTheme();
  const { code, select } = useCurrency();

  const months = getAvailableMonths();
  const [selectedMonth, setSelectedMonth] = useState(months[0] ?? '2025-03');
  const [showForm, setShowForm] = useState(false);

  const filtered = transactions.filter((t) => t.date.startsWith(selectedMonth));

  return (
    <div className="app">
      <header className="header">
        <div className="header__inner">
          <div className="header__brand">
            <div className="header__logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity=".95"/>
                <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="header__brand-text">
              <span className="header__title">flujo</span>
              <span className="header__subtitle">finanzas personales</span>
            </div>
          </div>

          <div className="header__controls">
            <div className="currency-picker">
              <span className="currency-picker__flag">
                {{ USD:'🇺🇸', EUR:'🇪🇺', COP:'🇨🇴', MXN:'🇲🇽', ARS:'🇦🇷', BRL:'🇧🇷', GBP:'🇬🇧', CLP:'🇨🇱' }[code] ?? '💱'}
              </span>
              <select
                className="currency-select"
                value={code}
                onChange={(e) => select(e.target.value)}
                title="Cambiar moneda"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <span className="currency-picker__arrow">▾</span>
            </div>

            <select
              className="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((m) => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
            </select>

            <button
              className="btn-icon-toggle"
              onClick={toggle}
              aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? '☀' : '☾'}
            </button>

            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <span className="btn-primary__plus">+</span> Nuevo movimiento
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <SummaryCards transactions={filtered} />
        <InsightsRow transactions={filtered} selectedMonth={selectedMonth} allTransactions={transactions} />
        <div className="charts-grid">
          <CategoryPieChart transactions={filtered} isDark={isDark} />
          <MonthlyBarChart transactions={transactions} isDark={isDark} />
        </div>
        <BudgetTracker transactions={filtered} selectedMonth={selectedMonth} />
        <SavingsGoals />
        <TransactionList transactions={filtered} onDelete={deleteTransaction} />
      </main>

      {showForm && <TransactionForm onAdd={addTransaction} onClose={() => setShowForm(false)} />}
    </div>
  );
}
