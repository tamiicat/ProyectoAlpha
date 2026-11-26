"""Script de comprobación de evidencias - Proyecto Alpha (FYAG - MVC)."""

import base64
import json
import os
import threading
import time
import urllib.error
import urllib.request

import django
from django.conf import settings

if not settings.configured:
    settings.configure(
        INSTALLED_APPS=["models", "views", "controllers"],
        DATABASES={
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": ":memory:",
            }
        },
    )
django.setup()

from django.test import RequestFactory  # noqa: E402

from models.orden_obra_model import _MEM_INVENTARIO, _MEM_OBRAS  # noqa: E402
from models.seguridad_model import (  # noqa: E402
    AES256FieldCipher,
    hash_password,
    verify_password,
)
from views.api_views import (  # noqa: E402
    api_crear_inventario,
    api_health,
    api_listar_inventario,
    registrar_avance_obra,
)
from views.auth_service_view import create_server  # noqa: E402


def http_json(url: str, method: str = "GET", payload: dict | None = None):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        return err.code, json.loads(err.read().decode("utf-8"))


def imprimir_titulo(texto: str) -> None:
    print(f"\n{'=' * 70}\n{texto}\n{'=' * 70}")


def main() -> None:
    factory = RequestFactory()

    imprimir_titulo("1. HASH DE CLAVES (BCRYPT COST FACTOR 12)")
    clave = "ClaveFyag2026#"
    hashed = hash_password(clave)
    print("Hash generado:", hashed)
    print("Verificación clave correcta:", verify_password(clave, hashed))
    print("Verificación clave incorrecta:", verify_password("ClaveMala", hashed))
    assert hashed.startswith("$2b$12$")
    assert verify_password(clave, hashed) is True
    assert verify_password("ClaveMala", hashed) is False

    imprimir_titulo("2. CIFRADO DE DATOS SENSIBLES (AES-256-GCM)")
    aes_key = base64.b64encode(os.urandom(32)).decode("utf-8")
    cipher = AES256FieldCipher(aes_key)
    dato_sensible = "RUT: 12.345.678-9 | Cuenta: 00112233"
    cifrado_1 = cipher.encrypt(dato_sensible)
    cifrado_2 = cipher.encrypt(dato_sensible)
    descifrado = cipher.decrypt(cifrado_1)
    print("Texto original:", dato_sensible)
    print("Cifrado 1:", cifrado_1[:40] + "...")
    print("Cifrado 2:", cifrado_2[:40] + "...")
    print("Nonces distintos (cifrado !=):", cifrado_1 != cifrado_2)
    print("Descifrado OK:", descifrado == dato_sensible)
    assert cifrado_1 != cifrado_2
    assert descifrado == dato_sensible

    imprimir_titulo("3. ARQUITECTURA MVC / CAPAS Y AUTORIZACIÓN RBAC")
    r_health = api_health(factory.get("/api/v1/inventario/health/"))
    print("GET /api/v1/inventario/health/ ->", r_health.status_code, r_health.content.decode())
    assert r_health.status_code == 200

    r_401 = api_listar_inventario(factory.get("/api/v1/inventario/items/"))
    print("GET inventario sin JWT role ->", r_401.status_code, r_401.content.decode())
    assert r_401.status_code == 401

    req_fin_read = factory.get("/api/v1/inventario/items/")
    req_fin_read.jwt_role = "FINANZAS"
    r_fin_read = api_listar_inventario(req_fin_read)
    print("GET inventario rol FINANZAS ->", r_fin_read.status_code)
    assert r_fin_read.status_code == 200

    req_fin_create = factory.post(
        "/api/v1/inventario/items/crear/",
        data=json.dumps({"sku": "INS-901", "nombre": "Valvula", "stock": 5}),
        content_type="application/json",
    )
    req_fin_create.jwt_role = "FINANZAS"
    r_fin_create = api_crear_inventario(req_fin_create)
    print("POST inventario rol FINANZAS ->", r_fin_create.status_code, r_fin_create.content.decode())
    assert r_fin_create.status_code == 403

    req_obra = factory.post(
        "/api/v1/obras/avance/",
        data=json.dumps(
            {
                "codigo_obra": "OBRA-408",
                "observacion": "<b>Montaje completado</b>",
                "porcentaje_avance": 100,
            }
        ),
        content_type="application/json",
    )
    req_obra.jwt_role = "SUPERVISOR_OBRAS"
    r_obra = registrar_avance_obra(req_obra)
    print("POST avance obra SUPERVISOR_OBRAS ->", r_obra.status_code, r_obra.content.decode())
    assert r_obra.status_code == 201
    assert _MEM_OBRAS["OBRA-408"]["estado"] == "COMPLETADA"

    imprimir_titulo("4. SANITIZACIÓN XSS / ENTRADAS MALICIOSAS")
    req_xss = factory.post(
        "/api/v1/inventario/items/crear/",
        data=json.dumps(
            {
                "sku": "INS-902",
                "nombre": "<script>alert('xss')</script>Compresor ' OR 1=1 --",
                "stock": 8,
                "ubicacion": "Camara 2",
            }
        ),
        content_type="application/json",
    )
    req_xss.jwt_role = "BODEGUERO"
    r_xss = api_crear_inventario(req_xss)
    body_xss = json.loads(r_xss.content.decode())
    print("POST item con <script> ->", r_xss.status_code, body_xss)
    assert r_xss.status_code == 201
    assert "<script>" not in body_xss["item"]["nombre"]
    assert "INS-902" in _MEM_INVENTARIO

    imprimir_titulo("5. MICROSERVICIO AUTH IAM + JWT + LISTA NEGRA DISPOSITIVO")
    port = 8011
    server = create_server("127.0.0.1", port)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.2)
    base_url = f"http://127.0.0.1:{port}"

    try:
        st_h, res_h = http_json(f"{base_url}/health")
        print("GET /health microservicio ->", st_h, res_h)
        assert st_h == 200

        st_login, tokens = http_json(
            f"{base_url}/auth/login",
            method="POST",
            payload={
                "email": "finanzas@fyag.cl",
                "password": "ClaveFyag2026#",
                "device_id": "celular_carlos_01",
            },
        )
        print("POST /auth/login (credenciales OK) ->", st_login, list(tokens.keys()))
        assert st_login == 200

        old_refresh = tokens["refresh_token"]
        st_rot, rotated = http_json(
            f"{base_url}/auth/refresh",
            method="POST",
            payload={"refresh_token": old_refresh},
        )
        print("POST /auth/refresh (rotación OK) ->", st_rot, list(rotated.keys()))
        assert st_rot == 200

        st_rep, res_rep = http_json(
            f"{base_url}/auth/refresh",
            method="POST",
            payload={"refresh_token": old_refresh},
        )
        print("POST /auth/refresh (replay blocked) ->", st_rep, res_rep)
        assert st_rep == 401

        _, tokens_movil = http_json(
            f"{base_url}/auth/login",
            method="POST",
            payload={
                "email": "supervisor@fyag.cl",
                "password": "ObraFyag2026#",
                "device_id": "celular_extraviado_99",
            },
        )
        st_rev, res_rev = http_json(
            f"{base_url}/auth/revoke-device",
            method="POST",
            payload={
                "user_id": "usr_sup_02",
                "device_id": "celular_extraviado_99",
            },
        )
        print("POST /auth/revoke-device ->", st_rev, res_rev)
        assert st_rev == 200

        st_blk_login, res_blk_login = http_json(
            f"{base_url}/auth/login",
            method="POST",
            payload={
                "email": "supervisor@fyag.cl",
                "password": "ObraFyag2026#",
                "device_id": "celular_extraviado_99",
            },
        )
        st_blk_ref, res_blk_ref = http_json(
            f"{base_url}/auth/refresh",
            method="POST",
            payload={"refresh_token": tokens_movil["refresh_token"]},
        )
        print("Login con dispositivo en lista negra ->", st_blk_login, res_blk_login)
        print("Refresh con dispositivo en lista negra ->", st_blk_ref, res_blk_ref)
        assert st_blk_login == 401
        assert st_blk_ref == 401
    finally:
        server.shutdown()
        server.server_close()

    print(f"\n{'=' * 70}\nTODAS LAS EVIDENCIAS VERIFICADAS EXITOSAMENTE (OK)\n{'=' * 70}")


if __name__ == "__main__":
    main()
