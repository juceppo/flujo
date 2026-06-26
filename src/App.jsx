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
import BusinessSection from './components/BusinessSection';
import { getMonthLabel } from './utils/format';

const NOW = new Date();
const CURRENT_MONTH = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}`;

export default function App() {
  const { transactions, addTransaction, deleteTransaction, getAvailableMonths } = useTransactions();
  const { isDark, toggle } = useTheme();
  const { code, select } = useCurrency();

  const [mode, setMode] = useState('personal'); // 'personal' | 'negocio'
  const months = getAvailableMonths();
  const [selectedMonth, setSelectedMonth] = useState(months[0] ?? CURRENT_MONTH);
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
              <span className="header__subtitle">{mode === 'negocio' ? 'mi negocio' : 'finanzas personales'}</span>
            </div>
          </div>

          {/* Mode switcher */}
          <div className="mode-switch">
            <button
              className={`mode-btn ${mode === 'personal' ? 'mode-btn--active' : ''}`}
              onClick={() => setMode('personal')}
            >Personal</button>
            <button
              className={`mode-btn ${mode === 'negocio' ? 'mode-btn--active' : ''}`}
              onClick={() => setMode('negocio')}
            >Negocio</button>
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

            {mode === 'personal' && (
              <select
                className="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.length === 0
                  ? <option value={CURRENT_MONTH}>{getMonthLabel(CURRENT_MONTH)}</option>
                  : months.map((m) => <option key={m} value={m}>{getMonthLabel(m)}</option>)
                }
              </select>
            )}

            <button
              className="btn-icon-toggle"
              onClick={toggle}
              aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? '☀' : '☾'}
            </button>

            {mode === 'personal' && (
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <span className="btn-primary__plus">+</span> Nuevo movimiento
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        {mode === 'personal' ? (
          <>
            <SummaryCards transactions={filtered} />
            <InsightsRow transactions={filtered} selectedMonth={selectedMonth} allTransactions={transactions} />
            <div className="charts-grid">
              <CategoryPieChart transactions={filtered} isDark={isDark} />
              <MonthlyBarChart transactions={transactions} isDark={isDark} />
            </div>
            <BudgetTracker transactions={filtered} selectedMonth={selectedMonth} />
            <SavingsGoals />
            <TransactionList transactions={filtered} onDelete={deleteTransaction} />
          </>
        ) : (
          <BusinessSection />
        )}
      </main>

      {showForm && <TransactionForm onAdd={addTransaction} onClose={() => setShowForm(false)} />}
    </div>
  );
}
