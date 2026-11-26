"""Capa Controlador (MVC): Enrutamiento central de URLs."""

from django.contrib import admin
from django.urls import path

from views.api_views import (
    api_buscar_inventario,
    api_cardex,
    api_categorias,
    api_crear_inventario,
    api_health,
    api_listar_inventario,
    api_orquestar_movimiento,
    api_sincronizar_offline,
    api_solicitudes,
    api_ubicaciones,
    api_usuarios,
    health_check,
    registrar_avance_obra,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="core_health"),
    path("api/v1/inventario/health/", api_health, name="inventario_health"),
    path("api/v1/obras/avance/", registrar_avance_obra, name="obra_avance"),
    path("api/v1/inventario/items/", api_listar_inventario, name="inventario_listar"),
    path("api/v1/inventario/items/crear/", api_crear_inventario, name="inventario_crear"),
    path("api/v1/inventario/search/", api_buscar_inventario, name="inventario_search"),
    path("api/v1/categorias/", api_categorias, name="api_categorias"),
    path("api/v1/ubicaciones/", api_ubicaciones, name="api_ubicaciones"),
    path("api/v1/inventario/categorias/", api_categorias, name="inventario_categorias"),
    path("api/v1/inventario/ubicaciones/", api_ubicaciones, name="inventario_ubicaciones"),
    path("api/v1/movimientos/orquestar/", api_orquestar_movimiento, name="movimientos_orquestar"),
    path("api/v1/sync/batch/", api_sincronizar_offline, name="sync_batch"),
    # Nuevas rutas para Usuarios, Cardex y Solicitudes
    path("api/v1/usuarios/", api_usuarios, name="api_usuarios"),
    path("api/v1/cardex/", api_cardex, name="api_cardex"),
    path("api/v1/solicitudes/", api_solicitudes, name="api_solicitudes"),
]