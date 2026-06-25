import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SummaryCards from './SummaryCards';
import { CurrencyProvider } from '../context/CurrencyContext';

const wrap = ({ children }) => <CurrencyProvider>{children}</CurrencyProvider>;

const base = [
  { id: '1', type: 'income',  category: 'salary', description: 'Salario', amount: 1000, date: '2025-01-01' },
  { id: '2', type: 'expense', category: 'food',   description: 'Comida',  amount: 400,  date: '2025-01-05' },
];

describe('SummaryCards', () => {
  it('renders the balance section label', () => {
    render(<SummaryCards transactions={base} />, { wrapper: wrap });
    expect(screen.getByText(/balance del mes/i)).toBeInTheDocument();
  });

  it('renders income and expense labels', () => {
    render(<SummaryCards transactions={base} />, { wrapper: wrap });
    expect(screen.getByText(/ingresos/i)).toBeInTheDocument();
    expect(screen.getByText(/gastos/i)).toBeInTheDocument();
  });

  it('shows spending percentage text', () => {
    render(<SummaryCards transactions={base} />, { wrapper: wrap });
    expect(screen.getByText(/del ingreso gastado/i)).toBeInTheDocument();
  });

  it('shows 40% spent when income=1000 and expenses=400', () => {
    render(<SummaryCards transactions={base} />, { wrapper: wrap });
    expect(screen.getByText(/40%/)).toBeInTheDocument();
  });

  it('shows budget warning when expenses exceed 90% of income', () => {
    const txns = [
      { id: '1', type: 'income',  category: 'salary', description: 'Salario', amount: 1000, date: '2025-01-01' },
      { id: '2', type: 'expense', category: 'food',   description: 'Comida',  amount: 950,  date: '2025-01-05' },
    ];
    render(<SummaryCards transactions={txns} />, { wrapper: wrap });
    expect(screen.getByText(/presupuesto al límite/i)).toBeInTheDocument();
  });

  it('does not show budget warning when spending is moderate', () => {
    render(<SummaryCards transactions={base} />, { wrapper: wrap });
    expect(screen.queryByText(/presupuesto al límite/i)).not.toBeInTheDocument();
  });

  it('renders with empty transactions without crashing', () => {
    render(<SummaryCards transactions={[]} />, { wrapper: wrap });
    expect(screen.getByText(/balance del mes/i)).toBeInTheDocument();
  });
});
