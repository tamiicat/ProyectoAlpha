"""Rutas del API REST de Inventario y Obras - Proyecto Alpha."""

from django.urls import path

from src.inventario.rbac_views import (
    api_crear_inventario,
    api_health,
    api_listar_inventario,
    registrar_avance_obra,
)

urlpatterns = [
    path("api/v1/health/", api_health, name="api_health"),
    path("api/v1/obras/avance/", registrar_avance_obra, name="obra_avance"),
    path(
        "api/v1/inventario/items/",
        api_listar_inventario,
        name="inventario_listar",
    ),
    path(
        "api/v1/inventario/items/crear/",
        api_crear_inventario,
        name="inventario_crear",
    ),
]
