"""Capa Vista (MVC): Servidor HTTP del microservicio Auth IAM."""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict

import jwt

from models.seguridad_model import JWTManager, hash_password, verify_password

DEMO_USERS: Dict[str, Dict[str, str]] = {
    "finanzas@fyag.cl": {
        "user_id": "usr_fin_01",
        "role": "FINANZAS",
        "password_hash": hash_password("ClaveFyag2026#"),
    },
    "supervisor@fyag.cl": {
        "user_id": "usr_sup_02",
        "role": "SUPERVISOR_OBRAS",
        "password_hash": hash_password("ObraFyag2026#"),
    },
}


class MemoryStore:
    """Almacén en memoria compatible con JWTManager para el microservicio."""

    def __init__(self) -> None:
        self.kv: Dict[str, str] = {}
        self.sets: Dict[str, set] = {}

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


def is_token_or_device_revoked(
    token: str, secret_key: str, redis_client: Any
) -> bool:
    """Verifica si el token, su jti o su device_id están en lista negra."""
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
    except jwt.PyJWTError:
        return True

    device_id = payload.get("device_id", "")
    jti = payload.get("jti", "")
    if device_id and redis_client.exists(f"blacklist:device:{device_id}"):
        return True
    if jti and redis_client.exists(f"blacklist:jti:{jti}"):
        return True
    return False


def build_handler(jwt_manager: JWTManager, store: MemoryStore):
    """Crea un manejador HTTP con acceso a JWTManager y lista negra."""

    class AuthMicroserviceHandler(BaseHTTPRequestHandler):
        """Manejador REST del microservicio de autenticación."""

        def _send_json(
            self, status_code: int, payload: Dict[str, Any]
        ) -> None:
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:
            if self.path == "/health":
                self._send_json(
                    200, {"service": "auth-iam-microservice", "status": "ok"}
                )
                return
            self._send_json(404, {"error": "Ruta no encontrada."})

        def do_POST(self) -> None:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8") if length else "{}"
            data = json.loads(raw)

            if self.path == "/auth/login":
                email = data.get("email", "")
                password = data.get("password", "")
                device_id = data.get("device_id", "web_default")
                if store.exists(f"blacklist:device:{device_id}"):
                    self._send_json(
                        401, {"error": "Dispositivo revocado o extraviado."}
                    )
                    return
                user = DEMO_USERS.get(email)
                if not user or not verify_password(
                    password, user["password_hash"]
                ):
                    self._send_json(401, {"error": "Credenciales inválidas."})
                    return
                tokens = jwt_manager.issue_token_pair(
                    user["user_id"], user["role"], device_id
                )
                self._send_json(200, tokens)
                return

            if self.path == "/auth/refresh":
                refresh_tok = data.get("refresh_token", "")
                if is_token_or_device_revoked(
                    refresh_tok, jwt_manager.secret_key, store
                ):
                    self._send_json(
                        401, {"error": "Token o dispositivo revocado."}
                    )
                    return
                try:
                    tokens = jwt_manager.rotate_refresh_token(refresh_tok)
                    self._send_json(200, tokens)
                except Exception as exc:
                    self._send_json(401, {"error": str(exc)})
                return

            if self.path == "/auth/revoke-device":
                user_id = data.get("user_id", "")
                device_id = data.get("device_id", "")
                if not user_id or not device_id:
                    self._send_json(
                        400,
                        {"error": "Se requieren user_id y device_id."},
                    )
                    return
                jwt_manager.revoke_device(user_id, device_id)
                self._send_json(
                    200,
                    {
                        "status": "revoked",
                        "user_id": user_id,
                        "device_id": device_id,
                    },
                )
                return

            self._send_json(404, {"error": "Ruta no encontrada."})

        def log_message(self, format: str, *args: Any) -> None:
            return

    return AuthMicroserviceHandler


def create_server(host: str = "127.0.0.1", port: int = 8001):
    """Instancia el servidor HTTP del microservicio IAM."""
    secret = os.environ.get(
        "JWT_SECRET_KEY", "clave-secreta-proyecto-alpha-fyag-2026-32bytes!"
    )
    store = MemoryStore()
    manager = JWTManager(secret_key=secret, redis_client=store)
    handler = build_handler(manager, store)
    return ThreadingHTTPServer((host, port), handler)


if __name__ == "__main__":
    srv_host = os.environ.get("AUTH_SERVICE_HOST", "127.0.0.1")
    srv_port = int(os.environ.get("AUTH_SERVICE_PORT", "8001"))
    server = create_server(srv_host, srv_port)
    print(f"Microservicio Auth IAM corriendo en http://{srv_host}:{srv_port}")
    server.serve_forever()
