import { useState, useEffect, useRef } from 'react';
import { useCurrency } from '../context/CurrencyContext';

function AnimatedAmount({ value }) {
  const { format } = useCurrency();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to   = value;
    prev.current = to;
    if (from === to) return;

    const start = performance.now();
    const dur   = 520;
    function tick(now) {
      const t      = Math.min((now - start) / dur, 1);
      const eased  = 1 - (1 - t) ** 3;
      setDisplay(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
      else setDisplay(to);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return format(Math.round(display));
}

export default function SummaryCards({ transactions }) {
  const income   = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance  = income - expenses;
  const pct      = income > 0 ? Math.min(Math.round((expenses / income) * 100), 100) : 0;
  const barColor = pct > 90 ? '#f43f5e' : pct > 70 ? '#f59e0b' : '#10b981';

  return (
    <div className="balance-hero">
      <div className="balance-hero__deco"  />
      <div className="balance-hero__deco2" />

      <p className="balance-hero__label">Balance del mes</p>
      <p className={`balance-hero__amount ${balance < 0 ? 'balance-hero__amount--neg' : ''}`}>
        {balance < 0 && <span className="balance-sign">−</span>}
        <AnimatedAmount value={Math.abs(balance)} />
      </p>

      <div className="balance-hero__stats">
        <div className="bstat bstat--income">
          <span className="bstat__arrow">↑</span>
          <div>
            <p className="bstat__label">Ingresos</p>
            <p className="bstat__value"><AnimatedAmount value={income} /></p>
          </div>
        </div>
        <div className="bstat-divider" />
        <div className="bstat bstat--expense">
          <span className="bstat__arrow">↓</span>
          <div>
            <p className="bstat__label">Gastos</p>
            <p className="bstat__value"><AnimatedAmount value={expenses} /></p>
          </div>
        </div>
      </div>

      <div className="balance-hero__bar-wrap">
        <div className="balance-hero__bar">
          <div className="balance-hero__bar-fill" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <p className="balance-hero__bar-label">
          {pct}% del ingreso gastado
          {pct > 90 && <span className="balance-hero__warning"> ⚠ Presupuesto al límite</span>}
        </p>
      </div>
    </div>
  );
}
