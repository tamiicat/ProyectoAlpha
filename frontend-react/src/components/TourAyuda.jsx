import React, { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const PASOS_POR_ROL = {
  admin: [
    {
      element: '[data-tour="sidebar"]',
      popover: {
        title: 'Menú de Administración',
        description:
          'Desde aquí accedes a todos los módulos: usuarios, autorizaciones, inventario, categorías y bodegas, operaciones en terreno y finanzas.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="filtro-bodega"]',
      popover: {
        title: 'Filtro Global por Bodega',
        description:
          'Selecciona una bodega específica para filtrar en tiempo real los KPIs, las alertas y el listado de inventario, o vuelve a ver todas juntas.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="acciones-rapidas"]',
      popover: {
        title: 'Acciones Rápidas de Administrador',
        description:
          'Accesos directos a tus tareas más frecuentes: crear cuentas, revisar autorizaciones, añadir artículos y administrar categorías y bodegas.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="kpis"]',
      popover: {
        title: 'Indicadores y Valorización (KPIs)',
        description:
          'Visualiza total de artículos, stock óptimo, alertas críticas o preventivas y la valorización estimada en CLP según la bodega filtrada.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="alertas-stock"]',
      popover: {
        title: 'Inventario General y Alertas',
        description:
          'Alterna entre Todo el Inventario o solo Alertas Prioritarias y usa el buscador para encontrar artículos por nombre, código o bodega.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="stock-ubicacion"]',
      popover: {
        title: 'Stock por Bodega (Interactivo)',
        description:
          'Haz clic sobre cualquier bodega de esta lista para filtrar todo el panel al instante.',
        side: 'left',
      },
    },
    {
      element: '.fyag-a11y-widget',
      popover: {
        title: 'Botón de Accesibilidad',
        description:
          'Agranda el texto (A+ / A-), activa alto contraste, escala de grises o resalta botones cuando lo necesites.',
        side: 'left',
      },
    },
  ],
  bodeguero: [
    {
      element: '[data-tour="sidebar"]',
      popover: {
        title: 'Menú de Bodega',
        description:
          'Accede a inventario, alta de artículos, categorías y bodegas, cardex, recepción de compras, despachos, escáner y mermas.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="filtro-bodega"]',
      popover: {
        title: 'Filtrar por Bodega',
        description:
          'Elige la bodega que quieres revisar para ver exactamente qué insumos y alertas hay en ese sector.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="acciones-rapidas"]',
      popover: {
        title: 'Accesos Rápidos de Bodega',
        description:
          'Entra con un clic a añadir artículos, escanear códigos de barras, recibir compras o gestionar despachos.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="kpis"]',
      popover: {
        title: 'Control de Existencias',
        description:
          'Monitorea artículos registrados, niveles óptimos, alertas de stock y el total de unidades físicas en bodega.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="alertas-stock"]',
      popover: {
        title: 'Inventario y Reposición',
        description:
          'Revisa todo el inventario o filtra solo las alertas críticas, usando el buscador rápido por nombre o código de barras.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="stock-ubicacion"]',
      popover: {
        title: 'Distribución por Bodega',
        description:
          'Haz clic en una bodega para ver solo sus productos en la tabla y en los indicadores.',
        side: 'left',
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
        description:
          'Accede a diagnóstico técnico, solicitud de artículos, escáner, gestión de obras y registro de mermas.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="acciones-rapidas"]',
      popover: {
        title: 'Acciones Rápidas de Terreno',
        description:
          'Atajos directos para registrar un diagnóstico, solicitar materiales, escanear un insumo o revisar tus obras activas.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="filtro-bodega"]',
      popover: {
        title: 'Consultar Stock por Bodega',
        description:
          'Filtra por bodega antes de solicitar materiales para saber dónde hay disponibilidad.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="alertas-stock"]',
      popover: {
        title: 'Buscador de Insumos',
        description:
          'Busca rápidamente cualquier repuesto o material por nombre o código para verificar su stock actual.',
        side: 'top',
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
        description:
          'Revisa reportes financieros, compras, gestión de facturas, proveedores y clientes.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="acciones-rapidas"]',
      popover: {
        title: 'Accesos Rápidos de Finanzas',
        description:
          'Ingresa directo al módulo de compras, facturas, reporte financiero o administración de proveedores.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="kpis"]',
      popover: {
        title: 'Indicadores y Valorización',
        description:
          'Visualiza el resumen del inventario y la valorización estimada en pesos chilenos (CLP), filtrable por bodega.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="stock-ubicacion"]',
      popover: {
        title: 'Valorización por Bodega',
        description:
          'Haz clic en una bodega para recalcular los indicadores y la valorización de esa ubicación.',
        side: 'left',
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
        description:
          'Revisa autorizaciones pendientes, inventario, cardex, mermas, diagnóstico, obras y reportes financieros.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="acciones-rapidas"]',
      popover: {
        title: 'Control Rápido de Supervisión',
        description:
          'Accede al instante a autorizaciones pendientes, revisión de mermas, control de obras y movimientos de cardex.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="filtro-bodega"]',
      popover: {
        title: 'Supervisión por Bodega',
        description:
          'Filtra por ubicación para auditar el stock, las alertas críticas y la valorización de cada bodega.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="alertas-stock"]',
      popover: {
        title: 'Seguimiento de Inventario y Alertas',
        description:
          'Alterna entre el inventario completo y las alertas prioritarias para anticipar quiebres de stock.',
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

    const claveVista = `fyag_tour_visto_v2_${rol}`;

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
    const claveVista = `fyag_tour_visto_v2_${rol}`;
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
                className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center gap-2 text-start"
              >
                <i className="bi bi-search flex-shrink-0"></i>
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