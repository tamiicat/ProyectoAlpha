"""Capa de servicios de negocio para Inventario y Obras - FYAG."""

from typing import Any, Dict, List

from src.inventario.models import OrdenObra

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
    """Actualiza y persiste el avance de una orden de obra."""
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
    if porcentaje_avance >= 100:
        registro["estado"] = "COMPLETADA"
    return OrdenObra(
        codigo=registro["codigo"],
        porcentaje_avance=registro["porcentaje_avance"],
        observacion=registro["observacion"],
        estado=registro["estado"],
    )


def listar_inventario() -> List[Dict[str, Any]]:
    """Retorna el listado actual de items en inventario."""
    return list(_MEM_INVENTARIO.values())


def crear_item_inventario(
    sku: str, nombre: str, stock: int, ubicacion: str
) -> Dict[str, Any]:
    """Crea o actualiza un item en inventario."""
    item = {
        "sku": sku,
        "nombre": nombre,
        "stock": stock,
        "ubicacion": ubicacion,
    }
    _MEM_INVENTARIO[sku] = item
    return item