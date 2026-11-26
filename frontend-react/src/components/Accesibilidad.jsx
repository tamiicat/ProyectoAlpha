import React, { useEffect, useState } from 'react';

const CONFIG_INICIAL = {
  tamanoTexto: 100, // porcentaje: 100, 115, 130, 145
  altoContraste: false,
  escalaGrises: false,
  resaltarEnlaces: false,
};

export default function Accesibilidad() {
  const [abierto, setAbierto] = useState(false);
  const [config, setConfig] = useState(() => {
    try {
      const guardado = localStorage.getItem('fyag_accesibilidad');
      return guardado ? { ...CONFIG_INICIAL, ...JSON.parse(guardado) } : CONFIG_INICIAL;
    } catch {
      return CONFIG_INICIAL;
    }
  });

  useEffect(() => {
    const html = document.documentElement;
    html.style.fontSize = `${config.tamanoTexto}%`;

    html.classList.toggle('fyag-alto-contraste', config.altoContraste);
    html.classList.toggle('fyag-escala-grises', config.escalaGrises);
    html.classList.toggle('fyag-resaltar-enlaces', config.resaltarEnlaces);

    try {
      localStorage.setItem('fyag_accesibilidad', JSON.stringify(config));
    } catch {
      // Ignorar si el navegador bloquea storage
    }
  }, [config]);

  const cambiarTamano = (delta) => {
    setConfig((prev) => ({
      ...prev,
      tamanoTexto: Math.min(145, Math.max(90, prev.tamanoTexto + delta)),
    }));
  };

  const toggleOpcion = (clave) => {
    setConfig((prev) => ({ ...prev, [clave]: !prev[clave] }));
  };

  const restablecer = () => {
    setConfig(CONFIG_INICIAL);
  };

  return (
    <div className="fyag-a11y-widget">
      {abierto && (
        <div
          className="card shadow-lg border-0 mb-3"
          style={{
            width: '280px',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
          role="dialog"
          aria-label="Opciones de accesibilidad"
        >
          <div
            className="px-3 py-2 text-white d-flex justify-content-between align-items-center"
            style={{ backgroundColor: '#1b2e42' }}
          >
            <span className="fw-semibold small">Accesibilidad</span>
            <button
              type="button"
              className="btn-close btn-close-white btn-sm"
              aria-label="Cerrar panel de accesibilidad"
              onClick={() => setAbierto(false)}
            />
          </div>

          <div className="card-body p-3 bg-white d-flex flex-column gap-3">
            {/* Tamaño de letra */}
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-semibold text-dark">Tamaño de texto</span>
                <span className="badge bg-light text-dark border">{config.tamanoTexto}%</span>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm flex-fill"
                  onClick={() => cambiarTamano(-15)}
                  disabled={config.tamanoTexto <= 90}
                >
                  A-
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm flex-fill"
                  onClick={() => setConfig((prev) => ({ ...prev, tamanoTexto: 100 }))}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm flex-fill"
                  onClick={() => cambiarTamano(15)}
                  disabled={config.tamanoTexto >= 145}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Modos visuales */}
            <div className="d-flex flex-column gap-2">
              <button
                type="button"
                onClick={() => toggleOpcion('altoContraste')}
                className={`btn btn-sm w-100 justify-content-between ${
                  config.altoContraste ? 'btn-dark' : 'btn-outline-secondary'
                }`}
              >
                <span>Alto contraste</span>
                <i className={`bi ${config.altoContraste ? 'bi-check-circle-fill' : 'bi-circle'}`} />
              </button>

              <button
                type="button"
                onClick={() => toggleOpcion('escalaGrises')}
                className={`btn btn-sm w-100 justify-content-between ${
                  config.escalaGrises ? 'btn-dark' : 'btn-outline-secondary'
                }`}
              >
                <span>Escala de grises</span>
                <i className={`bi ${config.escalaGrises ? 'bi-check-circle-fill' : 'bi-circle'}`} />
              </button>

              <button
                type="button"
                onClick={() => toggleOpcion('resaltarEnlaces')}
                className={`btn btn-sm w-100 justify-content-between ${
                  config.resaltarEnlaces ? 'btn-dark' : 'btn-outline-secondary'
                }`}
              >
                <span>Resaltar botones</span>
                <i className={`bi ${config.resaltarEnlaces ? 'bi-check-circle-fill' : 'bi-circle'}`} />
              </button>
            </div>

            <button
              type="button"
              onClick={restablecer}
              className="btn btn-link btn-sm text-decoration-none text-muted p-0"
            >
              Restablecer valores
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante con ícono universal de accesibilidad */}
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-label="Abrir opciones de accesibilidad"
        title="Accesibilidad"
        className="btn shadow-lg d-flex align-items-center justify-content-center ms-auto"
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: '#0ea5e9',
          color: '#ffffff',
          border: '3px solid #ffffff',
          padding: 0,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M9.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M6 5.5l-4.535-.442A.531.531 0 0 1 1.531 4H14.47a.531.531 0 0 1 .066 1.058L10 5.5V9l.452 6.42a.535.535 0 0 1-1.053.174L8.243 9.97c-.064-.252-.422-.252-.486 0l-1.156 5.624a.535.535 0 0 1-1.053-.174L6 9z" />
        </svg>
      </button>
    </div>
  );
}