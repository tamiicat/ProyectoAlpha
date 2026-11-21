"""Capa Vista (MVC): Endpoints REST de salud, obras e inventario."""

import json
from typing import Any

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from controllers.rbac_xss_controller import require_rbac, sanitize_text_input
from models.orden_obra_model import (
    crear_item_inventario,
    listar_inventario,
    procesar_avance_obra,
)


def health_check(request):
    """GET /api/v1/health/ -> verifica estado del backend y conexión a Supabase."""
    db_ok = False
    db_engine = connection.vendor
    db_error = None
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            row = cursor.fetchone()
            db_ok = row is not None and row[0] == 1
    except Exception as exc:
        db_error = str(exc)

    status_code = 200 if db_ok else 503
    payload = {
        "service": "proyecto-alpha-backend",
        "status": "ok" if db_ok else "degraded",
        "database": {
            "connected": db_ok,
            "engine": db_engine,
        },
    }
    if db_error:
        payload["database"]["error"] = db_error

    return JsonResponse(payload, status=status_code)


def api_health(request: Any) -> JsonResponse:
    """Endpoint de salud del API de Inventario y Obras."""
    return JsonResponse(
        {
            "service": "proyecto-alpha-inventario-api",
            "status": "ok",
            "version": "v1",
        },
        status=200,
    )


@csrf_exempt
@require_rbac("obras_mantencion", "C")
def registrar_avance_obra(request: Any) -> JsonResponse:
    """POST /api/v1/obras/avance/ -> registra avance sanitizado."""
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)

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

    obra = procesar_avance_obra(codigo_obra, porcentaje, observacion)
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
    items = listar_inventario()
    return JsonResponse({"items": items, "total": len(items)}, status=200)


@csrf_exempt
@require_rbac("inventario_bodega", "C")
def api_crear_inventario(request: Any) -> JsonResponse:
    """POST /api/v1/inventario/items/crear/ -> crea item sanitizado."""
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)

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
            {"error": "Datos de inventario inválidos."}, status=400
        )

    creado = crear_item_inventario(sku, nombre, stock, ubicacion)
    return JsonResponse({"item": creado}, status=201)
