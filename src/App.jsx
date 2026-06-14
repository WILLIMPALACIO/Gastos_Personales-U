import { useEffect, useMemo, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'movimientos';
const THEME_KEY = 'tema';

function obtenerFechaHora(date) {
  const fecha = date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const hora = date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return { fecha, hora };
}

function formatearMoneda(valor) {
  return `$${Math.round(Math.abs(valor)).toLocaleString('es-CO')}`;
}

function App() {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('ingreso');
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('desc');
  const [tema, setTema] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved || 'claro';
    } catch {
      return 'claro';
    }
  });

  const [movimientos, setMovimientos] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Aplicar tema al elemento raíz
  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem(THEME_KEY, tema);
  }, [tema]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movimientos));
  }, [movimientos]);

  const agregarMovimiento = (e) => {
    e.preventDefault();

    const valor = Number(monto);
    if (!descripcion.trim() || !valor || valor <= 0) return;

    const ahora = new Date();
    const { fecha, hora } = obtenerFechaHora(ahora);

    const nuevo = {
      id: ahora.getTime(),
      descripcion: descripcion.trim(),
      monto: valor,
      tipo,
      fecha,
      hora,
    };

    setMovimientos((prev) => [...prev, nuevo]);
    setDescripcion('');
    setMonto('');
  };

  const eliminar = (id) => {
    setMovimientos((prev) => prev.filter((m) => m.id !== id));
  };

  const { ingresos, gastos, balance } = useMemo(() => {
    const ingresos = movimientos
      .filter((m) => m.tipo === 'ingreso')
      .reduce((acc, m) => acc + m.monto, 0);

    const gastos = movimientos
      .filter((m) => m.tipo === 'gasto')
      .reduce((acc, m) => acc + m.monto, 0);

    return { ingresos, gastos, balance: ingresos - gastos };
  }, [movimientos]);

  const totalMovimientos = movimientos.length;

  const porcentajeIngreso =
    ingresos + gastos === 0 ? 50 : (ingresos / (ingresos + gastos)) * 100;

  const movimientosFiltrados = useMemo(() => {
    return movimientos
      .filter((m) => filtro === 'todos' || m.tipo === filtro)
      .filter((m) =>
        m.descripcion.toLowerCase().includes(busqueda.trim().toLowerCase())
      )
      .sort((a, b) => (orden === 'desc' ? b.id - a.id : a.id - b.id));
  }, [movimientos, filtro, busqueda, orden]);

  const fechaHoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const toggleTema = () => {
    setTema((prev) => (prev === 'claro' ? 'oscuro' : 'claro'));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          Mis <span> Finanzas</span>
        </h1>
        <div className="header-right">
          <time>{fechaHoy}</time>
          <button
            className="btn-tema"
            onClick={toggleTema}
            title={`Cambiar a tema ${tema === 'claro' ? 'oscuro' : 'claro'}`}
            aria-label={`Cambiar a tema ${tema === 'claro' ? 'oscuro' : 'claro'}`}
          >
            {tema === 'claro' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <section className="hero">
        <p className="label">Balance total</p>
        <p className={`amount ${balance < 0 ? 'negative' : ''}`}>
          {balance < 0 ? '-' : ''}
          {formatearMoneda(balance)}
        </p>

        <div className="ratio-bar">
          <div
            className="seg-income"
            style={{ width: `${porcentajeIngreso}%` }}
          />
          <div
            className="seg-expense"
            style={{ width: `${100 - porcentajeIngreso}%` }}
          />
        </div>

        <div className="ratio-legend">
          <span>↑ Ingresos {formatearMoneda(ingresos)}</span>
          <span>↓ Gastos {formatearMoneda(gastos)}</span>
        </div>
      </section>

      <section className="stats">
        <div className="stat-card income">
          <p className="label">Total ingresos</p>
          <p className="value">+{formatearMoneda(ingresos)}</p>
        </div>

        <div className="stat-card expense">
          <p className="label">Total gastos</p>
          <p className="value">-{formatearMoneda(gastos)}</p>
        </div>

        <div className="stat-card">
          <p className="label">Movimientos</p>
          <p className="value">{totalMovimientos}</p>
        </div>
      </section>

      <section className="form-card">
        <h2>Nuevo movimiento</h2>

        <form className="form-row" onSubmit={agregarMovimiento}>
          <input
            type="text"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <input
            type="number"
            placeholder="Monto"
            value={monto}
            min="0"
            onChange={(e) => setMonto(e.target.value)}
          />

          <div className="tipo-toggle">
            <button
              type="button"
              className={tipo === 'ingreso' ? 'active income' : ''}
              onClick={() => setTipo('ingreso')}
            >
              Ingreso
            </button>
            <button
              type="button"
              className={tipo === 'gasto' ? 'active expense' : ''}
              onClick={() => setTipo('gasto')}
            >
              Gasto
            </button>
          </div>

          <button type="submit" className="btn-primary">
            Registrar movimiento
          </button>
        </form>
      </section>

      <section className="controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <button
            className={filtro === 'todos' ? 'active' : ''}
            onClick={() => setFiltro('todos')}
          >
            Todos
          </button>
          <button
            className={filtro === 'ingreso' ? 'active' : ''}
            onClick={() => setFiltro('ingreso')}
          >
            Ingresos
          </button>
          <button
            className={filtro === 'gasto' ? 'active' : ''}
            onClick={() => setFiltro('gasto')}
          >
            Gastos
          </button>
        </div>
      </section>

      <section className="table-card">
        <div className="table-wrapper">
          <div className="table-header">
            <span
              className="sortable"
              onClick={() => setOrden(orden === 'desc' ? 'asc' : 'desc')}
            >
              Fecha {orden === 'desc' ? '↓' : '↑'}
            </span>
            <span>Tipo</span>
            <span>Descripción</span>
            <span className="text-right">Valor</span>
            <span />
          </div>

          {movimientosFiltrados.length === 0 ? (
            <div className="empty-state">
              {movimientos.length === 0 ? (
                <p>Aún no registras movimientos. Agrega el primero arriba 👆</p>
              ) : (
                <p>No encontramos movimientos con ese criterio.</p>
              )}
            </div>
          ) : (
            movimientosFiltrados.map((m) => (
              <div key={m.id} className="table-row">
                <div className="col-fecha">
                  <span className="fecha-dia">{m.fecha}</span>
                  <span className="fecha-hora">{m.hora}</span>
                </div>

                <div className="col-tipo">
                  {m.tipo === 'ingreso' ? '💰' : '💸'}
                </div>

                <div className="col-desc">{m.descripcion}</div>

                <div className={`col-valor ${m.tipo}`}>
                  {m.tipo === 'ingreso' ? '+' : '-'}
                  {formatearMoneda(m.monto)}
                </div>

                <div className="col-del">
                  <button
                    onClick={() => eliminar(m.id)}
                    aria-label="Eliminar movimiento"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default App;