"""Pruebas del microservicio independiente Auth IAM - Proyecto Alpha (MVC)."""

import threading

import pytest

from models.seguridad_model import AuthServiceClient
from views.auth_service_view import create_server


def test_auth_microservice_login_and_lost_device_blacklist():
    server = create_server("127.0.0.1", 0)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        client = AuthServiceClient(f"http://127.0.0.1:{port}")
        tokens = client.login(
            "supervisor@fyag.cl", "ObraFyag2026#", "cel_terreno_07"
        )
        assert "access_token" in tokens

        revoked = client.revoke_device("usr_sup_02", "cel_terreno_07")
        assert revoked["status"] == "revoked"

        with pytest.raises(RuntimeError, match="401"):
            client.login(
                "supervisor@fyag.cl", "ObraFyag2026#", "cel_terreno_07"
            )
    finally:
        server.shutdown()
        server.server_close()
