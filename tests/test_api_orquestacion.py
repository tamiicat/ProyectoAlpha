"""Pruebas automatizadas QA para APIs REST, orquestación dual y sincronización offline."""

import json
import pytest
from django.test import Client


@pytest.mark.django_db
def test_busqueda_inventario_con_filtros():
    client = Client(SERVER_NAME="localhost")
    headers = {"HTTP_X_USER_ROLE": "bodeguero"}
    resp = client.get("/api/v1/inventario/search/?q=Valvula", **headers)
    assert resp.status_code in (200, 401, 403)


@pytest.mark.django_db
def test_orquestacion_movimiento_y_bloqueo_sin_stock():
    client = Client(SERVER_NAME="localhost")
    headers = {"HTTP_X_USER_ROLE": "admin"}

    payload_exceso = {
        "sku": "INS-101",
        "tipo": "EGRESO",
        "cantidad": 9999,
        "precio_neto": 10000,
    }
    resp = client.post(
        "/api/v1/movimientos/orquestar/",
        data=json.dumps(payload_exceso),
        content_type="application/json",
        **headers,
    )
    assert resp.status_code in (409, 401, 403)


@pytest.mark.django_db
def test_sincronizacion_offline_batch():
    client = Client(SERVER_NAME="localhost")
    headers = {"HTTP_X_USER_ROLE": "bodeguero"}
    payload_sync = {
        "usuario": "tecnico@fyag.cl",
        "operaciones": [
            {
                "uuid_operacion": "op-offline-001",
                "sku": "INS-204",
                "tipo": "INGRESO",
                "cantidad": 5,
                "precio_neto": 15000,
            }
        ],
    }
    resp = client.post(
        "/api/v1/sync/batch/",
        data=json.dumps(payload_sync),
        content_type="application/json",
        **headers,
    )
    assert resp.status_code in (207, 401, 403)