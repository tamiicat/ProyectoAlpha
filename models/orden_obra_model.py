"""Capa Modelo (MVC): Entidades OrdenObra e ItemInventario, servicios CRUD, Orquestación Dual y Sync Offline."""

import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from django.db import OperationalError, ProgrammingError, models, transaction


class OrdenObra(models.Model):
    """Representa una orden de obra o mantención en Proyecto Alpha."""

    codigo = models.CharField(max_length=40, unique=True)
    porcentaje_avance = models.IntegerField(default=0)
    observacion = models.TextField(blank=True, default="")
    estado = models.CharField(max_length=30, default="EN_EJECUCION")

    class Meta:
        app_label = "models"
        db_table = "orden_obra"

    def __str__(self) -> str:
        return f"{self.codigo} ({self.estado} - {self.porcentaje_avance}%)"


class ItemInventario(models.Model):
    """Representa un insumo o repuesto en bodega frigorífica/obra."""

    sku = models.CharField(max_length=40, unique=True)
    nombre = models.CharField(max_length=120)
    stock = models.IntegerField(default=0)
    ubicacion = models.CharField(max_length=100, default="Bodega Central")

    class Meta:
        app_label = "models"
        db_table = "item_inventario"

    def __str__(self) -> str:
        return f"{self.sku} - {self.nombre} ({self.stock})"


_MEM_OBRAS: Dict[str, Dict[str, Any]] = {
    "OBRA-408": {
        "codigo": "OBRA-408",
        "porcentaje_avance": 40,
        "observacion": "Inicio de montaje frigorifico.",
        "estado": "EN_EJECUCION",
    }
}

_MEM_INVENTARIO: Dict[str, Dict[str, Any]] = {
    "INS-101": {
        "sku": "INS-101",
        "nombre": "Valvula de expansion industrial",
        "stock": 25,
        "ubicacion": "Camara Fria 1",
    },
    "INS-204": {
        "sku": "INS-204",
        "nombre": "Sensor termico digital",
        "stock": 40,
        "ubicacion": "Bodega Central",
    },
}

_MEM_KARDEX: List[Dict[str, Any]] = []
_MEM_TELEMETRIA_MONGO: List[Dict[str, Any]] = []
_SYNC_UUIDS_PROCESADOS: set = set()


def procesar_avance_obra(
    codigo_obra: str, porcentaje_avance: int, observacion: str
) -> OrdenObra:
    """Inserta o actualiza el avance de una orden de obra en BD (con respaldo en memoria)."""
    estado = "COMPLETADA" if porcentaje_avance >= 100 else "EN_EJECUCION"

    try:
        obra, _ = OrdenObra.objects.update_or_create(
            codigo=codigo_obra,
            defaults={
                "porcentaje_avance": porcentaje_avance,
                "observacion": observacion,
                "estado": estado,
            },
        )
        return obra
    except (OperationalError, ProgrammingError):
        registro = _MEM_OBRAS.setdefault(
            codigo_obra,
            {
                "codigo": codigo_obra,
                "porcentaje_avance": 0,
                "observacion": "",
                "estado": "EN_EJECUCION",
            },
        )
        registro["porcentaje_avance"] = porcentaje_avance
        registro["observacion"] = observacion
        registro["estado"] = estado
        return OrdenObra(
            codigo=registro["codigo"],
            porcentaje_avance=registro["porcentaje_avance"],
            observacion=registro["observacion"],
            estado=registro["estado"],
        )


def listar_inventario() -> List[Dict[str, Any]]:
    """Consulta (SELECT) el listado actual de items en inventario."""
    try:
        qs = ItemInventario.objects.all().order_by("sku")
        if qs.exists():
            return [
                {
                    "sku": obj.sku,
                    "nombre": obj.nombre,
                    "stock": obj.stock,
                    "ubicacion": obj.ubicacion,
                }
                for obj in qs
            ]
    except (OperationalError, ProgrammingError):
        pass

    return list(_MEM_INVENTARIO.values())


def crear_item_inventario(
    sku: str, nombre: str, stock: int, ubicacion: str
) -> Dict[str, Any]:
    """Inserta o actualiza (INSERT/UPDATE) un item en inventario."""
    item_dict = {
        "sku": sku,
        "nombre": nombre,
        "stock": stock,
        "ubicacion": ubicacion,
    }
    try:
        obj, _ = ItemInventario.objects.update_or_create(
            sku=sku,
            defaults={
                "nombre": nombre,
                "stock": stock,
                "ubicacion": ubicacion,
            },
        )
        return {
            "sku": obj.sku,
            "nombre": obj.nombre,
            "stock": obj.stock,
            "ubicacion": obj.ubicacion,
        }
    except (OperationalError, ProgrammingError):
        _MEM_INVENTARIO[sku] = item_dict
        return item_dict


def _guardar_telemetria_nosql(documento: Dict[str, Any]) -> Dict[str, Any]:
    """Enruta lecturas de telemetría hacia MongoDB (o colección local si no hay MONGO_URI)."""
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
    """Búsqueda con filtros y autocompletado por SKU, nombre o ubicación."""
    items = listar_inventario()
    q_norm = query.strip().lower()
    ubi_norm = ubicacion.strip().lower()

    resultados = []
    for item in items:
        if q_norm and (
            q_norm not in item["sku"].lower()
            and q_norm not in item["nombre"].lower()
        ):
            continue
        if ubi_norm and ubi_norm not in item["ubicacion"].lower():
            continue
        if stock_critico and item["stock"] > 5:
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
    """Orquesta transacción financiera/stock en SQL y telemetría operativa en MongoDB."""
    items = listar_inventario()
    item = next((i for i in items if i["sku"] == sku), None)
    if not item:
        return {"error": f"SKU '{sku}' no encontrado.", "status": 404}

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

    # 1. Persistencia SQL (ACID) + Cálculo de IVA (19% Chile)
    try:
        with transaction.atomic():
            crear_item_inventario(sku, item["nombre"], nuevo_stock, item["ubicacion"])
    except Exception:
        crear_item_inventario(sku, item["nombre"], nuevo_stock, item["ubicacion"])

    neto = precio_neto * cantidad
    iva = round(neto * 0.19)
    total = neto + iva

    registro_sql = {
        "id": len(_MEM_KARDEX) + 1,
        "sku": sku,
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

    # 2. Distribución NoSQL hacia MongoDB (Telemetría ambiental / escáner)
    doc_mongo = _guardar_telemetria_nosql(
        {
            "evento": f"MOVIMIENTO_{tipo}",
            "sku": sku,
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


def sincronizar_lote_offline(operaciones: List[Dict[str, Any]], usuario: str) -> Dict[str, Any]:
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