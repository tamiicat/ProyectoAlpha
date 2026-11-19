"""Controladores REST / vistas con RBAC y sanitizacion, sanitización XSS - Proyecto Alpha."""

import json
import re
from functools import wraps
from typing import Any, Callable, Dict, Set

import bleach
from django.http import JsonResponse


import src.inventario.services as services

RBAC_MATRIX: Dict[str, Dict[str, Set[str]]] = {
    "FINANZAS": {
        "finanzas_costos": {"C", "R", "U", "D"},
        "inventario_bodega": {"R"},
        "obras_mantencion": {"R"},
        "usuarios_roles": set(),
    },
    "SUPERVISOR_OBRAS": {
        "obras_mantencion": {"C", "R", "U", "D"},
        "inventario_bodega": {"C", "R", "U"},
        "finanzas_costos": set(),
        "usuarios_roles": set(),
    },
    "BODEGUERO": {
        "inventario_bodega": {"C", "R", "U"},
        "obras_mantencion": {"R"},
        "finanzas_costos": set(),
        "usuarios_roles": set(),
    },
    "ADMIN_TI": {
        "finanzas_costos": {"C", "R", "U", "D"},
        "inventario_bodega": {"C", "R", "U", "D"},
        "obras_mantencion": {"C", "R", "U", "D"},
        "usuarios_roles": {"C", "R", "U", "D"},
    },
}


def sanitize_text_input(raw_text: str) -> str:
    """Limpia etiquetas o scripts peligrosos (prevencion XSS)."""
    if not raw_text:
        return ""
    without_scripts = re.sub(
        r"<script\b[^>]*>.*?</script>",
        "",
        raw_text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return bleach.clean(
        without_scripts,
        tags=["b", "i", "u", "p", "br"],
        attributes={},
        strip=True,
    )


def require_rbac(module: str, action: str) -> Callable:
    """Decorador que verifica rol y permiso CRUD segun RBAC_MATRIX."""

    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        def _wrapped(request: Any, *args: Any, **kwargs: Any) -> JsonResponse:
            role = getattr(request, "jwt_role", None)
            if not role:
                return JsonResponse(
                    {"error": "No autenticado: falta rol JWT."}, status=401
                )
            allowed = RBAC_MATRIX.get(role, {}).get(module, set())
            if action not in allowed:
                return JsonResponse(
                    {
                        "error": (
                            f"Acceso denegado para rol '{role}' en "
                            f"modulo '{module}' ({action})."
                        )
                    },
                    status=403,
                )
            return view_func(request, *args, **kwargs)

        return _wrapped

    return decorator


def api_health(request: Any) -> JsonResponse:
    """Endpoint de salud del API de Inventario y Obras."""
    return JsonResponse(
        {
            "service": "proyecto-alpha-api",
            "status": "ok",
            "version": "v1",
        },
        status=200,
    )


@require_rbac("obras_mantencion", "C")
def registrar_avance_obra(request: Any) -> JsonResponse:
    """POST /api/v1/obras/avance/ -> registra avance sanitizado."""
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalido."}, status=400)

    codigo_obra = sanitize_text_input(str(data.get("codigo_obra", "")).strip())
    observacion = sanitize_text_input(str(data.get("observacion", "")).strip())
    porcentaje_raw = data.get("porcentaje_avance", 0)

    try:
        porcentaje = int(porcentaje_raw)
    except (TypeError, ValueError):
        return JsonResponse(
            {"error": "porcentaje_avance debe ser entero."}, status=400
        )

    if not codigo_obra:
        return JsonResponse(
            {"error": "codigo_obra es obligatorio."}, status=400
        )
    if porcentaje < 0 or porcentaje > 100:
        return JsonResponse(
            {"error": "porcentaje_avance debe estar entre 0 y 100."},
            status=400,
        )

    obra = services.procesar_avance_obra(codigo_obra, porcentaje, observacion)
    codigo_resp = obra.codigo if isinstance(obra.codigo, str) else codigo_obra
    porcentaje_resp = (
        obra.porcentaje_avance
        if isinstance(obra.porcentaje_avance, int)
        and not isinstance(obra.porcentaje_avance, bool)
        else porcentaje
    )
    observacion_resp = (
        obra.observacion if isinstance(obra.observacion, str) else observacion
    )
    estado_resp = (
        obra.estado if isinstance(obra.estado, str) else "EN_EJECUCION"
    )

    return JsonResponse(
        {
            "codigo_obra": codigo_resp,
            "porcentaje_avance": porcentaje_resp,
            "observacion": observacion_resp,
            "estado": estado_resp,
        },
        status=201,
    )


@require_rbac("inventario_bodega", "R")
def api_listar_inventario(request: Any) -> JsonResponse:
    """GET /api/v1/inventario/items/ -> lista insumos en bodega."""
    items = services.listar_inventario()
    return JsonResponse({"items": items, "total": len(items)}, status=200)


@require_rbac("inventario_bodega", "C")
def api_crear_inventario(request: Any) -> JsonResponse:
    """POST /api/v1/inventario/items/ -> crea item sanitizado."""
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalido."}, status=400)

    sku = sanitize_text_input(str(data.get("sku", "")).strip())
    nombre = sanitize_text_input(str(data.get("nombre", "")).strip())
    ubicacion = sanitize_text_input(
        str(data.get("ubicacion", "Bodega Central")).strip()
    )
    try:
        stock = int(data.get("stock", 0))
    except (TypeError, ValueError):
        return JsonResponse({"error": "stock debe ser entero."}, status=400)

    if not sku or not nombre or stock < 0:
        return JsonResponse(
            {"error": "Datos de inventario invalidos."}, status=400
        )

    creado = services.crear_item_inventario(sku, nombre, stock, ubicacion)
    return JsonResponse({"item": creado}, status=201)
