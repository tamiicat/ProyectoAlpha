"""Capa Vista (MVC): Endpoints REST de salud, obras, inventario, orquestación dual y sync offline."""

import json
from typing import Any

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from controllers.rbac_xss_controller import (
    RBAC_MATRIX,
    require_rbac,
    sanitize_text_input,
)
from models.orden_obra_model import (
    buscar_inventario_filtrado,
    crear_item_inventario,
    listar_inventario,
    orquestar_movimiento_bodega,
    procesar_avance_obra,
    sincronizar_lote_offline,
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
    if isinstance(obra, dict):
        codigo_resp = (
            obra.get("codigo") if isinstance(obra.get("codigo"), str) else codigo_obra
        )
        porcentaje_resp = (
            obra.get("porcentaje_avance")
            if isinstance(obra.get("porcentaje_avance"), int)
            and not isinstance(obra.get("porcentaje_avance"), bool)
            else porcentaje
        )
        observacion_resp = (
            obra.get("observacion")
            if isinstance(obra.get("observacion"), str)
            else observacion
        )
        estado_resp = (
            obra.get("estado") if isinstance(obra.get("estado"), str) else "EN_EJECUCION"
        )
    else:
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


@require_rbac("inventario_bodega", "R")
def api_buscar_inventario(request: Any) -> JsonResponse:
    """GET /api/v1/inventario/search/?q=...&ubicacion=...&stock_critico=true"""
    q = sanitize_text_input(str(request.GET.get("q", "")).strip())
    ubicacion = sanitize_text_input(str(request.GET.get("ubicacion", "")).strip())
    stock_critico = str(request.GET.get("stock_critico", "")).lower() == "true"

    resultados = buscar_inventario_filtrado(q, ubicacion, stock_critico)
    return JsonResponse({"resultados": resultados, "total": len(resultados)}, status=200)


@csrf_exempt
@require_rbac("inventario_bodega", "C")
def api_orquestar_movimiento(request: Any) -> JsonResponse:
    """POST /api/v1/movimientos/orquestar/ -> distribuye SQL (Kardex/IVA) y MongoDB (Telemetría)."""
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)

    sku = sanitize_text_input(str(data.get("sku", "")).strip())
    tipo = sanitize_text_input(str(data.get("tipo", "")).strip()).upper()
    telemetria = data.get("telemetria") or {"temperatura_c": 4.2, "origen": "API_REST"}
    usuario = sanitize_text_input(str(data.get("usuario", "operador@fyag.cl")).strip())

    try:
        cantidad = int(data.get("cantidad", 0))
        precio_neto = int(data.get("precio_neto", 0))
    except (TypeError, ValueError):
        return JsonResponse({"error": "cantidad y precio_neto deben ser enteros."}, status=400)

    if not sku or tipo not in ("INGRESO", "EGRESO") or cantidad <= 0 or precio_neto < 0:
        return JsonResponse({"error": "Parámetros de movimiento inválidos."}, status=400)

    resultado = orquestar_movimiento_bodega(sku, tipo, cantidad, precio_neto, usuario, telemetria)
    status_code = resultado.pop("status", 200)
    return JsonResponse(resultado, status=status_code)


@csrf_exempt
@require_rbac("inventario_bodega", "C")
def api_sincronizar_offline(request: Any) -> JsonResponse:
    """POST /api/v1/sync/batch/ -> sincroniza caché local tras caída de red."""
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)

    operaciones = data.get("operaciones", [])
    if not isinstance(operaciones, list):
        return JsonResponse({"error": "El campo 'operaciones' debe ser una lista."}, status=400)

    usuario = sanitize_text_input(str(data.get("usuario", "movil@fyag.cl")).strip())
    resumen = sincronizar_lote_offline(operaciones, usuario)
    return JsonResponse({"mensaje": "Sincronización batch completada.", "resumen": resumen}, status=207)


@csrf_exempt
def api_usuarios(request: Any) -> JsonResponse:
    """GET/POST /api/v1/usuarios/ -> lista o registra usuarios y roles del sistema."""
    role = getattr(request, "jwt_role", None)
    if not role:
        return JsonResponse({"error": "No autenticado: falta rol JWT."}, status=401)

    if request.method == "GET":
        if "R" not in RBAC_MATRIX.get(role, {}).get("usuarios_roles", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'usuarios_roles' (R)."},
                status=403,
            )
        usuarios = [
            {
                "id": "usr_adm_01",
                "email": "admin@fyag.cl",
                "rol": "ADMIN_TI",
                "activo": True,
            },
            {
                "id": "usr_bod_01",
                "email": "bodeguero@fyag.cl",
                "rol": "BODEGUERO",
                "activo": True,
            },
            {
                "id": "usr_tec_01",
                "email": "tecnico@fyag.cl",
                "rol": "TECNICO",
                "activo": True,
            },
            {
                "id": "usr_fin_01",
                "email": "finanzas@fyag.cl",
                "rol": "FINANZAS",
                "activo": True,
            },
            {
                "id": "usr_sup_02",
                "email": "supervisor@fyag.cl",
                "rol": "SUPERVISOR_OBRAS",
                "activo": True,
            },
        ]
        return JsonResponse({"usuarios": usuarios, "total": len(usuarios)}, status=200)

    if request.method == "POST":
        if "C" not in RBAC_MATRIX.get(role, {}).get("usuarios_roles", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'usuarios_roles' (C)."},
                status=403,
            )
        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        nombres = sanitize_text_input(str(data.get("nombres", data.get("nombre", ""))).strip())
        apellidos = sanitize_text_input(str(data.get("apellidos", "")).strip())
        rut = sanitize_text_input(str(data.get("rut", "")).strip())
        telefono = sanitize_text_input(str(data.get("telefono", "")).strip())
        email = sanitize_text_input(str(data.get("email", data.get("correo", ""))).strip())
        username = sanitize_text_input(str(data.get("username", data.get("usuario", ""))).strip())
        rol_asignado = sanitize_text_input(str(data.get("rol", data.get("role", "TECNICO"))).strip()).upper()

        if not email or not nombres:
            return JsonResponse({"error": "Nombres y correo electrónico son obligatorios."}, status=400)

        nuevo_usuario = {
            "id": f"usr_{username or 'nuevo'}",
            "nombres": nombres,
            "apellidos": apellidos,
            "rut": rut,
            "telefono": telefono,
            "email": email,
            "username": username,
            "rol": rol_asignado,
            "activo": True,
        }
        return JsonResponse({"usuario": nuevo_usuario, "mensaje": "Usuario registrado correctamente."}, status=201)

    return JsonResponse({"error": "Método no permitido."}, status=405)


@require_rbac("inventario_bodega", "R")
def api_cardex(request: Any) -> JsonResponse:
    """GET /api/v1/cardex/ -> consulta movimientos/inventario registrados."""
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido."}, status=405)

    movimientos = listar_inventario()
    return JsonResponse({"movimientos": movimientos, "total": len(movimientos)}, status=200)


@csrf_exempt
@require_rbac("obras_mantencion", "R")
def api_solicitudes(request: Any) -> JsonResponse:
    """GET/POST /api/v1/solicitudes/ -> lista o registra solicitudes de artículos."""
    if request.method == "GET":
        solicitudes: list[dict[str, Any]] = []
        return JsonResponse(
            {"solicitudes": solicitudes, "total": len(solicitudes)}, status=200
        )

    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        sku = sanitize_text_input(str(data.get("sku", "")).strip())
        observacion = sanitize_text_input(str(data.get("observacion", "")).strip())
        try:
            cantidad = int(data.get("cantidad", 1))
        except (TypeError, ValueError):
            return JsonResponse({"error": "cantidad debe ser entero."}, status=400)

        if not sku or cantidad <= 0:
            return JsonResponse(
                {"error": "Datos de solicitud inválidos."}, status=400
            )

        solicitud = {
            "id": "sol_001",
            "sku": sku,
            "cantidad": cantidad,
            "observacion": observacion,
            "estado": "PENDIENTE",
        }
        return JsonResponse({"solicitud": solicitud}, status=201)

    return JsonResponse({"error": "Método no permitido."}, status=405)