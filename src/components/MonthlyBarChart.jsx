import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useCurrency } from '../context/CurrencyContext';

const INCOME_COLOR  = '#2563eb';
const EXPENSE_COLOR = '#c2410c';

export default function MonthlyBarChart({ transactions, isDark }) {
  const { format } = useCurrency();
  const tickColor = isDark ? '#475569' : '#9ca3af';
  const gridColor = isDark ? 'rgba(255,255,255,.04)' : '#f1f0ec';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip__month">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="chart-tooltip__row">
            <span className="chart-tooltip__dot" style={{ background: p.color }} />
            <span className="chart-tooltip__key">{p.name}</span>
            <span className="chart-tooltip__val">{format(p.value)}</span>
          </div>
        ))}
        {payload.length === 2 && (
          <div className="chart-tooltip__balance">
            Balance: {format(payload[0].value - payload[1].value)}
          </div>
        )}
      </div>
    );
  };

  const monthly = {};
  transactions.forEach((t) => {
    const m = t.date.substring(0, 7);
    if (!monthly[m]) monthly[m] = { ingresos: 0, gastos: 0 };
    if (t.type === 'income') monthly[m].ingresos += t.amount;
    else monthly[m].gastos += t.amount;
  });

  const data = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, vals]) => ({
      mes: new Date(month + '-15').toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
      Ingresos: vals.ingresos,
      Gastos:   vals.gastos,
    }));

  return (
    <div className="chart-card">
      <div className="chart-card__head">
        <h3 className="chart-card__title">Resumen mensual</h3>
        <p className="chart-card__sub">Últimos {data.length} meses</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barSize={22} barCategoryGap="35%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: tickColor, fontWeight: 500 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: tickColor }}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)', radius: 6 }} />
          <Legend
            iconType="circle"
            iconSize={7}
            formatter={(v) => <span style={{ fontSize: 12, color: tickColor, fontWeight: 500 }}>{v}</span>}
          />
          <Bar dataKey="Ingresos" fill={INCOME_COLOR}  radius={[5, 5, 0, 0]} />
          <Bar dataKey="Gastos"   fill={EXPENSE_COLOR} radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
