# Flujo — Tu dinero, claro

Flujo es una aplicación web que construí para tener un control real de mis finanzas personales sin depender de hojas de cálculo ni de apps que piden acceso a mis cuentas bancarias. Todo funciona en el navegador con `localStorage`, así que mis datos nunca salen del dispositivo.

---

## Qué puedo hacer con Flujo

- **Registrar ingresos y gastos** con categoría, descripción y fecha
- Ver el **balance del mes** con animación de conteo y barra de presupuesto
- **Tarjetas de insights** automáticas: mayor categoría de gasto, tasa de ahorro, promedio diario y comparación con el mes anterior
- **Gráfica de torta** de gastos por categoría con colores semánticos
- **Gráfica de barras** con el resumen de los últimos 6 meses
- **Buscar movimientos** por descripción o categoría en tiempo real
- **Exportar a CSV** compatible con Excel (UTF-8 con BOM)
- Seleccionar entre **8 monedas** (USD, EUR, COP, MXN, ARS, BRL, GBP, CLP)
- Alternar entre **modo claro y oscuro** con un solo clic
- Los datos persisten entre sesiones vía `localStorage`

---

## Stack

| Tecnología | Uso |
|---|---|
| React 18 | UI y gestión de estado |
| Vite 5 | Bundler y servidor de desarrollo |
| Recharts | Gráficas interactivas |
| Context API | Estado global de moneda |
| CSS custom properties | Theming dark/light mode |
| `localStorage` | Persistencia sin backend |
| `Intl.NumberFormat` | Formateo de moneda por locale |
| `requestAnimationFrame` | Animación del contador de balance |

---

## Cómo correrlo localmente

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/flujo.git
cd flujo

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador. La app viene con datos de ejemplo de enero a marzo 2025 para que puedas explorar todas las funcionalidades desde el primer momento.

Para construir para producción:

```bash
npm run build
```

---

## Estructura del proyecto

```
src/
├── components/
│   ├── SummaryCards.jsx      # Hero de balance con contador animado
│   ├── InsightsRow.jsx       # 4 tarjetas de análisis automático
│   ├── CategoryPieChart.jsx  # Torta de gastos por categoría
│   ├── MonthlyBarChart.jsx   # Barras de últimos 6 meses
│   ├── TransactionForm.jsx   # Modal para agregar movimientos
│   └── TransactionList.jsx   # Lista con búsqueda y exportación
├── context/
│   └── CurrencyContext.jsx   # Estado global de moneda seleccionada
├── hooks/
│   ├── useTransactions.js    # CRUD de transacciones + localStorage
│   └── useTheme.js           # Dark/light mode con persistencia
├── utils/
│   ├── categories.js         # Definición de categorías con iconos y colores
│   ├── export.js             # Generación de CSV con BOM para Excel
│   └── format.js             # Fechas en español, labels de mes
└── App.jsx                   # Layout principal e integración de hooks
```

---

## Decisiones técnicas que me parecen interesantes

**Animación del balance sin librerías:** En lugar de usar una dependencia de animación, implementé el contador con `requestAnimationFrame` y una curva de easing cúbica (`1 - (1-t)³`). Cuando el balance cambia de mes en mes, el número "vuela" hasta el nuevo valor en 520ms. Se ve mucho más vivo que un cambio instantáneo.

**Formato de moneda por locale:** Cada moneda tiene asociado su locale (`es-CO` para COP, `pt-BR` para BRL, etc.), así `Intl.NumberFormat` formatea automáticamente los separadores de miles y decimales de la manera correcta para cada región. No hay strings hardcodeados de "$" o "€".

**Dark mode sin JavaScript extra:** El tema oscuro funciona cambiando un atributo `data-theme="dark"` en el elemento `<html>`. Toda la paleta de colores son CSS custom properties que se redefinen en ese selector. La transición de 200ms en `body` hace que el cambio se sienta suave.

**Export CSV listo para Excel:** El CSV se genera con un BOM UTF-8 al inicio (`﻿`) y separadores de punto y coma. Sin esto, los caracteres en español (tildes, ñ) aparecen corruptos al abrir el archivo en Excel en Windows.

---

## Despliegue

La app está lista para desplegarse en Vercel o Netlify con configuración cero — es estática y no tiene backend. Solo hay que conectar el repositorio y listo.

---

Construido con React + Vite. Sin backend, sin tracking, sin cuentas. Solo tus datos y tu navegador.
