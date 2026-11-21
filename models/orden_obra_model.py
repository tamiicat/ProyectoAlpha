"""Capa Modelo (MVC): Entidades OrdenObra e ItemInventario y servicios CRUD."""

from typing import Any, Dict, List

from django.db import OperationalError, ProgrammingError, models


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
