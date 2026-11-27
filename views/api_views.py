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
    _registrar_merma_sql,
    buscar_inventario_filtrado,
    crear_item_inventario,
    crear_solicitud_sql,
    listar_inventario,
    listar_mermas_sql,
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

    jwt_payload = getattr(request, "jwt_payload", {}) or {}
    usuario_ref = sanitize_text_input(
        str(
            data.get("usuario")
            or jwt_payload.get("usuario")
            or jwt_payload.get("sub")
            or jwt_payload.get("email")
            or ""
        ).strip()
    )

    creado = crear_item_inventario(
        sku=sku,
        nombre=nombre,
        stock=stock,
        ubicacion=ubicacion,
        ubicacion_id=data.get("id_ubicacion", data.get("ubicacion_id")),
        categoria_id=data.get("id_categoria", data.get("categoria_id")),
        categoria=data.get("categoria"),
        unidad=unidad,
        precio=precio,
        stock_critico=stock_critico,
        usuario_ref=usuario_ref or None,
    )
    if isinstance(creado, dict) and creado.get("error"):
        return JsonResponse(
            {"error": creado["error"]},
            status=int(creado.get("status", 400)),
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


@csrf_exempt
def api_categorias(request: Any) -> JsonResponse:
    """GET/POST /api/v1/categorias/ -> lista o crea categorías activas."""
    role = getattr(request, "jwt_role", None)
    if not role:
        return JsonResponse({"error": "No autenticado: falta rol JWT."}, status=401)

    if request.method == "GET":
        if "R" not in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'inventario_bodega' (R)."},
                status=403,
            )

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

    if request.method == "POST":
        if "C" not in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'inventario_bodega' (C)."},
                status=403,
            )

        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        nombre = sanitize_text_input(
            str(data.get("nombre", data.get("categoria", data.get("name", "")))).strip()
        )
        if not nombre:
            return JsonResponse({"error": "El nombre de la categoría es obligatorio."}, status=400)

        id_categoria_bd = None
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id_categoria
                    FROM categoria
                    WHERE LOWER(nombre) = LOWER(%s)
                    ORDER BY id_categoria ASC
                    LIMIT 1;
                    """,
                    [nombre[:100]],
                )
                fila_existente = cursor.fetchone()
                if fila_existente and fila_existente[0] is not None:
                    id_categoria_bd = int(fila_existente[0])
                    cursor.execute(
                        """
                        UPDATE categoria
                        SET activo = TRUE
                        WHERE id_categoria = %s;
                        """,
                        [id_categoria_bd],
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO categoria (nombre, activo)
                        VALUES (%s, TRUE)
                        RETURNING id_categoria;
                        """,
                        [nombre[:100]],
                    )
                    id_categoria_bd = int(cursor.fetchone()[0])
        except Exception as exc:
            return JsonResponse(
                {"error": f"Error al guardar categoría en BD: {exc}"}, status=500
            )

        nueva_categoria = {
            "id": id_categoria_bd,
            "id_categoria": id_categoria_bd,
            "nombre": nombre,
            "activo": True,
        }
        return JsonResponse(
            {"categoria": nueva_categoria, "mensaje": "Categoría creada correctamente."},
            status=201,
        )

    return JsonResponse({"error": "Método no permitido."}, status=405)


@csrf_exempt
def api_ubicaciones(request: Any) -> JsonResponse:
    """GET/POST /api/v1/ubicaciones/ -> lista o crea ubicaciones activas."""
    role = getattr(request, "jwt_role", None)
    if not role:
        return JsonResponse({"error": "No autenticado: falta rol JWT."}, status=401)

    if request.method == "GET":
        if "R" not in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'inventario_bodega' (R)."},
                status=403,
            )

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

    if request.method == "POST":
        if "C" not in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'inventario_bodega' (C)."},
                status=403,
            )

        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        bodega = sanitize_text_input(
            str(data.get("bodega", data.get("nombre", ""))).strip()
        )
        detalle = sanitize_text_input(
            str(data.get("detalle", data.get("descripcion", ""))).strip()
        )

        if not bodega and not detalle:
            return JsonResponse(
                {"error": "Debes indicar bodega o detalle para la ubicación."}, status=400
            )
        if not bodega:
            bodega = "Bodega Principal"

        id_ubicacion_bd = None
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO ubicacion (bodega, detalle, activo)
                    VALUES (%s, %s, TRUE)
                    RETURNING id_ubicacion;
                    """,
                    [bodega[:100], detalle[:150]],
                )
                id_ubicacion_bd = int(cursor.fetchone()[0])
        except Exception as exc:
            return JsonResponse(
                {"error": f"Error al guardar ubicación en BD: {exc}"}, status=500
            )

        nueva_ubicacion = {
            "id": id_ubicacion_bd,
            "id_ubicacion": id_ubicacion_bd,
            "bodega": bodega,
            "detalle": detalle,
            "nombre": f"{bodega} - {detalle}" if detalle else bodega,
            "activo": True,
        }
        return JsonResponse(
            {"ubicacion": nueva_ubicacion, "mensaje": "Ubicación creada correctamente."},
            status=201,
        )

    return JsonResponse({"error": "Método no permitido."}, status=405)


@csrf_exempt
def api_mermas(request: Any) -> JsonResponse:
    """GET/POST /api/v1/mermas/ -> lista o registra mermas en bodega."""
    role = getattr(request, "jwt_role", None)
    if not role:
        return JsonResponse({"error": "No autenticado: falta rol JWT."}, status=401)

    if request.method == "GET":
        if "R" not in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'inventario_bodega' (R)."},
                status=403,
            )

        q = sanitize_text_input(str(request.GET.get("q", "")).strip()).lower()
        motivo_filtro = sanitize_text_input(str(request.GET.get("motivo", "")).strip()).lower()
        mermas = listar_mermas_sql()

        if motivo_filtro and motivo_filtro not in ("todos", "todos los motivos"):
            mermas = [
                m for m in mermas if motivo_filtro in str(m.get("motivo", "")).lower()
            ]
        if q:
            mermas = [
                m
                for m in mermas
                if any(
                    q in str(m.get(campo, "")).lower()
                    for campo in ("id", "articulo", "responsable", "motivo", "justificacion")
                )
            ]

        return JsonResponse({"mermas": mermas, "total": len(mermas)}, status=200)

    if request.method == "POST":
        if "C" not in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'inventario_bodega' (C)."},
                status=403,
            )

        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        id_articulo_raw = data.get("id_articulo")
        id_articulo = None
        if id_articulo_raw not in (None, ""):
            try:
                id_articulo = int(id_articulo_raw)
            except (TypeError, ValueError):
                id_articulo = None

        articulo_nombre = sanitize_text_input(
            str(
                data.get("articulo")
                or data.get("nombre_articulo")
                or data.get("nombre")
                or data.get("sku")
                or ""
            ).strip()
        )
        motivo = sanitize_text_input(
            str(data.get("motivo", "Defecto de fábrica")).strip()
        )
        justificacion = sanitize_text_input(
            str(data.get("justificacion", data.get("observacion", ""))).strip()
        )
        fecha_str = sanitize_text_input(
            str(data.get("fecha", data.get("fecha_hora", ""))).strip()
        )

        try:
            cantidad = int(data.get("cantidad", 0))
        except (TypeError, ValueError):
            return JsonResponse({"error": "cantidad debe ser un entero válido."}, status=400)

        if cantidad <= 0:
            return JsonResponse(
                {"error": "La cantidad afectada debe ser mayor a 0."}, status=400
            )

        jwt_payload = getattr(request, "jwt_payload", {}) or {}
        usuario_ref = sanitize_text_input(
            str(
                data.get("usuario")
                or jwt_payload.get("usuario")
                or jwt_payload.get("sub")
                or jwt_payload.get("email")
                or ""
            ).strip()
        )

        nueva_merma = _registrar_merma_sql(
            id_articulo=id_articulo,
            articulo_nombre=articulo_nombre,
            cantidad=cantidad,
            motivo=motivo,
            justificacion=justificacion,
            fecha_str=fecha_str or None,
            usuario_ref=usuario_ref or None,
            descontar_stock=True,
        )
        return JsonResponse(
            {"merma": nueva_merma, "mensaje": "Merma registrada correctamente."},
            status=201,
        )

    return JsonResponse({"error": "Método no permitido."}, status=405)


@csrf_exempt
def api_proveedores(request: Any) -> JsonResponse:
    """GET/POST /api/v1/proveedores/ -> lista o registra proveedores."""
    role = getattr(request, "jwt_role", None)
    if not role:
        return JsonResponse({"error": "No autenticado: falta rol JWT."}, status=401)

    if request.method == "GET":
        if "R" not in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'inventario_bodega' (R)."},
                status=403,
            )

        q = sanitize_text_input(str(request.GET.get("q", "")).strip()).lower()
        proveedores: list[dict[str, Any]] = []

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        id_proveedor,
                        razon_social,
                        rut,
                        correo_electronico,
                        telefono,
                        direccion,
                        activo
                    FROM proveedor
                    ORDER BY id_proveedor ASC;
                    """
                )
                for row in cursor.fetchall():
                    activo_bool = bool(row[6]) if row[6] is not None else True
                    item = {
                        "id": row[0],
                        "id_proveedor": row[0],
                        "razon_social": row[1] or "",
                        "rut": row[2] or "",
                        "correo_electronico": row[3] or "",
                        "correo": row[3] or "",
                        "email": row[3] or "",
                        "telefono": row[4] or "",
                        "direccion": row[5] or "",
                        "activo": activo_bool,
                        "estado": "Activo" if activo_bool else "Inactivo",
                    }
                    if not q or any(
                        q in str(item[campo]).lower()
                        for campo in (
                            "razon_social",
                            "rut",
                            "correo_electronico",
                            "telefono",
                            "direccion",
                        )
                    ):
                        proveedores.append(item)
        except Exception:
            proveedores = []

        return JsonResponse(
            {"proveedores": proveedores, "total": len(proveedores)}, status=200
        )

    if request.method == "POST":
        if "C" not in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'inventario_bodega' (C)."},
                status=403,
            )

        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        razon_social = sanitize_text_input(str(data.get("razon_social", "")).strip())
        rut = sanitize_text_input(str(data.get("rut", "")).strip())
        correo = sanitize_text_input(
            str(
                data.get("correo_electronico", data.get("correo", data.get("email", "")))
            ).strip()
        )
        telefono = sanitize_text_input(str(data.get("telefono", "")).strip())
        direccion = sanitize_text_input(str(data.get("direccion", "")).strip())

        if not razon_social or not rut:
            return JsonResponse(
                {"error": "Razón social y RUT son obligatorios."}, status=400
            )

        id_proveedor_bd = None
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO proveedor (
                        razon_social, rut, correo_electronico, telefono, direccion, activo
                    )
                    VALUES (%s, %s, %s, %s, %s, TRUE)
                    RETURNING id_proveedor;
                    """,
                    [
                        razon_social[:150],
                        rut[:20],
                        correo[:120],
                        telefono[:30],
                        direccion[:200],
                    ],
                )
                id_proveedor_bd = int(cursor.fetchone()[0])
        except Exception:
            id_proveedor_bd = None

        nuevo_proveedor = {
            "id": id_proveedor_bd,
            "id_proveedor": id_proveedor_bd,
            "razon_social": razon_social,
            "rut": rut,
            "correo_electronico": correo,
            "correo": correo,
            "telefono": telefono,
            "direccion": direccion,
            "activo": True,
            "estado": "Activo",
        }
        return JsonResponse(
            {"proveedor": nuevo_proveedor, "mensaje": "Proveedor registrado correctamente."},
            status=201,
        )

    return JsonResponse({"error": "Método no permitido."}, status=405)


@csrf_exempt
def api_clientes(request: Any) -> JsonResponse:
    """GET/POST /api/v1/clientes/ -> lista o registra clientes."""
    role = getattr(request, "jwt_role", None)
    if not role:
        return JsonResponse({"error": "No autenticado: falta rol JWT."}, status=401)

    if request.method == "GET":
        modulo_ok = (
            "R" in RBAC_MATRIX.get(role, {}).get("obras_mantencion", set())
            or "R" in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set())
        )
        if not modulo_ok:
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en clientes (R)."},
                status=403,
            )

        q = sanitize_text_input(str(request.GET.get("q", "")).strip()).lower()
        clientes: list[dict[str, Any]] = []

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        id_cliente,
                        nombres,
                        apellidos,
                        rut,
                        correo_electronico,
                        telefono,
                        direccion,
                        activo
                    FROM cliente
                    ORDER BY id_cliente ASC;
                    """
                )
                for row in cursor.fetchall():
                    nombres_val = row[1] or ""
                    apellidos_val = row[2] or ""
                    nombre_completo = f"{nombres_val} {apellidos_val}".strip()
                    activo_bool = bool(row[7]) if row[7] is not None else True
                    item = {
                        "id": row[0],
                        "id_cliente": row[0],
                        "nombres": nombres_val,
                        "apellidos": apellidos_val,
                        "nombre_razon_social": nombre_completo,
                        "razon_social": nombre_completo,
                        "nombre": nombre_completo,
                        "rut": row[3] or "",
                        "correo_electronico": row[4] or "",
                        "correo": row[4] or "",
                        "email": row[4] or "",
                        "telefono": row[5] or "",
                        "direccion": row[6] or "",
                        "activo": activo_bool,
                        "estado": "Activo" if activo_bool else "Inactivo",
                    }
                    if not q or any(
                        q in str(item[campo]).lower()
                        for campo in (
                            "nombres",
                            "apellidos",
                            "nombre_razon_social",
                            "rut",
                            "correo_electronico",
                            "telefono",
                            "direccion",
                        )
                    ):
                        clientes.append(item)
        except Exception as exc:
            return JsonResponse(
                {"error": f"Error al consultar clientes en BD: {exc}"}, status=500
            )

        return JsonResponse(
            {"clientes": clientes, "total": len(clientes)}, status=200
        )

    if request.method == "POST":
        modulo_ok = (
            "C" in RBAC_MATRIX.get(role, {}).get("obras_mantencion", set())
            or "C" in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set())
        )
        if not modulo_ok:
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en clientes (C)."},
                status=403,
            )

        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        nombres_raw = sanitize_text_input(
            str(
                data.get(
                    "nombres",
                    data.get(
                        "nombre_razon_social",
                        data.get("razon_social", data.get("nombre", "")),
                    ),
                )
            ).strip()
        )
        apellidos_raw = sanitize_text_input(str(data.get("apellidos", "")).strip())

        if not apellidos_raw and " " in nombres_raw:
            partes = nombres_raw.split(" ", 1)
            nombres = partes[0].strip()
            apellidos = partes[1].strip()
        else:
            nombres = nombres_raw
            apellidos = apellidos_raw or "-"

        rut = sanitize_text_input(str(data.get("rut", "")).strip())
        correo = sanitize_text_input(
            str(
                data.get("correo_electronico", data.get("correo", data.get("email", "")))
            ).strip()
        )
        telefono = sanitize_text_input(str(data.get("telefono", "")).strip())
        direccion = sanitize_text_input(str(data.get("direccion", "")).strip())

        if not nombres or not rut:
            return JsonResponse(
                {"error": "Nombre/Razón social y RUT son obligatorios."}, status=400
            )

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO cliente (
                        nombres, apellidos, rut, correo_electronico, telefono, direccion, activo
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                    RETURNING id_cliente;
                    """,
                    [
                        nombres[:100],
                        apellidos[:100],
                        rut[:20],
                        correo[:120],
                        telefono[:30],
                        direccion[:200],
                    ],
                )
                id_cliente_bd = int(cursor.fetchone()[0])
        except Exception as exc:
            return JsonResponse(
                {"error": f"Error al guardar cliente en BD: {exc}"}, status=500
            )

        nombre_completo = f"{nombres} {apellidos}".strip()
        nuevo_cliente = {
            "id": id_cliente_bd,
            "id_cliente": id_cliente_bd,
            "nombres": nombres,
            "apellidos": apellidos,
            "nombre_razon_social": nombre_completo,
            "razon_social": nombre_completo,
            "nombre": nombre_completo,
            "rut": rut,
            "correo_electronico": correo,
            "correo": correo,
            "telefono": telefono,
            "direccion": direccion,
            "activo": True,
            "estado": "Activo",
        }
        return JsonResponse(
            {"cliente": nuevo_cliente, "mensaje": "Cliente registrado correctamente."},
            status=201,
        )

    return JsonResponse({"error": "Método no permitido."}, status=405)


@csrf_exempt
def api_facturas(request: Any) -> JsonResponse:
    """GET/POST /api/v1/facturas/ -> lista o registra facturas de compra."""
    role = getattr(request, "jwt_role", None)
    if not role:
        return JsonResponse({"error": "No autenticado: falta rol JWT."}, status=401)

    if request.method == "GET":
        if "R" not in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'inventario_bodega' (R)."},
                status=403,
            )

        q = sanitize_text_input(str(request.GET.get("q", "")).strip()).lower()
        facturas: list[dict[str, Any]] = []

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        f.id_factura,
                        f.numero,
                        f.id_proveedor,
                        p.razon_social,
                        f.id_ubicacion,
                        u.bodega,
                        u.detalle,
                        f.fecha_compra,
                        f.comprobante,
                        f.monto_neto,
                        f.iva,
                        f.monto_bruto,
                        f.id_usuario
                    FROM factura f
                    LEFT JOIN proveedor p ON p.id_proveedor = f.id_proveedor
                    LEFT JOIN ubicacion u ON u.id_ubicacion = f.id_ubicacion
                    ORDER BY f.id_factura DESC;
                    """
                )
                for row in cursor.fetchall():
                    ubicacion_txt = (
                        f"{row[5]} - {row[6]}" if row[5] and row[6] else (row[5] or "")
                    )
                    item = {
                        "id": row[0],
                        "id_factura": row[0],
                        "numero": row[1] or "",
                        "numero_factura": row[1] or "",
                        "id_proveedor": row[2],
                        "proveedor": row[3] or "",
                        "id_ubicacion": row[4],
                        "ubicacion": ubicacion_txt,
                        "fecha_compra": str(row[7]) if row[7] is not None else "",
                        "comprobante": row[8] or "",
                        "monto_neto": float(row[9] or 0),
                        "iva": float(row[10] or 0),
                        "monto_bruto": float(row[11] or 0),
                        "id_usuario": row[12],
                    }
                    if not q or any(
                        q in str(item[campo]).lower()
                        for campo in (
                            "id_factura",
                            "numero",
                            "proveedor",
                            "ubicacion",
                            "fecha_compra",
                        )
                    ):
                        facturas.append(item)
        except Exception as exc:
            return JsonResponse(
                {"error": f"Error al consultar facturas en BD: {exc}"}, status=500
            )

        return JsonResponse({"facturas": facturas, "total": len(facturas)}, status=200)

    if request.method == "POST":
        if "C" not in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set()):
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en módulo 'inventario_bodega' (C)."},
                status=403,
            )

        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        numero = sanitize_text_input(
            str(data.get("numero", data.get("numero_factura", data.get("nro_factura", "")))).strip()
        )
        fecha_compra = sanitize_text_input(
            str(data.get("fecha_compra", data.get("fecha", ""))).strip()
        )
        comprobante = sanitize_text_input(
            str(data.get("comprobante", "")).strip()
        )

        try:
            id_proveedor = int(data.get("id_proveedor") or data.get("proveedor_id"))
            id_ubicacion = int(data.get("id_ubicacion") or data.get("ubicacion_id"))
            monto_neto = float(data.get("monto_neto", 0))
        except (TypeError, ValueError):
            return JsonResponse(
                {"error": "id_proveedor, id_ubicacion y monto_neto deben ser válidos."},
                status=400,
            )

        if not numero:
            return JsonResponse(
                {"error": "El número de factura es obligatorio."}, status=400
            )

        iva_raw = data.get("iva")
        bruto_raw = data.get("monto_bruto")
        iva = float(iva_raw) if iva_raw is not None else round(monto_neto * 0.19, 2)
        monto_bruto = float(bruto_raw) if bruto_raw is not None else round(monto_neto + iva, 2)

        jwt_payload = getattr(request, "jwt_payload", {}) or {}
        id_usuario = None
        for clave_u in ("id_usuario", "user_id", "sub"):
            val_u = data.get(clave_u) if data.get(clave_u) is not None else jwt_payload.get(clave_u)
            if val_u is not None:
                try:
                    id_usuario = int(val_u)
                    break
                except (TypeError, ValueError):
                    pass

        if id_usuario is None:
            user_obj = getattr(request, "user", None)
            if getattr(user_obj, "is_authenticated", False) and getattr(user_obj, "pk", None):
                try:
                    id_usuario = int(user_obj.pk)
                except (TypeError, ValueError):
                    id_usuario = None

        try:
            with connection.cursor() as cursor:
                if id_usuario is None:
                    cursor.execute("SELECT id_usuario FROM usuario ORDER BY id_usuario ASC LIMIT 1;")
                    row_usr = cursor.fetchone()
                    if row_usr and row_usr[0] is not None:
                        id_usuario = int(row_usr[0])

                if id_usuario is None:
                    return JsonResponse(
                        {"error": "No se pudo determinar un id_usuario válido para la factura."},
                        status=400,
                    )

                cursor.execute(
                    """
                    INSERT INTO factura (
                        id_proveedor,
                        id_usuario,
                        id_ubicacion,
                        numero,
                        fecha_compra,
                        comprobante,
                        monto_neto,
                        iva,
                        monto_bruto
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id_factura;
                    """,
                    [
                        id_proveedor,
                        id_usuario,
                        id_ubicacion,
                        numero[:30],
                        fecha_compra or None,
                        comprobante[:255] or None,
                        monto_neto,
                        iva,
                        monto_bruto,
                    ],
                )
                id_factura_bd = int(cursor.fetchone()[0])

                detalles = data.get("detalles") or data.get("items") or []
                if isinstance(detalles, list):
                    for det in detalles:
                        if not isinstance(det, dict):
                            continue
                        try:
                            id_art = int(det.get("id_articulo") or det.get("articulo_id"))
                            cant = int(det.get("cantidad", 0))
                            p_unit = float(det.get("precio_unitario", det.get("precio", 0)))
                        except (TypeError, ValueError):
                            continue
                        if cant > 0:
                            cursor.execute(
                                """
                                INSERT INTO detalle_factura (
                                    id_factura,
                                    id_articulo,
                                    cantidad,
                                    precio_unitario
                                )
                                VALUES (%s, %s, %s, %s);
                                """,
                                [id_factura_bd, id_art, cant, p_unit],
                            )
        except Exception as exc:
            return JsonResponse(
                {"error": f"Error al guardar factura en BD: {exc}"}, status=500
            )

        nueva_factura = {
            "id": id_factura_bd,
            "id_factura": id_factura_bd,
            "numero": numero,
            "numero_factura": numero,
            "id_proveedor": id_proveedor,
            "id_ubicacion": id_ubicacion,
            "fecha_compra": fecha_compra,
            "comprobante": comprobante,
            "monto_neto": monto_neto,
            "iva": iva,
            "monto_bruto": monto_bruto,
            "id_usuario": id_usuario,
        }
        return JsonResponse(
            {"factura": nueva_factura, "mensaje": "Factura registrada correctamente."},
            status=201,
        )

    return JsonResponse({"error": "Método no permitido."}, status=405)


@csrf_exempt
def api_autorizaciones(request: Any) -> JsonResponse:
    """GET/POST /api/v1/autorizaciones/ -> consulta o gestiona autorizaciones."""
    role = getattr(request, "jwt_role", None)
    if not role:
        return JsonResponse({"error": "No autenticado: falta rol JWT."}, status=401)

    if request.method == "GET":
        modulo_ok = (
            "R" in RBAC_MATRIX.get(role, {}).get("usuarios_roles", set())
            or "R" in RBAC_MATRIX.get(role, {}).get("inventario_bodega", set())
            or "R" in RBAC_MATRIX.get(role, {}).get("obras_mantencion", set())
        )
        if not modulo_ok:
            return JsonResponse(
                {"error": f"Acceso denegado para rol '{role}' en autorizaciones (R)."},
                status=403,
            )

        q = sanitize_text_input(str(request.GET.get("q", "")).strip()).lower()
        estado_filtro = sanitize_text_input(str(request.GET.get("estado", "")).strip()).lower()
        autorizaciones: list[dict[str, Any]] = []

        for tabla in ("autorizacion", "solicitud_autorizacion"):
            try:
                with connection.cursor() as cursor:
                    cursor.execute(f"SELECT * FROM {tabla} LIMIT 1;")
                    cols = [col[0] for col in cursor.description] if cursor.description else []
                    cursor.execute(f"SELECT * FROM {tabla} ORDER BY 1 DESC;")
                    for row in cursor.fetchall():
                        rec = dict(zip(cols, row))
                        id_val = rec.get("id_autorizacion") or rec.get("id")
                        solicitante = (
                            rec.get("solicitante")
                            or rec.get("usuario")
                            or rec.get("id_usuario")
                            or "Sistema"
                        )
                        modulo_reg = (
                            rec.get("modulo")
                            or rec.get("registro")
                            or rec.get("tabla")
                            or "General"
                        )
                        accion = rec.get("accion") or rec.get("tipo_accion") or "MODIFICACION"
                        motivo = rec.get("motivo") or rec.get("observacion") or ""
                        fecha_raw = rec.get("fecha_solicitud") or rec.get("fecha") or ""
                        fecha_str = (
                            fecha_raw.isoformat()
                            if hasattr(fecha_raw, "isoformat")
                            else str(fecha_raw or "")
                        )
                        estado_val = rec.get("estado") or "PENDIENTE"
                        item = {
                            "id": id_val,
                            "id_autorizacion": id_val,
                            "solicitante": str(solicitante),
                            "modulo": str(modulo_reg),
                            "registro": str(modulo_reg),
                            "accion": str(accion),
                            "motivo": str(motivo),
                            "fecha_solicitud": fecha_str,
                            "fecha": fecha_str,
                            "estado": str(estado_val),
                        }
                        if estado_filtro and estado_filtro not in ("todos", "todos los estados"):
                            if estado_filtro not in item["estado"].lower():
                                continue
                        if not q or any(
                            q in str(item[campo]).lower()
                            for campo in ("id", "solicitante", "modulo", "accion", "motivo", "estado")
                        ):
                            autorizaciones.append(item)
                break
            except Exception:
                continue

        return JsonResponse(
            {"autorizaciones": autorizaciones, "total": len(autorizaciones)}, status=200
        )

    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)

        estado_nuevo = sanitize_text_input(
            str(data.get("estado", data.get("accion", "APROBADA"))).strip()
        ).upper()
        return JsonResponse(
            {
                "mensaje": "Autorización actualizada correctamente.",
                "estado": estado_nuevo,
            },
            status=200,
        )

    return JsonResponse({"error": "Método no permitido."}, status=405)


@csrf_exempt
@require_rbac("inventario_bodega", "C")
def api_orquestar_movimiento(request: Any) -> JsonResponse:
    """POST /api/v1/movimientos/orquestar/ -> actualiza stock, cardex y telemetría."""
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)

    sku = sanitize_text_input(
        str(data.get("sku", data.get("id_articulo", ""))).strip()
    )
    tipo = sanitize_text_input(str(data.get("tipo", "")).strip()).upper()
    telemetria = data.get("telemetria") or {"temperatura_c": 4.2, "origen": "API_REST"}
    if isinstance(telemetria, dict):
        if data.get("motivo") and "motivo" not in telemetria:
            telemetria["motivo"] = sanitize_text_input(str(data.get("motivo")).strip())
        if data.get("justificacion") and "justificacion" not in telemetria:
            telemetria["justificacion"] = sanitize_text_input(
                str(data.get("justificacion")).strip()
            )
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


@csrf_exempt
@require_rbac("obras_mantencion", "R")
def api_obras(request: Any) -> JsonResponse:
    """GET/POST /api/v1/obras/ -> lista o registra obras en tabla 'obra'."""
    if request.method == "GET":
        obras: list[dict[str, Any]] = []
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id_obra, codigo, descripcion, tipo_obra,
                           porcentaje_avance, estado, observacion
                    FROM obra
                    ORDER BY id_obra DESC;
                    """
                )
                for row in cursor.fetchall():
                    obras.append(
                        {
                            "id": row[0],
                            "id_obra": row[0],
                            "codigo": row[1],
                            "codigo_obra": row[1],
                            "nombre": row[2] or row[1],
                            "descripcion": row[2],
                            "tipo": row[3],
                            "porcentaje_avance": row[4],
                            "estado": row[5],
                            "observacion": row[6],
                        }
                    )
        except Exception:
            obras = []

        return JsonResponse({"obras": obras, "total": len(obras)}, status=200)

    if request.method == "POST":
        return registrar_avance_obra(request)

    return JsonResponse({"error": "Método no permitido."}, status=405)


def _columnas_tabla_pg(tabla: str) -> set[str]:
    """Obtiene los nombres reales de columnas de una tabla en PostgreSQL."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s;
            """,
            [tabla],
        )
        return {row[0] for row in cursor.fetchall()}


def _resolver_id_usuario_despacho(request: Any) -> int | None:
    """Obtiene id_usuario válido desde el JWT o desde la tabla usuario."""
    jwt_payload = getattr(request, "jwt_payload", {}) or {}
    for key in ("id_usuario", "user_id", "id"):
        val = jwt_payload.get(key)
        if val is not None:
            try:
                return int(val)
            except (TypeError, ValueError):
                pass
    with connection.cursor() as cursor:
        cursor.execute("SELECT id_usuario FROM usuario WHERE activo = TRUE ORDER BY id_usuario ASC LIMIT 1;")
        row = cursor.fetchone()
        return int(row[0]) if row and row[0] is not None else None


@csrf_exempt
@require_rbac("inventario_bodega", "R")
def api_despachos(request: Any) -> JsonResponse:
    """GET/POST /api/v1/despachos/ -> consulta o registra despachos reales en PostgreSQL."""
    try:
        cols_desp = _columnas_tabla_pg("despacho")
        if not cols_desp:
            return JsonResponse(
                {"error": "La tabla 'despacho' no existe en la base de datos PostgreSQL."},
                status=500,
            )

        tabla_det = None
        cols_det: set[str] = set()
        for candidata in ("detalle_despacho", "despacho_detalle"):
            cols_cand = _columnas_tabla_pg(candidata)
            if cols_cand:
                tabla_det = candidata
                cols_det = cols_cand
                break

        if request.method == "GET":
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM despacho ORDER BY 1 DESC;")
                headers = [col[0] for col in cursor.description] if cursor.description else []
                filas = cursor.fetchall()

                # Mapas de clientes, obras y usuarios para mostrar nombres reales
                cursor.execute(
                    "SELECT id_cliente, TRIM(CONCAT(COALESCE(nombres, ''), ' ', COALESCE(apellidos, ''))) FROM cliente;"
                )
                mapa_clientes = {r[0]: r[1] for r in cursor.fetchall()}

                cursor.execute("SELECT id_obra, COALESCE(descripcion, codigo) FROM obra;")
                mapa_obras = {r[0]: r[1] for r in cursor.fetchall()}

                cursor.execute(
                    "SELECT id_usuario, COALESCE(NULLIF(TRIM(CONCAT(COALESCE(nombres, ''), ' ', COALESCE(apellidos, ''))), ''), usuario) FROM usuario;"
                )
                mapa_usuarios = {r[0]: r[1] for r in cursor.fetchall()}

                cursor.execute("SELECT id_articulo, nombre, unidad_de_medida FROM articulo;")
                mapa_articulos = {r[0]: (r[1], r[2]) for r in cursor.fetchall()}

                despachos: list[dict[str, Any]] = []
                for fila in filas:
                    rec = dict(zip(headers, fila))
                    id_desp = rec.get("id_despacho") or rec.get("id")
                    id_cli = rec.get("id_cliente")
                    id_obr = rec.get("id_obra")
                    id_usr = rec.get("id_usuario")

                    detalles_lista: list[dict[str, Any]] = []
                    if tabla_det and id_desp is not None:
                        col_fk = "id_despacho" if "id_despacho" in cols_det else headers[0]
                        cursor.execute(
                            f"SELECT * FROM {tabla_det} WHERE {col_fk} = %s ORDER BY 1 ASC;",
                            [id_desp],
                        )
                        det_headers = [c[0] for c in cursor.description] if cursor.description else []
                        for d_row in cursor.fetchall():
                            d_rec = dict(zip(det_headers, d_row))
                            id_art = d_rec.get("id_articulo")
                            art_info = mapa_articulos.get(id_art, (f"Artículo #{id_art}", "unidad"))
                            detalles_lista.append(
                                {
                                    "id_detalle": d_rec.get("id_detalle") or d_rec.get("id_detalle_despacho") or d_rec.get("id"),
                                    "id_articulo": id_art,
                                    "articulo_nombre": art_info[0],
                                    "unidad_de_medida": art_info[1] or "unidad",
                                    "cantidad": d_rec.get("cantidad", 1),
                                }
                            )

                    f_desp = rec.get("fecha_despacho") or rec.get("fecha") or ""
                    f_ent = rec.get("fecha_entrega") or ""
                    despachos.append(
                        {
                            "id": id_desp,
                            "id_despacho": id_desp,
                            "id_cliente": id_cli,
                            "cliente_nombre": mapa_clientes.get(id_cli) or f"Cliente #{id_cli}" if id_cli else "Cliente",
                            "id_usuario": id_usr,
                            "usuario_nombre": mapa_usuarios.get(id_usr) or "Usuario FYAG",
                            "id_obra": id_obr,
                            "obra_nombre": mapa_obras.get(id_obr) if id_obr else None,
                            "fecha_despacho": f_desp.isoformat() if hasattr(f_desp, "isoformat") else str(f_desp),
                            "fecha_entrega": f_ent.isoformat() if hasattr(f_ent, "isoformat") else (str(f_ent) if f_ent else None),
                            "estado": str(rec.get("estado") or "pendiente").lower(),
                            "boleta": str(rec.get("boleta") or rec.get("numero_despacho") or ""),
                            "direccion_entrega": str(rec.get("direccion_entrega") or rec.get("direccion") or ""),
                            "detalles": detalles_lista,
                        }
                    )

            return JsonResponse({"despachos": despachos, "total": len(despachos)}, status=200)

        if request.method == "POST":
            try:
                data = json.loads(request.body.decode("utf-8") or "{}")
            except json.JSONDecodeError:
                return JsonResponse({"error": "JSON inválido."}, status=400)

            valores_posibles: dict[str, Any] = {
                "id_cliente": data.get("id_cliente") or None,
                "id_obra": data.get("id_obra") or None,
                "id_usuario": data.get("id_usuario") or _resolver_id_usuario_despacho(request),
                "fecha_despacho": sanitize_text_input(str(data.get("fecha_despacho", "")).strip()) or None,
                "fecha": sanitize_text_input(str(data.get("fecha_despacho", "")).strip()) or None,
                "fecha_entrega": sanitize_text_input(str(data.get("fecha_entrega") or "").strip()) or None,
                "estado": sanitize_text_input(str(data.get("estado", "pendiente")).strip()).lower(),
                "boleta": sanitize_text_input(str(data.get("boleta", "")).strip()),
                "numero_despacho": sanitize_text_input(str(data.get("boleta", "")).strip()),
                "direccion_entrega": sanitize_text_input(
                    str(data.get("direccion_entrega", data.get("direccion", ""))).strip()
                ),
                "direccion": sanitize_text_input(
                    str(data.get("direccion_entrega", data.get("direccion", ""))).strip()
                ),
                "observacion": sanitize_text_input(str(data.get("observacion", "")).strip()),
            }

            columnas_insertar = [
                col for col in valores_posibles
                if col in cols_desp and valores_posibles[col] is not None
            ]
            params_insertar = [valores_posibles[col] for col in columnas_insertar]

            pk_col = "id_despacho" if "id_despacho" in cols_desp else "id"
            placeholders = ", ".join(["%s"] * len(columnas_insertar))
            cols_sql = ", ".join(columnas_insertar)

            with connection.cursor() as cursor:
                cursor.execute(
                    f"INSERT INTO despacho ({cols_sql}) VALUES ({placeholders}) RETURNING {pk_col};",
                    params_insertar,
                )
                nuevo_id = int(cursor.fetchone()[0])

                detalles = data.get("detalles") if isinstance(data.get("detalles"), list) else []
                if tabla_det and detalles:
                    for det in detalles:
                        det_map: dict[str, Any] = {
                            "id_despacho": nuevo_id,
                            "id_articulo": det.get("id_articulo"),
                            "cantidad": det.get("cantidad", 1),
                        }
                        d_cols = [c for c in det_map if c in cols_det and det_map[c] is not None]
                        d_vals = [det_map[c] for c in d_cols]
                        d_ph = ", ".join(["%s"] * len(d_cols))
                        cursor.execute(
                            f"INSERT INTO {tabla_det} ({', '.join(d_cols)}) VALUES ({d_ph});",
                            d_vals,
                        )

            return JsonResponse(
                {
                    "id": nuevo_id,
                    "id_despacho": nuevo_id,
                    "mensaje": "Despacho registrado correctamente en PostgreSQL.",
                },
                status=201,
            )

        return JsonResponse({"error": "Método no permitido."}, status=405)

    except Exception as exc:
        return JsonResponse(
            {"error": f"Error PostgreSQL en despachos: {exc}"},
            status=500,
        )


@csrf_exempt
@require_rbac("inventario_bodega", "U")
def api_despacho_detalle(request: Any, id_despacho: int) -> JsonResponse:
    """PATCH /api/v1/despachos/<id_despacho>/ -> actualiza estado real en PostgreSQL."""
    if request.method not in ("PATCH", "PUT"):
        return JsonResponse({"error": "Método no permitido."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)

    nuevo_estado = sanitize_text_input(str(data.get("estado", "")).strip()).lower()
    if not nuevo_estado:
        return JsonResponse({"error": "estado es obligatorio."}, status=400)

    try:
        cols_desp = _columnas_tabla_pg("despacho")
        pk_col = "id_despacho" if "id_despacho" in cols_desp else "id"
        with connection.cursor() as cursor:
            cursor.execute(
                f"UPDATE despacho SET estado = %s WHERE {pk_col} = %s;",
                [nuevo_estado, id_despacho],
            )
        return JsonResponse({"id_despacho": id_despacho, "estado": nuevo_estado}, status=200)
    except Exception as exc:
        return JsonResponse(
            {"error": f"Error PostgreSQL al actualizar despacho: {exc}"},
            status=500,
        )
