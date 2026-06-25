export const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

export const formatDate = (dateString) =>
  new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
  });

export const getMonthLabel = (yearMonth) => {
  const [year, month] = yearMonth.split('-');
  const label = new Date(+year, +month - 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};
