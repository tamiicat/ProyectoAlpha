"""Capa Modelo (MVC): Modelos ORM conectados a Supabase (articulo, obra) y servicios."""

import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from django.db import models, transaction


class Obra(models.Model):
    """Mapea la tabla 'obra' en Supabase."""

    id_obra = models.AutoField(primary_key=True)
    id_usuario = models.IntegerField()
    id_cliente = models.IntegerField()
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=20, default="instalación")
    estado = models.CharField(max_length=20, default="pendiente")
    activo = models.BooleanField(default=True)

    class Meta:
        app_label = "models"
        db_table = "obra"
        managed = False

    def __str__(self) -> str:
        return f"{self.nombre} ({self.estado})"


class Articulo(models.Model):
    """Mapea la tabla 'articulo' en Supabase."""

    id_articulo = models.AutoField(primary_key=True)
    id_categoria = models.IntegerField()
    id_ubicacion = models.IntegerField()
    codigo_de_barras = models.CharField(max_length=20, blank=True, null=True)
    nombre = models.CharField(max_length=200)
    stock_actual = models.IntegerField(default=0)
    stock_critico = models.IntegerField(default=0)
    unidad_de_medida = models.CharField(max_length=25, default="unidad")
    precio = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, default="en bodega")
    activo = models.BooleanField(default=True)

    class Meta:
        app_label = "models"
        db_table = "articulo"
        managed = False

    def __str__(self) -> str:
        return f"{self.codigo_de_barras or self.id_articulo} - {self.nombre} ({self.stock_actual})"


_MEM_KARDEX: List[Dict[str, Any]] = []
_MEM_TELEMETRIA_MONGO: List[Dict[str, Any]] = []
_SYNC_UUIDS_PROCESADOS: set = set()


def _resolver_ids_base() -> tuple[int, int]:
    """Obtiene un id_categoria y un id_ubicacion válidos desde Supabase (o 1 por defecto)."""
    cat_id = 1
    ubi_id = 1
    try:
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id_categoria FROM categoria WHERE activo = TRUE ORDER BY id_categoria LIMIT 1;"
            )
            row_cat = cursor.fetchone()
            if row_cat and row_cat[0] is not None:
                cat_id = int(row_cat[0])

            cursor.execute(
                "SELECT id_ubicacion FROM ubicacion WHERE activo = TRUE ORDER BY id_ubicacion LIMIT 1;"
            )
            row_ubi = cursor.fetchone()
            if row_ubi and row_ubi[0] is not None:
                ubi_id = int(row_ubi[0])
    except Exception:
        pass
    return cat_id, ubi_id


def _resolver_ids_obra() -> tuple[int, int]:
    """Obtiene un id_usuario y un id_cliente válidos desde Supabase (o 1 por defecto)."""
    usr_id = 1
    cli_id = 1
    try:
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id_usuario FROM usuario WHERE activo = TRUE ORDER BY id_usuario LIMIT 1;"
            )
            row_usr = cursor.fetchone()
            if row_usr and row_usr[0] is not None:
                usr_id = int(row_usr[0])

            cursor.execute(
                "SELECT id_cliente FROM cliente WHERE activo = TRUE ORDER BY id_cliente LIMIT 1;"
            )
            row_cli = cursor.fetchone()
            if row_cli and row_cli[0] is not None:
                cli_id = int(row_cli[0])
    except Exception:
        pass
    return usr_id, cli_id


def procesar_avance_obra(
    codigo_obra: str, porcentaje_avance: int, observacion: str
) -> Dict[str, Any]:
    """Registra o actualiza una obra y su reporte/observación en Supabase."""
    estado_obra = "finalizada" if porcentaje_avance >= 100 else "en proceso"
    usr_id, cli_id = _resolver_ids_obra()

    obra = Obra.objects.filter(nombre=codigo_obra, activo=True).first()
    if obra:
        obra.estado = estado_obra
        obra.save(update_fields=["estado"])
    else:
        obra = Obra.objects.create(
            id_usuario=usr_id,
            id_cliente=cli_id,
            nombre=codigo_obra[:150],
            tipo="instalación",
            estado=estado_obra,
            activo=True,
        )

    if observacion:
        try:
            from django.db import connection

            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO reporte (id_obra, id_usuario, observaciones) VALUES (%s, %s, %s);",
                    [obra.id_obra, usr_id, observacion[:500]],
                )
        except Exception:
            pass

    return {
        "codigo": obra.nombre,
        "porcentaje_avance": porcentaje_avance,
        "observacion": observacion,
        "estado": "COMPLETADA" if porcentaje_avance >= 100 else "EN_EJECUCION",
    }


def listar_inventario() -> List[Dict[str, Any]]:
    """Consulta los artículos activos desde la tabla 'articulo' en Supabase."""
    qs = Articulo.objects.filter(activo=True).order_by("id_articulo")
    return [
        {
            "id": obj.id_articulo,
            "sku": obj.codigo_de_barras or f"ART-{obj.id_articulo}",
            "nombre": obj.nombre,
            "stock": obj.stock_actual,
            "stock_critico": obj.stock_critico,
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
    ubicacion_id: int | None = None,
    categoria_id: int | None = None,
    unidad: str = "unidad",
    precio: float = 0.0,
) -> Dict[str, Any]:
    """Crea o actualiza un artículo directamente en la tabla 'articulo' de Supabase."""
    cat_default, ubi_default = _resolver_ids_base()
    cat_final = categoria_id if categoria_id is not None else cat_default
    ubi_final = ubicacion_id if ubicacion_id is not None else ubi_default
    estado_art = "sin stock" if stock <= 0 else "en bodega"
    codigo_sku = sku[:20] if sku else None

    existente = None
    if codigo_sku:
        existente = Articulo.objects.filter(
            codigo_de_barras=codigo_sku, activo=True
        ).first()
    if not existente:
        existente = Articulo.objects.filter(nombre=nombre, activo=True).first()

    if existente:
        existente.nombre = nombre[:200]
        existente.stock_actual = stock
        existente.id_ubicacion = ubi_final
        existente.estado = estado_art
        if codigo_sku:
            existente.codigo_de_barras = codigo_sku
        existente.save()
        obj = existente
    else:
        obj = Articulo.objects.create(
            id_categoria=cat_final,
            id_ubicacion=ubi_final,
            codigo_de_barras=codigo_sku,
            nombre=nombre[:200],
            stock_actual=stock,
            stock_critico=5,
            unidad_de_medida=unidad[:25],
            precio=precio,
            estado=estado_art,
            activo=True,
        )

    return {
        "id": obj.id_articulo,
        "sku": obj.codigo_de_barras or f"ART-{obj.id_articulo}",
        "nombre": obj.nombre,
        "stock": obj.stock_actual,
        "ubicacion": ubicacion or f"Ubicación #{obj.id_ubicacion}",
        "ubicacion_id": obj.id_ubicacion,
        "precio": float(obj.precio),
        "estado": obj.estado,
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
    """Filtra artículos desde Supabase por SKU/código, nombre, ubicación o stock crítico."""
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
    """Actualiza el stock en 'articulo' (Supabase) y registra movimiento/telemetría."""
    items = listar_inventario()
    item = next(
        (
            i
            for i in items
            if str(i["sku"]).lower() == sku.lower()
            or str(i["nombre"]).lower() == sku.lower()
        ),
        None,
    )
    if not item:
        return {"error": f"SKU/artículo '{sku}' no encontrado.", "status": 404}

    if tipo == "EGRESO" and item["stock"] < cantidad:
        return {
            "error": "Stock insuficiente para despacho.",
            "sku": sku,
            "stock_actual": item["stock"],
            "solicitado": cantidad,
            "status": 409,
        }

    nuevo_stock = (
        item["stock"] + cantidad if tipo == "INGRESO" else item["stock"] - cantidad
    )

    with transaction.atomic():
        crear_item_inventario(
            sku=item["sku"],
            nombre=item["nombre"],
            stock=nuevo_stock,
            ubicacion=item["ubicacion"],
            ubicacion_id=item["ubicacion_id"],
            precio=float(precio_neto or item["precio"]),
        )

    neto = precio_neto * cantidad
    iva = round(neto * 0.19)
    total = neto + iva

    registro_sql = {
        "id": len(_MEM_KARDEX) + 1,
        "sku": item["sku"],
        "tipo": tipo,
        "cantidad": cantidad,
        "stock_resultante": nuevo_stock,
        "monto_neto": neto,
        "iva_19": iva,
        "monto_total": total,
        "usuario": usuario,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _MEM_KARDEX.append(registro_sql)

    doc_mongo = _guardar_telemetria_nosql(
        {
            "evento": f"MOVIMIENTO_{tipo}",
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
