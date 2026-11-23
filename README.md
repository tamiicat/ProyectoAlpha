# Proyecto Alpha (FYAG) - Estructura MVC

Proyecto organizado en capas `models/`, `views/` y `controllers/`, con punto de entrada `main.py`, configuración en `config/`, carpetas `static/` y `templates/`, y suite de pruebas en `tests/`.

## Estructura

```text
ProyectoAlpha-MVC/
├── main.py
├── manage.py
├── requirements.txt
├── Dockerfile
├── .env.example
├── .gitignore
├── verificar_evidencias.py
├── models/
│   ├── __init__.py
│   ├── orden_obra_model.py
│   └── seguridad_model.py
├── views/
│   ├── __init__.py
│   ├── api_views.py
│   └── auth_service_view.py
├── controllers/
│   ├── __init__.py
│   ├── rbac_xss_controller.py
│   ├── middleware_controller.py
│   └── urls_controller.py
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── wsgi.py
│   └── asgi.py
├── static/
├── templates/
└── tests/
    ├── __init__.py
    ├── test_microservice.py
    └── test_security.py
```

## Ejecución rápida

```bash
python main.py check
python verificar_evidencias.py
pytest
```
