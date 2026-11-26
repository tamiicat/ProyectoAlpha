import React, { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const PASOS_POR_ROL = {
  admin: [
    {
      element: '[data-tour="sidebar"]',
      popover: {
        title: 'Menú de Administración',
        description: 'Desde aquí accedes a usuarios, autorizaciones, inventario, operaciones en terreno, finanzas y entidades registradas.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="header-acciones"]',
      popover: {
        title: 'Estado del Sistema y Actualización',
        description: 'Verifica si la API está en línea o presiona Actualizar para refrescar los indicadores en tiempo real.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="kpis"]',
      popover: {
        title: 'Resumen General (KPIs)',
        description: 'Revisa de un vistazo el total de artículos, stock óptimo, alertas críticas o preventivas y la valorización en CLP.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="alertas-stock"]',
      popover: {
        title: 'Alertas de Reposición Prioritaria',
        description: 'Aquí aparecen los insumos que requieren reposición urgente o preventiva, junto con un acceso directo al inventario.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="stock-ubicacion"]',
      popover: {
        title: 'Distribución por Ubicación',
        description: 'Compara cómo se reparten tus artículos entre las distintas bodegas o ubicaciones.',
        side: 'left',
      },
    },
    {
      element: '.fyag-a11y-widget',
      popover: {
        title: 'Botón de Accesibilidad',
        description: 'Si necesitas leer más cómodo, puedes agrandar el texto (A+ / A-), activar alto contraste, escala de grises o resaltar botones.',
        side: 'left',
      },
    },
  ],
  bodeguero: [
    {
      element: '[data-tour="sidebar"]',
      popover: {
        title: 'Menú de Bodega',
        description: 'Encuentra aquí inventario, alta de artículos, cardex, recepción de compras, despachos, escáner y registro de mermas.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="kpis"]',
      popover: {
        title: 'Control de Existencias',
        description: 'Monitorea artículos registrados, niveles óptimos y alertas de stock para evitar quiebres en bodega.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="alertas-stock"]',
      popover: {
        title: 'Reposición Urgente',
        description: 'Prioriza los productos con stock crítico o bajo antes de que falten en operación.',
        side: 'top',
      },
    },
    {
      element: '.fyag-a11y-widget',
      popover: {
        title: 'Accesibilidad Visual',
        description: 'Ajusta el tamaño del texto o el contraste en cualquier momento desde este botón.',
        side: 'left',
      },
    },
  ],
  tecnico: [
    {
      element: '[data-tour="sidebar"]',
      popover: {
        title: 'Herramientas en Terreno',
        description: 'Accede a diagnóstico técnico, solicitud de artículos, escáner, gestión de obras y registro de mermas.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="kpis"]',
      popover: {
        title: 'Disponibilidad de Insumos',
        description: 'Consulta rápidamente el estado general del inventario y las alertas activas.',
        side: 'bottom',
      },
    },
    {
      element: '.fyag-a11y-widget',
      popover: {
        title: 'Accesibilidad Visual',
        description: 'Agranda el texto o cambia el contraste si trabajas en terreno o con poca luz.',
        side: 'left',
      },
    },
  ],
  finanzas: [
    {
      element: '[data-tour="sidebar"]',
      popover: {
        title: 'Módulos Financieros',
        description: 'Revisa reportes financieros, compras, gestión de facturas, proveedores y clientes.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="kpis"]',
      popover: {
        title: 'Indicadores y Valorización',
        description: 'Visualiza el resumen del inventario y la valorización estimada en pesos chilenos (CLP).',
        side: 'bottom',
      },
    },
    {
      element: '.fyag-a11y-widget',
      popover: {
        title: 'Accesibilidad Visual',
        description: 'Aumenta el tamaño de letra o el contraste para revisar cifras con mayor comodidad.',
        side: 'left',
      },
    },
  ],
  supervisor: [
    {
      element: '[data-tour="sidebar"]',
      popover: {
        title: 'Panel de Supervisión',
        description: 'Revisa autorizaciones pendientes, inventario, cardex, mermas, diagnóstico, obras y reportes financieros.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="alertas-stock"]',
      popover: {
        title: 'Seguimiento de Alertas',
        description: 'Supervisa los artículos críticos o bajos y accede rápido al inventario completo.',
        side: 'top',
      },
    },
    {
      element: '.fyag-a11y-widget',
      popover: {
        title: 'Accesibilidad Visual',
        description: 'Personaliza el tamaño de fuente y el contraste cuando lo necesites.',
        side: 'left',
      },
    },
  ],
};

export default function TourAyuda({ rol = 'admin', autoIniciar = true }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const pasosDisponibles = (PASOS_POR_ROL[rol] || PASOS_POR_ROL.admin).filter((paso) => {
    if (!paso.element) return true;
    return Boolean(document.querySelector(paso.element));
  });

  const iniciarTour = (stepsToRun = pasosDisponibles) => {
    if (!stepsToRun.length) return;
    setMenuAbierto(false);

    const claveVista = `fyag_tour_visto_${rol}`;

    const instancia = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: 'Finalizar',
      progressText: 'Paso {{current}} de {{total}}',
      steps: stepsToRun,
      onDestroyed: () => {
        try {
          localStorage.setItem(claveVista, 'true');
        } catch {
          // Ignorar errores de storage
        }
      },
    });

    instancia.drive();
  };

  useEffect(() => {
    if (!autoIniciar) return;
    const claveVista = `fyag_tour_visto_${rol}`;
    let yaVisto = false;
    try {
      yaVisto = localStorage.getItem(claveVista) === 'true';
    } catch {
      yaVisto = false;
    }

    if (yaVisto) return;

    const timer = setTimeout(() => {
      const validos = (PASOS_POR_ROL[rol] || PASOS_POR_ROL.admin).filter((paso) =>
        document.querySelector(paso.element)
      );
      if (validos.length) {
        iniciarTour(validos);
      }
    }, 600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol, autoIniciar]);

  const verSeccionEspecifica = (selector) => {
    const paso = pasosDisponibles.find((p) => p.element === selector);
    if (paso) {
      iniciarTour([paso]);
    }
  };

  return (
    <div className="fyag-help-widget">
      {menuAbierto && (
        <div
          className="card shadow-lg border-0 mb-2"
          style={{
            width: '260px',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
          role="dialog"
          aria-label="Guía y ayuda interactiva"
        >
          <div
            className="px-3 py-2 text-white d-flex justify-content-between align-items-center"
            style={{ backgroundColor: '#1b2e42' }}
          >
            <span className="fw-semibold small">Guía Interactiva</span>
            <button
              type="button"
              className="btn-close btn-close-white btn-sm"
              aria-label="Cerrar menú de ayuda"
              onClick={() => setMenuAbierto(false)}
            />
          </div>

          <div className="card-body p-3 bg-white d-flex flex-column gap-2">
            <button
              type="button"
              onClick={() => iniciarTour(pasosDisponibles)}
              className="btn btn-sm text-white w-100 fw-semibold"
              style={{ backgroundColor: '#1b2e42' }}
            >
              <i className="bi bi-play-circle me-1"></i> Iniciar tour completo
            </button>

            <div className="text-muted fw-semibold mt-1" style={{ fontSize: '0.72rem' }}>
              VER SECCIÓN ESPECÍFICA
            </div>

            {pasosDisponibles.map((paso) => (
              <button
                key={paso.element}
                type="button"
                onClick={() => verSeccionEspecifica(paso.element)}
                className="btn btn-outline-secondary btn-sm w-100 justify-content-start text-start"
              >
                <i className="bi bi-search"></i>
                <span className="text-truncate">{paso.popover.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botón flotante de signo de interrogación (?) */}
      <button
        type="button"
        onClick={() => setMenuAbierto((prev) => !prev)}
        aria-label="Abrir guía y tutorial interactivo"
        title="Ayuda y tutorial"
        className="btn shadow-lg d-flex align-items-center justify-content-center ms-auto"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#1b2e42',
          color: '#ffffff',
          border: '2.5px solid #ffffff',
          padding: 0,
          fontSize: '1.3rem',
          fontWeight: 700,
        }}
      >
        ?
      </button>
    </div>
  );
}