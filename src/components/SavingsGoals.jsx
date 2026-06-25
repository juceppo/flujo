import { useState } from 'react';
import { useSavings } from '../hooks/useSavings';
import { useCurrency } from '../context/CurrencyContext';

const GOAL_COLORS = ['#2563eb','#7c3aed','#059669','#c2410c','#be185d','#0f766e','#b45309','#374151'];

function CircleProgress({ pct, color, size = 88 }) {
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={7} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  );
}

function GoalCard({ goal, onContribute, onDelete, getSaved, getDaysLeft, format }) {
  const [open, setOpen]   = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote]   = useState('');

  const saved   = getSaved(goal);
  const pct     = goal.target > 0 ? Math.min(Math.round((saved / goal.target) * 100), 100) : 0;
  const done    = pct >= 100;
  const daysLeft = getDaysLeft(goal.deadline);
  const lastContribs = [...goal.contributions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || +amount <= 0) return;
    onContribute(goal.id, amount, note);
    setAmount('');
    setNote('');
    setOpen(false);
  };

  return (
    <div className={`goal-card ${done ? 'goal-card--done' : ''}`} style={{ '--goal-color': goal.color }}>
      <div className="goal-card__top">
        <div className="goal-card__circle">
          <CircleProgress pct={pct} color={goal.color} />
          <div className="goal-card__pct" style={{ color: done ? goal.color : 'var(--text)' }}>
            {done ? '✓' : `${pct}%`}
          </div>
        </div>

        <div className="goal-card__info">
          <div className="goal-card__name-row">
            <h4 className="goal-card__name">{goal.name}</h4>
            {done && <span className="goal-badge">¡Meta alcanzada!</span>}
          </div>
          <p className="goal-card__amounts">
            <span className="goal-card__saved" style={{ color: goal.color }}>{format(saved)}</span>
            <span className="goal-card__target"> / {format(goal.target)}</span>
          </p>
          {!done && goal.target > 0 && (
            <p className="goal-card__remaining">Faltan {format(goal.target - saved)}</p>
          )}
          {daysLeft !== null && (
            <p className={`goal-card__deadline ${daysLeft < 14 ? 'goal-card__deadline--urgent' : ''}`}>
              {daysLeft === 0 ? '¡Hoy es la fecha límite!' : `${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        <div className="goal-card__actions">
          {!done && (
            <button className="btn-contribute" onClick={() => setOpen((o) => !o)} style={{ borderColor: goal.color, color: goal.color }}>
              {open ? '✕' : '+ Aportar'}
            </button>
          )}
          <button className="btn-goal-delete" onClick={() => onDelete(goal.id)} aria-label="Eliminar meta">🗑</button>
        </div>
      </div>

      {open && (
        <form className="contribute-form" onSubmit={handleSubmit}>
          <input
            className="form-input contribute-input"
            type="number" min="0.01" step="any" placeholder="Importe a aportar" autoFocus
            value={amount} onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="form-input contribute-note"
            type="text" placeholder="Nota opcional (ej: quincena)"
            value={note} onChange={(e) => setNote(e.target.value)}
          />
          <button type="submit" className="btn-contribute-submit" style={{ background: goal.color }}>
            Añadir aporte →
          </button>
        </form>
      )}

      {lastContribs.length > 0 && (
        <ul className="goal-contribs">
          {lastContribs.map((c) => (
            <li key={c.id} className="goal-contrib-item">
              <span className="goal-contrib-dot" style={{ background: goal.color }} />
              <span className="goal-contrib-date">{c.date}</span>
              <span className="goal-contrib-amount">+{format(c.amount)}</span>
              {c.note && <span className="goal-contrib-note">{c.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewGoalForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ name: '', target: '', color: GOAL_COLORS[0], deadline: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.target || +form.target <= 0) return;
    onAdd(form);
    onCancel();
  };

  return (
    <form className="new-goal-form" onSubmit={handleSubmit}>
      <div className="new-goal-form__row">
        <div className="form-field" style={{ flex: 2 }}>
          <label className="form-label">Nombre de la meta</label>
          <input className="form-input" type="text" placeholder="Ej: Vacaciones, Emergencia, MacBook…" value={form.name} onChange={set('name')} autoFocus />
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label className="form-label">Objetivo</label>
          <input className="form-input" type="number" min="1" placeholder="3000" value={form.target} onChange={set('target')} />
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label className="form-label">Fecha límite <span style={{color:'var(--text-3)'}}>(opcional)</span></label>
          <input className="form-input" type="date" value={form.deadline} onChange={set('deadline')} />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Color</label>
        <div className="goal-color-picker">
          {GOAL_COLORS.map((c) => (
            <button
              key={c} type="button"
              className={`goal-color-btn ${form.color === c ? 'goal-color-btn--active' : ''}`}
              style={{ background: c }}
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div className="new-goal-form__footer">
        <button type="button" className="btn-cancel-goal" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-save-goal" style={{ background: form.color }}>Crear meta →</button>
      </div>
    </form>
  );
}

export default function SavingsGoals() {
  const { goals, addGoal, deleteGoal, contribute, getSaved, getDaysLeft } = useSavings();
  const { format } = useCurrency();
  const [adding, setAdding] = useState(false);

  const totalSaved  = goals.reduce((s, g) => s + getSaved(g), 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  return (
    <div className="savings-section">
      <div className="savings-header">
        <div>
          <h2 className="savings-title">Metas de ahorro</h2>
          {goals.length > 0 && (
            <p className="savings-subtitle">
              {format(totalSaved)} ahorrado de {format(totalTarget)} en total
            </p>
          )}
        </div>
        <button className="btn-new-goal" onClick={() => setAdding((a) => !a)}>
          {adding ? '✕ Cancelar' : '+ Nueva meta'}
        </button>
      </div>

      {adding && <NewGoalForm onAdd={addGoal} onCancel={() => setAdding(false)} />}

      {goals.length === 0 && !adding ? (
        <div className="savings-empty">
          <p className="savings-empty__icon">🏦</p>
          <p className="savings-empty__text">No tienes metas de ahorro todavía.</p>
          <p className="savings-empty__hint">Crea una meta para un viaje, fondo de emergencia o cualquier objetivo financiero.</p>
          <button className="btn-new-goal btn-new-goal--center" onClick={() => setAdding(true)}>
            + Crear primera meta
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onContribute={contribute}
              onDelete={deleteGoal}
              getSaved={getSaved}
              getDaysLeft={getDaysLeft}
              format={format}
            />
          ))}
        </div>
      )}
    </div>
  );
}
