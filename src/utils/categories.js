export const CATEGORIES = {
  salary:        { label: 'Salario',         icon: '💼', color: '#2563eb', type: 'income'  },
  freelance:     { label: 'Freelance',        icon: '💻', color: '#7c3aed', type: 'income'  },
  investment:    { label: 'Inversiones',      icon: '📈', color: '#059669', type: 'income'  },
  other_income:  { label: 'Otros ingresos',   icon: '💰', color: '#b45309', type: 'income'  },
  food:          { label: 'Comida',           icon: '🛒', color: '#c2410c', type: 'expense' },
  transport:     { label: 'Transporte',       icon: '🚗', color: '#1d4ed8', type: 'expense' },
  housing:       { label: 'Vivienda',         icon: '🏠', color: '#92400e', type: 'expense' },
  entertainment: { label: 'Entretenimiento',  icon: '🎬', color: '#6d28d9', type: 'expense' },
  health:        { label: 'Salud',            icon: '🏥', color: '#0f766e', type: 'expense' },
  shopping:      { label: 'Compras',          icon: '🛍️', color: '#be185d', type: 'expense' },
  education:     { label: 'Educación',        icon: '📚', color: '#0369a1', type: 'expense' },
  other:         { label: 'Otros',            icon: '📦', color: '#6b7280', type: 'expense' },
};

export const INCOME_CATEGORIES = Object.entries(CATEGORIES)
  .filter(([, v]) => v.type === 'income')
  .map(([id, v]) => ({ id, ...v }));

export const EXPENSE_CATEGORIES = Object.entries(CATEGORIES)
  .filter(([, v]) => v.type === 'expense')
  .map(([id, v]) => ({ id, ...v }));

export const getCategory = (id) => CATEGORIES[id] ?? CATEGORIES.other;
