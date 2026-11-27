"""Capa Modelo (MVC): Modelos ORM y servicios alineados al Modelo Relacional de Proyecto Alpha."""

import os
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional

from django.db import connection, models, transaction


class Obra(models.Model):
    """Mapea la tabla 'obra' según el Modelo Relacional."""

    id_obra = models.AutoField(primary_key=True)
    id_usuario = models.IntegerField()
    id_cliente = models.IntegerField()
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=20, default="instalación")
    estado = models.CharField(max_length=20, default="pendiente")
    fecha_inicio = models.DateField(blank=True, null=True)
    fecha_termino = models.DateField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    class Meta:
        app_label = "models"
        db_table = "obra"
        managed = False

    def __str__(self) -> str:
        return f"{self.nombre} ({self.estado})"


class Articulo(models.Model):
    """Mapea la tabla 'articulo' según el Modelo Relacional."""

    id_articulo = models.AutoField(primary_key=True)
    id_categoria = models.IntegerField()
    id_ubicacion = models.IntegerField()
    codigo_de_barras = models.CharField(max_length=20, blank=True, null=True)
    nombre = models.CharField(max_length=200)
    stock_actual = models.IntegerField(default=0)
    stock_critico = models.IntegerField(default=0)
    unidad_de_medida = models.CharField(max_length=25, default="unidad")
    precio = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_ingreso = models.DateTimeField(blank=True, null=True)
    estado = models.CharField(max_length=20, default="en bodega")
    activo = models.BooleanField(default=True)

    class Meta:
        app_label = "models"
        db_table = "articulo"
        managed = False

    def __str__(self) -> str:
        return f"{self.codigo_de_barras or self.id_articulo} - {self.nombre} ({self.stock_actual})"


_MEM_TELEMETRIA_MONGO: List[Dict[str, Any]] = []
_MEM_MERMAS_RESPALDO: List[Dict[str, Any]] = []
_SYNC_UUIDS_PROCESADOS: set = set()


def _normalizar_tipo_cardex(tipo: str) -> str:
    """Convierte alias de API/frontend a los valores ENUM de 'cardex' en el diagrama."""
    mapa = {
        "INGRESO": "ingreso",
        "EGRESO": "salida",
        "SALIDA": "salida",
        "MERMA": "merma",
        "AJUSTE": "ajuste",
        "MODIFICACION": "modificacion",
        "ELIMINACION": "eliminacion",
    }
    return mapa.get(tipo.strip().upper(), tipo.strip().lower())


def _resolver_ids_base(
    categoria_ref: Optional[Any] = None,
    ubicacion_ref: Optional[Any] = None,
) -> tuple[int, int]:
    """Resuelve id_categoria e id_ubicacion válidos desde la BD según ID, nombre o primer registro."""
    cat_id: Optional[int] = None
    ubi_id: Optional[int] = None

    try:
        with connection.cursor() as cursor:
            if categoria_ref is not None and str(categoria_ref).strip() != "":
                cat_str = str(categoria_ref).strip()
                if cat_str.isdigit():
                    cursor.execute(
                        "SELECT id_categoria FROM categoria WHERE id_categoria = %s LIMIT 1;",
                        [int(cat_str)],
                    )
                    r = cursor.fetchone()
                    if r and r[0] is not None:
                        cat_id = int(r[0])
                if cat_id is None:
                    cursor.execute(
                        "SELECT id_categoria FROM categoria WHERE LOWER(nombre) = LOWER(%s) LIMIT 1;",
                        [cat_str],
                    )
                    r = cursor.fetchone()
                    if r and r[0] is not None:
                        cat_id = int(r[0])

            if cat_id is None:
                cursor.execute(
                    "SELECT id_categoria FROM categoria ORDER BY activo DESC, id_categoria ASC LIMIT 1;"
                )
                r = cursor.fetchone()
                if r and r[0] is not None:
                    cat_id = int(r[0])

            if ubicacion_ref is not None and str(ubicacion_ref).strip() != "":
                ubi_str = str(ubicacion_ref).strip()
                if ubi_str.isdigit():
                    cursor.execute(
                        "SELECT id_ubicacion FROM ubicacion WHERE id_ubicacion = %s LIMIT 1;",
                        [int(ubi_str)],
                    )
                    r = cursor.fetchone()
                    if r and r[0] is not None:
                        ubi_id = int(r[0])
                if ubi_id is None:
                    cursor.execute(
                        """
                        SELECT id_ubicacion FROM ubicacion
                        WHERE LOWER(bodega) = LOWER(%s)
                           OR LOWER(detalle) = LOWER(%s)
                           OR LOWER(CONCAT(bodega, ' - ', COALESCE(detalle, ''))) = LOWER(%s)
                        LIMIT 1;
                        """,
                        [ubi_str, ubi_str, ubi_str],
                    )
                    r = cursor.fetchone()
                    if r and r[0] is not None:
                        ubi_id = int(r[0])

            if ubi_id is None:
                cursor.execute(
                    "SELECT id_ubicacion FROM ubicacion ORDER BY activo DESC, id_ubicacion ASC LIMIT 1;"
                )
                r = cursor.fetchone()
                if r and r[0] is not None:
                    ubi_id = int(r[0])
    except Exception:
        pass

    return cat_id or 1, ubi_id or 1


def _resolver_ids_obra() -> tuple[int, int]:
    """Obtiene un id_usuario y un id_cliente válidos desde la BD (o 1 por defecto)."""
    usr_id = 1
    cli_id = 1
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id_usuario FROM usuario ORDER BY activo DESC, id_usuario ASC LIMIT 1;"
            )
            row_usr = cursor.fetchone()
            if row_usr and row_usr[0] is not None:
                usr_id = int(row_usr[0])

            cursor.execute(
                "SELECT id_cliente FROM cliente ORDER BY activo DESC, id_cliente ASC LIMIT 1;"
            )
            row_cli = cursor.fetchone()
            if row_cli and row_cli[0] is not None:
                cli_id = int(row_cli[0])
    except Exception:
        pass
    return usr_id, cli_id


def _resolver_id_usuario(usuario_ref: Optional[str] = None) -> int:
    """Resuelve id_usuario desde correo/usuario/id o toma el primer usuario activo."""
    usr_id, _ = _resolver_ids_obra()
    if not usuario_ref:
        return usr_id
    ref_str = str(usuario_ref).strip()
    try:
        with connection.cursor() as cursor:
            if ref_str.isdigit():
                cursor.execute(
                    "SELECT id_usuario FROM usuario WHERE id_usuario = %s LIMIT 1;",
                    [int(ref_str)],
                )
                row = cursor.fetchone()
                if row and row[0] is not None:
                    return int(row[0])

            cursor.execute(
                """
                SELECT id_usuario FROM usuario
                WHERE LOWER(usuario) = LOWER(%s) OR LOWER(correo_electronico) = LOWER(%s)
                LIMIT 1;
                """,
                [ref_str, ref_str],
            )
            row = cursor.fetchone()
            if row and row[0] is not None:
                return int(row[0])
    except Exception:
        pass
    return usr_id


def _set_pg_usuario_sesion(cursor: Any, id_usuario: int) -> None:
    """Establece app.id_usuario en la sesión PostgreSQL para triggers como fn_articulo_alta_cardex()."""
    cursor.execute(
        "SELECT set_config('app.id_usuario', %s, true);",
        [str(int(id_usuario))],
    )


def _registrar_merma_sql(
    id_articulo: Optional[int],
    articulo_nombre: str,
    cantidad: int,
    motivo: str = "Defecto de fábrica",
    justificacion: str = "",
    fecha_str: Optional[str] = None,
    usuario_ref: Optional[str] = None,
    descontar_stock: bool = True,
) -> Dict[str, Any]:
    """Inserta merma en 'merma', descuenta stock si aplica y mantiene respaldo."""
    id_usuario = _resolver_id_usuario(usuario_ref)
    fecha_dt = datetime.now(timezone.utc)
    if fecha_str:
        try:
            fecha_dt = datetime.fromisoformat(str(fecha_str).replace("Z", "+00:00"))
        except Exception:
            pass

    articulo_obj = None
    if id_articulo is not None:
        articulo_obj = Articulo.objects.filter(id_articulo=int(id_articulo)).first()
    if not articulo_obj and articulo_nombre:
        articulo_obj = Articulo.objects.filter(
            nombre__iexact=articulo_nombre.strip()
        ).first()
    if not articulo_obj and articulo_nombre:
        articulo_obj = Articulo.objects.filter(
            codigo_de_barras=articulo_nombre.strip()
        ).first()

    id_art_bd = articulo_obj.id_articulo if articulo_obj else id_articulo
    nombre_art_final = (
        articulo_obj.nombre
        if articulo_obj
        else (articulo_nombre or f"Artículo #{id_articulo or 0}")
    )

    responsable_nombre = "Administrador"
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT COALESCE(
                    NULLIF(TRIM(CONCAT(COALESCE(nombres, ''), ' ', COALESCE(apellidos, ''))), ''),
                    usuario,
                    'Administrador'
                )
                FROM usuario
                WHERE id_usuario = %s
                LIMIT 1;
                """,
                [id_usuario],
            )
            r_usr = cursor.fetchone()
            if r_usr and r_usr[0]:
                responsable_nombre = str(r_usr[0])
    except Exception:
        pass

    id_merma_bd: Optional[int] = None
    if id_art_bd is not None:
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    _set_pg_usuario_sesion(cursor, id_usuario)
                    cursor.execute(
                        """
                        INSERT INTO merma (
                            id_articulo, id_usuario, fecha, cantidad, motivo, justificacion
                        )
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id_merma;
                        """,
                        [
                            int(id_art_bd),
                            int(id_usuario),
                            fecha_dt,
                            int(cantidad),
                            (motivo or "Otro")[:100],
                            (justificacion or "")[:500],
                        ],
                    )
                    row_m = cursor.fetchone()
                    if row_m and row_m[0] is not None:
                        id_merma_bd = int(row_m[0])

                if descontar_stock and articulo_obj is not None:
                    nuevo_stock = max(0, int(articulo_obj.stock_actual) - int(cantidad))
                    articulo_obj.stock_actual = nuevo_stock
                    articulo_obj.estado = "sin stock" if nuevo_stock <= 0 else "en bodega"
                    articulo_obj.save(update_fields=["stock_actual", "estado"])
                    _registrar_cardex_sql(
                        id_articulo=int(articulo_obj.id_articulo),
                        id_usuario=int(id_usuario),
                        tipo_sql="merma",
                        cantidad=int(cantidad),
                        stock_resultante=nuevo_stock,
                        costo_unitario=float(articulo_obj.precio or 0),
                    )
        except Exception:
            id_merma_bd = None

    registro = {
        "id": id_merma_bd or (len(_MEM_MERMAS_RESPALDO) + 1),
        "id_merma": id_merma_bd or (len(_MEM_MERMAS_RESPALDO) + 1),
        "id_articulo": id_art_bd,
        "fecha": fecha_dt.isoformat(),
        "fecha_hora": fecha_dt.isoformat(),
        "articulo": nombre_art_final,
        "responsable": responsable_nombre,
        "cantidad": int(cantidad),
        "motivo": motivo or "Otro",
        "justificacion": justificacion or "",
    }
    if id_merma_bd is None:
        _MEM_MERMAS_RESPALDO.insert(0, registro)
    return registro


def listar_mermas_sql() -> List[Dict[str, Any]]:
    """Consulta el historial de mermas combinando PostgreSQL ('merma') y respaldo local."""
    mermas: List[Dict[str, Any]] = []
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM merma LIMIT 0;")
            cols = [c[0] for c in cursor.description] if cursor.description else []
            if cols:
                cursor.execute(
                    """
                    SELECT
                        m.*,
                        COALESCE(a.nombre, CONCAT('Artículo #', m.id_articulo::text)) AS articulo_nombre,
                        COALESCE(
                            NULLIF(TRIM(CONCAT(COALESCE(u.nombres, ''), ' ', COALESCE(u.apellidos, ''))), ''),
                            u.usuario,
                            'Administrador'
                        ) AS responsable_nombre
                    FROM merma m
                    LEFT JOIN articulo a ON a.id_articulo = m.id_articulo
                    LEFT JOIN usuario u ON u.id_usuario = m.id_usuario
                    ORDER BY 1 DESC;
                    """
                )
                full_cols = [c[0] for c in cursor.description]
                for row in cursor.fetchall():
                    rec = dict(zip(full_cols, row))
                    id_val = rec.get("id_merma") or rec.get("id")
                    fecha_raw = rec.get("fecha") or rec.get("fecha_hora") or ""
                    fecha_str = (
                        fecha_raw.isoformat()
                        if hasattr(fecha_raw, "isoformat")
                        else str(fecha_raw or "")
                    )
                    mermas.append(
                        {
                            "id": id_val,
                            "id_merma": id_val,
                            "id_articulo": rec.get("id_articulo"),
                            "fecha": fecha_str,
                            "fecha_hora": fecha_str,
                            "articulo": rec.get("articulo_nombre") or f"Artículo #{rec.get('id_articulo')}",
                            "responsable": rec.get("responsable_nombre") or "Administrador",
                            "cantidad": rec.get("cantidad") or 0,
                            "motivo": rec.get("motivo") or "",
                            "justificacion": rec.get("justificacion") or rec.get("observacion") or "",
                        }
                    )
    except Exception:
        pass

    return _MEM_MERMAS_RESPALDO + mermas


def procesar_avance_obra(
    codigo_obra: str,
    porcentaje_avance: int,
    observacion: str,
    tipo_obra: str = "instalación",
    id_cliente: Optional[int] = None,
) -> Dict[str, Any]:
    """Crea o actualiza 'obra' y registra el avance en 'reporte'."""
    estado_obra = "finalizada" if porcentaje_avance >= 100 else "en proceso"
    usr_id, cli_default = _resolver_ids_obra()
    cli_id = id_cliente if id_cliente is not None else cli_default
    hoy = date.today()

    obra = Obra.objects.filter(nombre=codigo_obra, activo=True).first()
    if obra:
        obra.estado = estado_obra
        if not obra.fecha_inicio:
            obra.fecha_inicio = hoy
        if estado_obra == "finalizada" and not obra.fecha_termino:
            obra.fecha_termino = hoy
        obra.save(update_fields=["estado", "fecha_inicio", "fecha_termino"])
    else:
        obra = Obra.objects.create(
            id_usuario=usr_id,
            id_cliente=cli_id,
            nombre=codigo_obra[:150],
            tipo=tipo_obra[:20] if tipo_obra else "instalación",
            estado=estado_obra,
            fecha_inicio=hoy,
            fecha_termino=hoy if estado_obra == "finalizada" else None,
            activo=True,
        )

    if observacion:
        try:
            with connection.cursor() as cursor:
                _set_pg_usuario_sesion(cursor, usr_id)
                cursor.execute(
                    """
                    INSERT INTO reporte (id_obra, id_usuario, fecha, observaciones)
                    VALUES (%s, %s, NOW(), %s);
                    """,
                    [obra.id_obra, usr_id, observacion[:500]],
                )
        except Exception:
            pass

    return {
        "id_obra": obra.id_obra,
        "codigo": obra.nombre,
        "tipo": obra.tipo,
        "porcentaje_avance": porcentaje_avance,
        "observacion": observacion,
        "estado": "COMPLETADA" if porcentaje_avance >= 100 else "EN_EJECUCION",
        "estado_bd": obra.estado,
    }


def listar_inventario() -> List[Dict[str, Any]]:
    """Consulta los artículos activos desde la tabla 'articulo' con categoría y ubicación."""
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    a.id_articulo,
                    a.id_categoria,
                    a.id_ubicacion,
                    a.codigo_de_barras,
                    a.nombre,
                    a.stock_actual,
                    a.stock_critico,
                    a.unidad_de_medida,
                    a.precio,
                    a.estado,
                    COALESCE(c.nombre, 'General') AS categoria_nombre,
                    COALESCE(
                        NULLIF(TRIM(CONCAT(COALESCE(u.bodega, ''), ' - ', COALESCE(u.detalle, ''))), '-'),
                        CONCAT('Ubicación #', a.id_ubicacion::text)
                    ) AS ubicacion_nombre
                FROM articulo a
                LEFT JOIN categoria c ON c.id_categoria = a.id_categoria
                LEFT JOIN ubicacion u ON u.id_ubicacion = a.id_ubicacion
                WHERE a.activo = TRUE
                ORDER BY a.id_articulo ASC;
                """
            )
            rows = cursor.fetchall()
            return [
                {
                    "id": r[0],
                    "id_articulo": r[0],
                    "id_categoria": r[1],
                    "id_ubicacion": r[2],
                    "sku": r[3] or f"ART-{r[0]}",
                    "codigo_de_barras": r[3],
                    "nombre": r[4],
                    "stock": r[5],
                    "stock_actual": r[5],
                    "stock_critico": r[6],
                    "unidad_de_medida": r[7],
                    "precio": float(r[8]) if r[8] is not None else 0.0,
                    "estado": r[9],
                    "categoria": r[10],
                    "ubicacion": r[11],
                    "ubicacion_id": r[2],
                }
                for r in rows
            ]
    except Exception:
        qs = Articulo.objects.filter(activo=True).order_by("id_articulo")
        return [
            {
                "id": obj.id_articulo,
                "id_articulo": obj.id_articulo,
                "id_categoria": obj.id_categoria,
                "id_ubicacion": obj.id_ubicacion,
                "sku": obj.codigo_de_barras or f"ART-{obj.id_articulo}",
                "codigo_de_barras": obj.codigo_de_barras,
                "nombre": obj.nombre,
                "stock": obj.stock_actual,
                "stock_actual": obj.stock_actual,
                "stock_critico": obj.stock_critico,
                "unidad_de_medida": obj.unidad_de_medida,
                "ubicacion": f"Ubicación #{obj.id_ubicacion}",
                "ubicacion_id": obj.id_ubicacion,
                "precio": float(obj.precio),
                "estado": obj.estado,
            }
            for obj in qs
        ]


def crear_item_inventario(
    sku: str,
    nombre: str,
    stock: int,
    ubicacion: str = "Bodega Central",
    ubicacion_id: Optional[Any] = None,
    categoria_id: Optional[Any] = None,
    categoria: Optional[str] = None,
    unidad: str = "unidad",
    precio: float = 0.0,
    stock_critico: int = 5,
    usuario_ref: Optional[str] = None,
) -> Dict[str, Any]:
    """Crea o actualiza un artículo directamente en la tabla 'articulo'."""
    cat_ref = categoria_id if categoria_id not in (None, "") else categoria
    ubi_ref = ubicacion_id if ubicacion_id not in (None, "") else ubicacion
    cat_final, ubi_final = _resolver_ids_base(cat_ref, ubi_ref)
    id_usr_sesion = _resolver_id_usuario(usuario_ref)

    estado_art = "sin stock" if stock <= 0 else "en bodega"
    codigo_sku = str(sku).strip()[:20] if sku and str(sku).strip() else None
    nombre_limpio = str(nombre).strip()[:200]
    unidad_limpia = str(unidad).strip()[:25] if unidad and str(unidad).strip() else "unidad"

    try:
        precio_dec = Decimal(str(precio)).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        precio_dec = Decimal("0.00")

    ahora = datetime.now(timezone.utc)

    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                _set_pg_usuario_sesion(cursor, id_usr_sesion)

            existente = None
            if codigo_sku:
                existente = Articulo.objects.filter(
                    codigo_de_barras=codigo_sku
                ).first()
            if not existente:
                existente = Articulo.objects.filter(
                    nombre__iexact=nombre_limpio
                ).first()

            if existente:
                existente.nombre = nombre_limpio
                existente.stock_actual = int(stock)
                existente.stock_critico = int(stock_critico)
                existente.unidad_de_medida = unidad_limpia
                existente.id_categoria = int(cat_final)
                existente.id_ubicacion = int(ubi_final)
                existente.precio = precio_dec
                existente.estado = estado_art
                existente.activo = True
                if codigo_sku:
                    existente.codigo_de_barras = codigo_sku
                existente.save()
                obj = existente
            else:
                with connection.cursor() as cursor:
                    _set_pg_usuario_sesion(cursor, id_usr_sesion)
                    cursor.execute(
                        """
                        INSERT INTO articulo (
                            id_categoria, id_ubicacion, codigo_de_barras, nombre,
                            stock_actual, stock_critico, unidad_de_medida, precio,
                            fecha_ingreso, estado, activo
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                        RETURNING id_articulo;
                        """,
                        [
                            int(cat_final),
                            int(ubi_final),
                            codigo_sku,
                            nombre_limpio,
                            int(stock),
                            int(stock_critico),
                            unidad_limpia,
                            precio_dec,
                            ahora,
                            estado_art,
                        ],
                    )
                    nuevo_id = int(cursor.fetchone()[0])
                obj = Articulo.objects.get(pk=nuevo_id)

        return {
            "id": obj.id_articulo,
            "id_articulo": obj.id_articulo,
            "id_categoria": obj.id_categoria,
            "id_ubicacion": obj.id_ubicacion,
            "sku": obj.codigo_de_barras or f"ART-{obj.id_articulo}",
            "codigo_de_barras": obj.codigo_de_barras,
            "nombre": obj.nombre,
            "stock": obj.stock_actual,
            "stock_actual": obj.stock_actual,
            "stock_critico": obj.stock_critico,
            "unidad_de_medida": obj.unidad_de_medida,
            "ubicacion": ubicacion or f"Ubicación #{obj.id_ubicacion}",
            "ubicacion_id": obj.id_ubicacion,
            "precio": float(obj.precio),
            "estado": obj.estado,
        }
    except Exception as exc:
        return {
            "error": f"Error al guardar artículo en BD: {exc}",
            "status": 400,
        }


def _registrar_cardex_sql(
    id_articulo: int,
    id_usuario: int,
    tipo_sql: str,
    cantidad: int,
    stock_resultante: int,
    costo_unitario: float,
) -> Optional[int]:
    """Inserta movimiento en 'cardex' y devuelve id_movimiento."""
    try:
        with connection.cursor() as cursor:
            _set_pg_usuario_sesion(cursor, id_usuario)
            cursor.execute(
                """
                INSERT INTO cardex (
                    id_articulo, id_usuario, fecha, tipo,
                    cantidad, stock_resultante, costo_unitario
                )
                VALUES (%s, %s, NOW(), %s, %s, %s, %s)
                RETURNING id_movimiento;
                """,
                [
                    id_articulo,
                    id_usuario,
                    tipo_sql,
                    cantidad,
                    stock_resultante,
                    costo_unitario,
                ],
            )
            row = cursor.fetchone()
            return int(row[0]) if row and row[0] is not None else None
    except Exception:
        return None


def listar_movimientos_cardex() -> List[Dict[str, Any]]:
    """Consulta el historial de movimientos desde 'cardex'."""
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT c.id_movimiento, c.id_articulo, c.id_usuario, c.fecha, c.tipo,
                       c.cantidad, c.stock_resultante, c.costo_unitario,
                       a.nombre, a.codigo_de_barras, u.usuario
                FROM cardex c
                JOIN articulo a ON a.id_articulo = c.id_articulo
                JOIN usuario u ON u.id_usuario = c.id_usuario
                ORDER BY c.fecha DESC, c.id_movimiento DESC;
                """
            )
            rows = cursor.fetchall()
            return [
                {
                    "id_movimiento": r[0],
                    "id_articulo": r[1],
                    "id_usuario": r[2],
                    "fecha": r[3].isoformat() if hasattr(r[3], "isoformat") else str(r[3]),
                    "tipo": r[4],
                    "cantidad": r[5],
                    "stock_resultante": r[6],
                    "costo_unitario": float(r[7]) if r[7] is not None else 0.0,
                    "articulo": r[8],
                    "sku": r[9] or f"ART-{r[1]}",
                    "usuario": r[10],
                }
                for r in rows
            ]
    except Exception:
        return []


def listar_solicitudes_sql() -> List[Dict[str, Any]]:
    """Consulta solicitudes y su detalle desde 'solicitud_articulo' y 'detalle_solicitud'."""
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT s.id_solicitud, s.id_usuario, s.id_obra, s.fecha, s.comentarios,
                       ds.id_detalle, ds.id_articulo, ds.cantidad, a.nombre
                FROM solicitud_articulo s
                LEFT JOIN detalle_solicitud ds ON ds.id_solicitud = s.id_solicitud
                LEFT JOIN articulo a ON a.id_articulo = ds.id_articulo
                ORDER BY s.id_solicitud DESC, ds.id_detalle ASC;
                """
            )
            rows = cursor.fetchall()
            return [
                {
                    "id_solicitud": r[0],
                    "id_usuario": r[1],
                    "id_obra": r[2],
                    "fecha": r[3].isoformat() if hasattr(r[3], "isoformat") else str(r[3]),
                    "comentarios": r[4] or "",
                    "id_detalle": r[5],
                    "id_articulo": r[6],
                    "cantidad": r[7],
                    "articulo": r[8],
                }
                for r in rows
            ]
    except Exception:
        return []


def crear_solicitud_sql(
    sku_o_id: str,
    cantidad: int,
    observacion: str = "",
    usuario_ref: str = "",
    id_obra: Optional[int] = None,
) -> Dict[str, Any]:
    """Crea un registro en 'solicitud_articulo' y su línea en 'detalle_solicitud'."""
    id_usuario = _resolver_id_usuario(usuario_ref)
    if id_obra is None:
        obra_activa = Obra.objects.filter(activo=True).order_by("id_obra").first()
        id_obra = obra_activa.id_obra if obra_activa else 1

    articulo = (
        Articulo.objects.filter(codigo_de_barras=sku_o_id, activo=True).first()
        or Articulo.objects.filter(nombre__iexact=sku_o_id, activo=True).first()
    )
    if not articulo and sku_o_id.isdigit():
        articulo = Articulo.objects.filter(id_articulo=int(sku_o_id), activo=True).first()

    if not articulo:
        return {"error": f"Artículo '{sku_o_id}' no encontrado.", "status": 404}

    id_solicitud = None
    id_detalle = None
    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                _set_pg_usuario_sesion(cursor, id_usuario)
                cursor.execute(
                    """
                    INSERT INTO solicitud_articulo (id_usuario, id_obra, fecha, comentarios)
                    VALUES (%s, %s, NOW(), %s)
                    RETURNING id_solicitud;
                    """,
                    [id_usuario, id_obra, observacion[:500]],
                )
                id_solicitud = int(cursor.fetchone()[0])

                cursor.execute(
                    """
                    INSERT INTO detalle_solicitud (id_solicitud, id_articulo, cantidad)
                    VALUES (%s, %s, %s)
                    RETURNING id_detalle;
                    """,
                    [id_solicitud, articulo.id_articulo, cantidad],
                )
                id_detalle = int(cursor.fetchone()[0])
    except Exception as exc:
        return {"error": f"Error al guardar solicitud: {exc}", "status": 500}

    return {
        "status": 201,
        "solicitud": {
            "id": id_solicitud,
            "id_solicitud": id_solicitud,
            "id_detalle": id_detalle,
            "id_obra": id_obra,
            "id_articulo": articulo.id_articulo,
            "sku": articulo.codigo_de_barras or f"ART-{articulo.id_articulo}",
            "cantidad": cantidad,
            "observacion": observacion,
            "comentarios": observacion,
            "estado": "PENDIENTE",
        },
    }


def _guardar_telemetria_nosql(documento: Dict[str, Any]) -> Dict[str, Any]:
    """Enruta lecturas de telemetría hacia MongoDB (o respaldo local si no hay MONGO_URI)."""
    mongo_uri = os.getenv("MONGO_URI", "").strip()
    if mongo_uri:
        try:
            from pymongo import MongoClient  # type: ignore

            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
            db = client.get_default_database()
            res = db["telemetria_bodega"].insert_one(dict(documento))
            documento["_id"] = str(res.inserted_id)
            return documento
        except Exception:
            pass

    documento["_id"] = str(uuid.uuid4())
    _MEM_TELEMETRIA_MONGO.append(documento)
    return documento


def buscar_inventario_filtrado(
    query: str = "", ubicacion: str = "", stock_critico: bool = False
) -> List[Dict[str, Any]]:
    """Filtra artículos por SKU/código, nombre, ubicación o stock crítico."""
    items = listar_inventario()
    q_norm = query.strip().lower()
    ubi_norm = ubicacion.strip().lower()

    resultados = []
    for item in items:
        if q_norm and (
            q_norm not in str(item["sku"]).lower()
            and q_norm not in str(item["nombre"]).lower()
        ):
            continue
        if ubi_norm and ubi_norm not in str(item["ubicacion"]).lower():
            continue
        if stock_critico and item["stock"] > item.get("stock_critico", 5):
            continue
        resultados.append(item)

    return resultados


def orquestar_movimiento_bodega(
    sku: str,
    tipo: str,
    cantidad: int,
    precio_neto: int,
    usuario: str,
    telemetria: Dict[str, Any],
) -> Dict[str, Any]:
    """Actualiza 'articulo', inserta en 'cardex' (y 'merma' si aplica) y registra telemetría."""
    items = listar_inventario()
    item = next(
        (
            i
            for i in items
            if str(i["sku"]).lower() == sku.lower()
            or str(i["nombre"]).lower() == sku.lower()
            or str(i["id_articulo"]) == str(sku)
        ),
        None,
    )
    if not item:
        return {"error": f"SKU/artículo '{sku}' no encontrado.", "status": 404}

    tipo_upper = tipo.strip().upper()
    tipo_sql = _normalizar_tipo_cardex(tipo_upper)

    if tipo_sql in ("salida", "merma", "eliminacion") and item["stock"] < cantidad:
        return {
            "error": "Stock insuficiente para despacho.",
            "sku": sku,
            "stock_actual": item["stock"],
            "solicitado": cantidad,
            "status": 409,
        }

    nuevo_stock = (
        item["stock"] + cantidad
        if tipo_sql == "ingreso"
        else item["stock"] - cantidad
    )
    costo_unit = float(precio_neto or item["precio"])
    id_usuario = _resolver_id_usuario(usuario)

    with transaction.atomic():
        crear_item_inventario(
            sku=item["sku"],
            nombre=item["nombre"],
            stock=nuevo_stock,
            ubicacion=item["ubicacion"],
            ubicacion_id=item["ubicacion_id"],
            categoria_id=item["id_categoria"],
            precio=costo_unit,
            usuario_ref=usuario,
        )
        id_movimiento = _registrar_cardex_sql(
            id_articulo=int(item["id_articulo"]),
            id_usuario=id_usuario,
            tipo_sql=tipo_sql,
            cantidad=cantidad,
            stock_resultante=nuevo_stock,
            costo_unitario=costo_unit,
        )
        if tipo_sql == "merma":
            motivo_tel = str(
                (telemetria or {}).get("motivo", "Merma registrada en bodega")
            )
            justif_tel = str(
                (telemetria or {}).get(
                    "justificacion", (telemetria or {}).get("observacion", "")
                )
            )
            _registrar_merma_sql(
                id_articulo=int(item["id_articulo"]),
                articulo_nombre=item["nombre"],
                cantidad=cantidad,
                motivo=motivo_tel,
                justificacion=justif_tel,
                usuario_ref=usuario,
                descontar_stock=False,
            )

    neto = precio_neto * cantidad
    iva = round(neto * 0.19)
    total = neto + iva

    registro_sql = {
        "id": id_movimiento,
        "id_movimiento": id_movimiento,
        "id_articulo": item["id_articulo"],
        "sku": item["sku"],
        "tipo": tipo_upper,
        "tipo_bd": tipo_sql,
        "cantidad": cantidad,
        "stock_resultante": nuevo_stock,
        "monto_neto": neto,
        "iva_19": iva,
        "monto_total": total,
        "usuario": usuario,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    doc_mongo = _guardar_telemetria_nosql(
        {
            "evento": f"MOVIMIENTO_{tipo_upper}",
            "sku": item["sku"],
            "ubicacion": item["ubicacion"],
            "telemetria": telemetria,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )

    return {
        "status": 201,
        "registro_sql": registro_sql,
        "registro_mongo": doc_mongo,
    }


def sincronizar_lote_offline(
    operaciones: List[Dict[str, Any]], usuario: str
) -> Dict[str, Any]:
    """Procesa operaciones en caché local tras caída de red con validación de conflictos."""
    sincronizados = []
    duplicados = []
    conflictos = []

    for op in operaciones:
        op_id = str(op.get("uuid_operacion", "")).strip()
        sku = str(op.get("sku", "")).strip()
        tipo = str(op.get("tipo", "EGRESO")).upper()
        cantidad = int(op.get("cantidad", 0))
        precio_neto = int(op.get("precio_neto", 0))

        if not op_id or not sku or cantidad <= 0:
            conflictos.append({"uuid_operacion": op_id, "motivo": "Payload inválido"})
            continue

        if op_id in _SYNC_UUIDS_PROCESADOS:
            duplicados.append(op_id)
            continue

        res = orquestar_movimiento_bodega(
            sku=sku,
            tipo=tipo,
            cantidad=cantidad,
            precio_neto=precio_neto,
            usuario=usuario,
            telemetria={"origen": "OFFLINE_SYNC_MOBILE", "uuid_operacion": op_id},
        )
        if res["status"] == 201:
            _SYNC_UUIDS_PROCESADOS.add(op_id)
            sincronizados.append(
                {
                    "uuid_operacion": op_id,
                    "sku": sku,
                    "stock_resultante": res["registro_sql"]["stock_resultante"],
                }
            )
        else:
            conflictos.append(
                {
                    "uuid_operacion": op_id,
                    "sku": sku,
                    "motivo": res.get("error", "Conflicto de sincronización"),
                }
            )

    return {
        "sincronizados": sincronizados,
        "duplicados_ignorados": duplicados,
        "conflictos": conflictos,
    }