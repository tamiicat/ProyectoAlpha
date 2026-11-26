"""Pruebas de integración de vistas, RBAC, auth y modelo relacional."""

import json
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.test import RequestFactory

from controllers.rbac_xss_controller import RBAC_MATRIX, sanitize_text_input
from models.seguridad_model import (
    AES256FieldCipher,
    JWTManager,
    hash_password,
    verify_password,
)
from views.api_views import (
    api_cardex,
    api_crear_inventario,
    api_listar_inventario,
    api_solicitudes,
    api_usuarios,
    registrar_avance_obra,
)
from views.auth_service_view import MemoryStore, build_handler


def test_password_y_aes256():
    hashed = hash_password("ClaveSegura2026#")
    assert verify_password("ClaveSegura2026#", hashed) is True
    assert verify_password("OtraClave", hashed) is False

    import base64
    import os

    key_b64 = base64.b64encode(os.urandom(32)).decode("utf-8")
    cipher = AES256FieldCipher(key_b64)
    token = cipher.encrypt("dato-sensible-fyag")
    assert cipher.decrypt(token) == "dato-sensible-fyag"


def test_rbac_incluye_autorizaciones_y_sanitiza_xss():
    assert "R" in RBAC_MATRIX["ADMIN_TI"]["autorizaciones"]
    assert "U" in RBAC_MATRIX["SUPERVISOR_OBRAS"]["autorizaciones"]
    limpio = sanitize_text_input("<script>alert(1)</script><b>Obra Norte</b>")
    assert "<script>" not in limpio
    assert "<b>Obra Norte</b>" in limpio


def test_vistas_requieren_rol_jwt():
    rf = RequestFactory()
    req = rf.get("/api/v1/inventario/items/")
    resp = api_listar_inventario(req)
    assert resp.status_code == 401


def test_registrar_avance_obra_y_solicitud_con_mock():
    rf = RequestFactory()

    with patch("models.orden_obra_model._resolver_ids_obra", return_value=(1, 1)), patch(
        "models.orden_obra_model.Obra.objects"
    ) as mock_obra_mgr:
        mock_obra_mgr.filter.return_value.first.return_value = None
        mock_obra_mgr.create.return_value = SimpleNamespace(
            id_obra=10,
            nombre="OBRA-01",
            tipo="instalación",
            estado="en proceso",
        )

        req = rf.post(
            "/api/v1/obras/avance/",
            data=json.dumps(
                {
                    "codigo_obra": "OBRA-01",
                    "porcentaje_avance": 45,
                    "observacion": "Montaje inicial",
                }
            ),
            content_type="application/json",
        )
        req.jwt_role = "SUPERVISOR_OBRAS"
        resp = registrar_avance_obra(req)
        assert resp.status_code == 201
        payload = json.loads(resp.content.decode("utf-8"))
        assert payload["codigo_obra"] == "OBRA-01"
        assert payload["porcentaje_avance"] == 45
        assert payload["estado"] == "EN_EJECUCION"


def test_endpoints_usuarios_cardex_y_solicitudes_con_rol():
    rf = RequestFactory()

    req_usr = rf.get("/api/v1/usuarios/")
    req_usr.jwt_role = "ADMIN_TI"
    with patch("views.api_views.connection.cursor", side_effect=Exception("no db")):
        resp_usr = api_usuarios(req_usr)
    assert resp_usr.status_code == 200
    assert "usuarios" in json.loads(resp_usr.content.decode("utf-8"))

    req_cardex = rf.get("/api/v1/cardex/")
    req_cardex.jwt_role = "BODEGUERO"
    with patch("models.orden_obra_model.listar_movimientos_cardex", return_value=[]):
        resp_cardex = api_cardex(req_cardex)
    assert resp_cardex.status_code == 200
    assert json.loads(resp_cardex.content.decode("utf-8"))["total"] == 0

    req_sol = rf.get("/api/v1/solicitudes/")
    req_sol.jwt_role = "TECNICO"
    with patch("models.orden_obra_model.listar_solicitudes_sql", return_value=[]):
        resp_sol = api_solicitudes(req_sol)
    assert resp_sol.status_code == 200
    assert json.loads(resp_sol.content.decode("utf-8"))["total"] == 0