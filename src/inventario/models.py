"""Modelos de dominio del modulo de Inventario y Obras.

Modelo / datos - FYAG.
"""

from django.db import models


class OrdenObra(models.Model):
    """Representa una orden de obra o mantencion en Proyecto Alpha."""

    codigo = models.CharField(max_length=40, unique=True)
    porcentaje_avance = models.IntegerField(default=0)
    observacion = models.TextField(blank=True, default="")
    estado = models.CharField(max_length=30, default="EN_EJECUCION")

    class Meta:
        app_label = "src.inventario"


class ItemInventario(models.Model):
    """Representa un insumo o repuesto en bodega frigorifica/obra."""

    sku = models.CharField(max_length=40, unique=True)
    nombre = models.CharField(max_length=120)
    stock = models.IntegerField(default=0)
    ubicacion = models.CharField(max_length=100, default="Bodega Central")

    class Meta:
        app_label = "src.inventario"
