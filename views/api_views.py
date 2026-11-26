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
    crear_solicitud_sql,
    listar_inventario,
    listar_movimientos_cardex,
    listar_solicitudes_sql,
    orquestar_movimiento_bodega,
    procesar_avance_obra,
    sincronizar_lote_offline,
)


def health_check(request):
    """GET /api/v1/health/ -> verifica estado del backend y conexión a base de datos."""
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
    """POST /api/v1/obras/avance/ -> registra o actualiza obra y su reporte."""
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)

    codigo_obra = sanitize_text_input(str(data.get("codigo_obra", "")).strip())
    observacion = sanitize_text_input(str(data.get("observacion", "")).strip())
    tipo_obra = sanitize_text_input(str(data.get("tipo", "instalación")).strip())
    porcentaje_raw = data.get("porcentaje_avance", 0)
    id_cliente_raw = data.get("id_cliente")

    id_cliente = None
    if id_cliente_raw is not None:
        try:
            id_cliente = int(id_cliente_raw)
        except (TypeError, ValueError):
            return JsonResponse({"error": "id_cliente debe ser entero."}, status=400)

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

    kwargs_obra: dict[str, Any] = {}
    if "tipo" in data and data.get("tipo"):
        kwargs_obra["tipo_obra"] = tipo_obra
    if id_cliente is not None:
        kwargs_obra["id_cliente"] = id_cliente

    obra = procesar_avance_obra(codigo_obra, porcentaje, observacion, **kwargs_obra)

    raw_id = obra.get("id_obra") if isinstance(obra, dict) else getattr(obra, "id_obra", None)
    raw_codigo = obra.get("codigo") if isinstance(obra, dict) else getattr(obra, "codigo", None)
    raw_pct = (
        obra.get("porcentaje_avance")
        if isinstance(obra, dict)
        else getattr(obra, "porcentaje_avance", None)
    )
    raw_obs = (
        obra.get("observacion")
        if isinstance(obra, dict)
        else getattr(obra, "observacion", None)
    )
    raw_est = obra.get("estado") if isinstance(obra, dict) else getattr(obra, "estado", None)

    return JsonResponse(
        {
            "id_obra": (
                raw_id if isinstance(raw_id, int) and not isinstance(raw_id, bool) else None
            ),
            "codigo_obra": raw_codigo if isinstance(raw_codigo, str) else codigo_obra,
            "porcentaje_avance": (
                raw_pct
                if isinstance(raw_pct, int) and not isinstance(raw_pct, bool)
                else porcentaje
            ),
            "observacion": raw_obs if isinstance(raw_obs, str) else observacion,
            "estado": raw_est if isinstance(raw_est, str) else "EN_EJECUCION",
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
    """POST /api/v1/inventario/items/crear/ -> crea o actualiza item sanitizado."""
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)

    sku = sanitize_text_input(
        str(data.get("sku", data.get("codigo_de_barras", ""))).strip()
    )
    nombre = sanitize_text_input(str(data.get("nombre", "")).strip())
    ubicacion = sanitize_text_input(
        str(data.get("ubicacion", "Bodega Central")).strip()
    )
    unidad = sanitize_text_input(
        str(data.get("unidad_de_medida", data.get("unidad", "unidad"))).strip()
    )

    try:
        stock = int(data.get("stock", data.get("stock_actual", 0)))
        stock_critico = int(data.get("stock_critico", 5))
        precio = float(data.get("precio", 0.0))
    except (TypeError, ValueError):
        return JsonResponse(
            {"error": "stock, stock_critico y precio deben ser numéricos."}, status=400
        )

    if not sku or not nombre or stock < 0:
        return JsonResponse(
            {"error": "Datos de inventario inválidos."}, status=400
        )

    creado = crear_item_inventario(
        sku=sku,
        nombre=nombre,
        stock=stock,
        ubicacion=ubicacion,
        unidad=unidad,
        precio=precio,
        stock_critico=stock_critico,
    )
    return JsonResponse({"item": creado}, status=201)


@require_rbac("inventario_bodega", "R")
def api_buscar_inventario(request: Any) -> JsonResponse:
    """GET /api/v1/inventario/search/?q=...&ubicacion=...&stock_critico=true"""
    q = sanitize_text_input(str(request.GET.get("q", "")).strip())
    ubicacion = sanitize_text_input(str(request.GET.get("ubicacion", "")).strip())
    stock_critico = str(request.GET.get("stock_critico", "")).lower() == "true"

    resultados = buscar_inventario_filtrado(q, ubicacion, stock_critico)
    return JsonResponse({"resultados": resultados, "total": len(resultados)}, status=200)


@require_rbac("inventario_bodega", "R")
def api_categorias(request: Any) -> JsonResponse:
    """GET /api/v1/categorias/ -> lista categorías activas."""
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido."}, status=405)

    categorias: list[dict[str, Any]] = []
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id_categoria, nombre, activo
                FROM categoria
                WHERE activo = TRUE
                ORDER BY nombre ASC;
                """
            )
            for row in cursor.fetchall():
                categorias.append(
                    {
                        "id": row[0],
                        "id_categoria": row[0],
                        "nombre": row[1],
                        "activo": row[2],
                    }
                )
    except Exception:
        categorias = []

    return JsonResponse({"categorias": categorias, "total": len(categorias)}, status=200)


@require_rbac("inventario_bodega", "R")
def api_ubicaciones(request: Any) -> JsonResponse:
    """GET /api/v1/ubicaciones/ -> lista ubicaciones activas."""
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido."}, status=405)

    ubicaciones: list[dict[str, Any]] = []
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id_ubicacion, bodega, detalle, activo
                FROM ubicacion
                WHERE activo = TRUE
                ORDER BY bodega ASC, detalle ASC;
                """
            )
            for row in cursor.fetchall():
                ubicaciones.append(
                    {
                        "id": row[0],
                        "id_ubicacion": row[0],
                        "bodega": row[1],
                        "detalle": row[2],
                        "nombre": f"{row[1]} - {row[2]}" if row[2] else row[1],
                        "activo": row[3],
                    }
                )
    except Exception:
        ubicaciones = []

    return JsonResponse({"ubicaciones": ubicaciones, "total": len(ubicaciones)}, status=200)


@require_rbac("inventario_bodega", "R")
def api_mermas(request: Any) -> JsonResponse:
    """GET /api/v1/mermas/ -> lista registros de mermas en bodega."""
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido."}, status=405)

    mermas: list[dict[str, Any]] = []
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    m.id_merma,
                    m.fecha,
                    COALESCE(a.nombre, CONCAT('Artículo #', m.id_articulo::text)) AS articulo,
                    COALESCE(
                        NULLIF(TRIM(CONCAT(COALESCE(u.nombres, ''), ' ', COALESCE(u.apellidos, ''))), ''),
                        u.usuario,
                        'Sistema'
                    ) AS responsable,
                    m.cantidad,
                    m.motivo,
                    m.justificacion
                FROM merma m
                LEFT JOIN articulo a ON a.id_articulo = m.id_articulo
                LEFT JOIN usuario u ON u.id_usuario = m.id_usuario
                ORDER BY m.fecha DESC, m.id_merma DESC;
                """
            )
            for row in cursor.fetchall():
                fecha_str = (
                    row[1].isoformat() if hasattr(row[1], "isoformat") else str(row[1] or "")
                )
                mermas.append(
                    {
                        "id": row[0],
                        "id_merma": row[0],
                        "fecha": fecha_str,
                        "fecha_hora": fecha_str,
                        "articulo": row[2],
                        "responsable": row[3],
                        "cantidad": row[4],
                        "motivo": row[5],
                        "justificacion": row[6],
                    }
                )
    except Exception:
        mermas = []

    return JsonResponse({"mermas": mermas, "total": len(mermas)}, status=200)


@csrf_exempt
@require_rbac("inventario_bodega", "C")
def api_orquestar_movimiento(request: Any) -> JsonResponse:
    """POST /api/v1/movimientos/orquestar/ -> actualiza stock, cardex y telemetría."""
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
        return JsonResponse(
            {"error": "cantidad y precio_neto deben ser enteros."}, status=400
        )

    if (
        not sku
        or tipo not in ("INGRESO", "EGRESO", "SALIDA", "MERMA", "AJUSTE")
        or cantidad <= 0
        or precio_neto < 0
    ):
        return JsonResponse({"error": "Parámetros de movimiento inválidos."}, status=400)

    resultado = orquestar_movimiento_bodega(
        sku, tipo, cantidad, precio_neto, usuario, telemetria
    )
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
        return JsonResponse(
            {"error": "El campo 'operaciones' debe ser una lista."}, status=400
        )

    usuario = sanitize_text_input(str(data.get("usuario", "movil@fyag.cl")).strip())
    resumen = sincronizar_lote_offline(operaciones, usuario)
    return JsonResponse(
        {"mensaje": "Sincronización batch completada.", "resumen": resumen}, status=207
    )


@csrf_exempt
def api_usuarios(request: Any) -> JsonResponse:
    """GET/POST /api/v1/usuarios/ -> consulta o registra usuarios alineados a 'usuario'."""
    role = getattr(request, "jwt_role", None)
    if not role:
        return JsonResponse({"error": "No autenticado: falta rol JWT."}, status=401)

    if request.method == "GET":
        if "R" not in RBAC_MATRIX.get(role, {}).get("usuarios_roles", set()):
            return JsonResponse(
                {
                    "error": (
                        f"Acceso denegado para rol '{role}' en módulo 'usuarios_roles' (R)."
                    )
                },
                status=403,
            )

        usuarios_bd: list[dict[str, Any]] = []
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT u.id_usuario, u.nombres, u.apellidos, u.rut,
                           u.correo_electronico, u.telefono, u.usuario, u.activo, r.nombre
                    FROM usuario u
                    LEFT JOIN rol r ON r.id_rol = u.id_rol
                    WHERE u.activo = TRUE
                    ORDER BY u.id_usuario ASC;
                    """
                )
                for r in cursor.fetchall():
                    usuarios_bd.append(
                        {
                            "id": r[0],
                            "id_usuario": r[0],
                            "nombres": r[1],
                            "apellidos": r[2],
                            "rut": r[3],
                            "email": r[4],
                            "correo_electronico": r[4],
                            "telefono": r[5],
                            "username": r[6],
                            "usuario": r[6],
                            "activo": r[7],
                            "rol": r[8] or role,
                        }
                    )
        except Exception:
            usuarios_bd = []

        if usuarios_bd:
            return JsonResponse(
                {"usuarios": usuarios_bd, "total": len(usuarios_bd)}, status=200
            )

        usuarios_fallback = [
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
        return JsonResponse(
            {"usuarios": usuarios_fallback, "total": len(usuarios_fallback)}, status=200
        )

    if request.method == "POST":
        if "C" not in RBAC_MATRIX.get(role, {}).get("usuarios_roles", set()):
            return JsonResponse(
                {
                    "error": (
                        f"Acceso denegado para rol '{role}' en módulo 'usuarios_roles' (C)."
                    )
                },
                status=403,
            )
        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        nombres = sanitize_text_input(
            str(data.get("nombres", data.get("nombre", ""))).strip()
        )
        apellidos = sanitize_text_input(str(data.get("apellidos", "")).strip())
        rut = sanitize_text_input(str(data.get("rut", "")).strip())
        telefono = sanitize_text_input(str(data.get("telefono", "")).strip())
        email = sanitize_text_input(
            str(
                data.get("email", data.get("correo_electronico", data.get("correo", "")))
            ).strip()
        )
        username = sanitize_text_input(
            str(data.get("username", data.get("usuario", ""))).strip()
        )
        rol_asignado = sanitize_text_input(
            str(data.get("rol", data.get("role", "TECNICO"))).strip()
        ).upper()
        password_hash = str(data.get("password_hash", "")).strip() or "pendiente_hash"

        if not email or not nombres:
            return JsonResponse(
                {"error": "Nombres y correo electrónico son obligatorios."}, status=400
            )

        id_usuario_bd = None
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id_rol FROM rol WHERE UPPER(nombre) = %s AND activo = TRUE LIMIT 1;",
                    [rol_asignado],
                )
                row_rol = cursor.fetchone()
                id_rol = int(row_rol[0]) if row_rol and row_rol[0] is not None else 1

                cursor.execute(
                    """
                    INSERT INTO usuario (
                        id_rol, nombres, apellidos, rut, correo_electronico,
                        telefono, usuario, password_hash, activo
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                    RETURNING id_usuario;
                    """,
                    [
                        id_rol,
                        nombres[:100],
                        apellidos[:100],
                        rut[:12],
                        email[:100],
                        telefono[:9],
                        (username or email)[:100],
                        password_hash[:255],
                    ],
                )
                id_usuario_bd = int(cursor.fetchone()[0])
        except Exception:
            id_usuario_bd = None

        nuevo_usuario = {
            "id": id_usuario_bd or f"usr_{username or 'nuevo'}",
            "id_usuario": id_usuario_bd,
            "nombres": nombres,
            "apellidos": apellidos,
            "rut": rut,
            "telefono": telefono,
            "email": email,
            "correo_electronico": email,
            "username": username or email,
            "usuario": username or email,
            "rol": rol_asignado,
            "activo": True,
        }
        return JsonResponse(
            {"usuario": nuevo_usuario, "mensaje": "Usuario registrado correctamente."},
            status=201,
        )

    return JsonResponse({"error": "Método no permitido."}, status=405)


@require_rbac("inventario_bodega", "R")
def api_cardex(request: Any) -> JsonResponse:
    """GET /api/v1/cardex/ -> consulta movimientos registrados en 'cardex'."""
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido."}, status=405)

    movimientos = listar_movimientos_cardex()
    return JsonResponse({"movimientos": movimientos, "total": len(movimientos)}, status=200)


@csrf_exempt
@require_rbac("obras_mantencion", "R")
def api_solicitudes(request: Any) -> JsonResponse:
    """GET/POST /api/v1/solicitudes/ -> lista o registra solicitudes en 'solicitud_articulo'."""
    if request.method == "GET":
        solicitudes = listar_solicitudes_sql()
        return JsonResponse(
            {"solicitudes": solicitudes, "total": len(solicitudes)}, status=200
        )

    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        sku = sanitize_text_input(
            str(data.get("sku", data.get("id_articulo", ""))).strip()
        )
        observacion = sanitize_text_input(
            str(data.get("observacion", data.get("comentarios", ""))).strip()
        )
        id_obra_raw = data.get("id_obra")
        id_obra = None
        if id_obra_raw is not None:
            try:
                id_obra = int(id_obra_raw)
            except (TypeError, ValueError):
                return JsonResponse({"error": "id_obra debe ser entero."}, status=400)

        try:
            cantidad = int(data.get("cantidad", 1))
        except (TypeError, ValueError):
            return JsonResponse({"error": "cantidad debe ser entero."}, status=400)

        if not sku or cantidad <= 0:
            return JsonResponse(
                {"error": "Datos de solicitud inválidos."}, status=400
            )

        resultado = crear_solicitud_sql(
            sku_o_id=sku,
            cantidad=cantidad,
            observacion=observacion,
            id_obra=id_obra,
        )
        status_code = resultado.pop("status", 201)
        return JsonResponse(resultado, status=status_code)

    return JsonResponse({"error": "Método no permitido."}, status=405)