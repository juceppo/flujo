import { createContext, useContext, useState, useCallback } from 'react';

export const CURRENCIES = [
  { code: 'USD', label: 'USD — Dólar americano',   locale: 'en-US' },
  { code: 'EUR', label: 'EUR — Euro',               locale: 'es-ES' },
  { code: 'COP', label: 'COP — Peso colombiano',   locale: 'es-CO' },
  { code: 'MXN', label: 'MXN — Peso mexicano',     locale: 'es-MX' },
  { code: 'ARS', label: 'ARS — Peso argentino',    locale: 'es-AR' },
  { code: 'BRL', label: 'BRL — Real brasileño',    locale: 'pt-BR' },
  { code: 'GBP', label: 'GBP — Libra esterlina',   locale: 'en-GB' },
  { code: 'CLP', label: 'CLP — Peso chileno',      locale: 'es-CL' },
];

const CurrencyCtx = createContext(null);

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(
    () => localStorage.getItem('flujo_currency') || 'USD'
  );

  const currency = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];

  const format = useCallback(
    (amount) =>
      new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount),
    [currency]
  );

  const select = (c) => {
    localStorage.setItem('flujo_currency', c);
    setCode(c);
  };

  return (
    <CurrencyCtx.Provider value={{ code, currency, select, format }}>
      {children}
    </CurrencyCtx.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyCtx);
