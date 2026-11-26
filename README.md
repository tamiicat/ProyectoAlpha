# ProyectoAlpha

Sistema de Gestión Logística FYAG (Proyecto Alpha).

## Frontend (`frontend-react`)
Desarrollado con React, Vite, React Router DOM y Bootstrap.

### Requisitos
* Node.js (v18 o superior)
* npm

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

* Abre en el navegador `http://localhost:5173`.

## Backend y Credenciales

Desarrollado en Python 3.13 con Django (arquitectura MVC), persistencia SQLite/PostgreSQL y soporte NoSQL (MongoDB) para telemetría.

### Requisitos
* Python 3.12 o superior
* Entorno virtual (`venv`)

### Variables de entorno
Copia el archivo `.env.example` a `.env` en la raíz del proyecto y completa las credenciales necesarias (por ejemplo `MONGO_URI` si usas MongoDB externo; si se deja vacío, utiliza respaldo local en memoria).

### Instalación, Base de Datos y Ejecución
```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver