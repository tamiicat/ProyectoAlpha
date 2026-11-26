# ProyectoAlpha

Sistema de Gestión Logística FYAG (Proyecto Alpha).

## Frontend (`frontend-react`)
Desarrollado con React, Vite, React Router DOM y Bootstrap.

### Requisitos
- Node.js (v18 o superior)
- npm

### Variables de entorno
Crea un archivo `.env` dentro de la carpeta `frontend-react` con las siguientes variables (solicitar las URLs reales al equipo):
```env
VITE_API_URL=URL_DEL_BACKEND
VITE_AUTH_URL=URL_DEL_SERVICIO_AUTH
```

### Ejecución
```bash
cd frontend-react
npm install
npm run dev
```

- Abre en el navegador `http://localhost:5173`.

## Backend, Microservicio Auth y Credenciales

Desarrollado en Python 3.13 con Django (arquitectura MVC), persistencia SQLite/PostgreSQL, soporte NoSQL (MongoDB) para telemetría y microservicio de autenticación IAM en `views/auth_service_view.py` (puerto `8001`).

### Requisitos
- Python 3.12 o superior
- Entorno virtual (`venv`)

### Variables de entorno
Copia el archivo `.env.example` a `.env` en la raíz del proyecto y completa las credenciales necesarias (por ejemplo `MONGO_URI` si usas MongoDB externo; si se deja vacío, utiliza respaldo local en memoria).

### Instalación, Base de Datos y Ejecución

1. **Backend principal (Django - Puerto 8000):**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

2. **Microservicio de autenticación (Puerto 8001):**
   En otra terminal con el entorno virtual activo:
   ```powershell
   .\.venv\Scripts\activate
   python -m views.auth_service_view
   ```

### Pruebas QA y Verificación
```powershell
pytest -v
python verificar_evidencias.py
```

### Credenciales y Roles de Prueba (RBAC)
- **Usuario demo visible en `DEMO_USERS` (`views/auth_service_view.py`):**
  - Correo: `admin@fyag.cl`
  - Contraseña: `AdminFyag2026#`
  - Rol: `ADMIN_TI` *(revisa `DEMO_USERS` en `views/auth_service_view.py` para ver los demás usuarios registrados)*
- **Cabecera RBAC para pruebas directas de API:** envía `X-User-Role` según el rol requerido (por ejemplo `admin` o `bodeguero`).