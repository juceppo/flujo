import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getCategory } from '../utils/categories';
import { useCurrency } from '../context/CurrencyContext';

export default function CategoryPieChart({ transactions, isDark }) {
  const { format } = useCurrency();

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip__row" style={{ gap: 8 }}>
          <span className="chart-tooltip__dot" style={{ background: d.payload.color }} />
          <span className="chart-tooltip__key">{d.name}</span>
        </div>
        <p className="chart-tooltip__val" style={{ marginTop: 6 }}>{format(d.value)}</p>
        <p className="chart-tooltip__pct">{d.payload.pct}% del total</p>
      </div>
    );
  };

  const byCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});

  const total = Object.values(byCategory).reduce((s, v) => s + v, 0);

  const data = Object.entries(byCategory)
    .map(([id, value]) => ({
      name:  getCategory(id).label,
      value,
      color: getCategory(id).color,
      pct:   total > 0 ? Math.round((value / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="chart-card chart-card--empty">
        <div className="chart-card__head">
          <h3 className="chart-card__title">Gastos por categoría</h3>
        </div>
        <div className="chart-empty-state">
          <p className="chart-empty-state__icon">📊</p>
          <p className="chart-empty-state__text">Sin gastos registrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-card__head">
        <h3 className="chart-card__title">Gastos por categoría</h3>
        <p className="chart-card__sub">{format(total)} total</p>
      </div>

      <div className="pie-layout">
        <div className="pie-chart-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-center">
            <p className="pie-center__label">Total</p>
            <p className="pie-center__value">{format(total)}</p>
          </div>
        </div>

        <ul className="pie-legend">
          {data.slice(0, 6).map((e) => (
            <li key={e.name} className="pie-legend__item">
              <span className="pie-legend__bar" style={{ background: e.color }} />
              <div className="pie-legend__text">
                <span className="pie-legend__name">{e.name}</span>
                <span className="pie-legend__pct">{e.pct}%</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
