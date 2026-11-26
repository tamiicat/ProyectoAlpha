"""Capa Vista (MVC): Servidor HTTP del microservicio Auth IAM."""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, Optional

import django
import jwt
from django.apps import apps

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
if not apps.ready:
    try:
        django.setup()
    except Exception:
        pass

from models.seguridad_model import JWTManager, hash_password, verify_password

ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get(
        "CORS_ALLOWED_ORIGINS",
        "https://proyecto-alpha-fyag.vercel.app,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
}

DEMO_USERS: Dict[str, Dict[str, Any]] = {
    "admin@fyag.cl": {
        "user_id": "usr_adm_01",
        "id_usuario": 1,
        "usuario": "admin",
        "nombres": "Admin",
        "apellidos": "TI",
        "correo_electronico": "admin@fyag.cl",
        "role": "ADMIN_TI",
        "exento_autorizacion": True,
        "puede_autorizar": True,
        "password_hash": hash_password("AdminFyag2026#"),
    },
    "bodeguero@fyag.cl": {
        "user_id": "usr_bod_01",
        "id_usuario": 2,
        "usuario": "bodeguero",
        "nombres": "Bodeguero",
        "apellidos": "Central",
        "correo_electronico": "bodeguero@fyag.cl",
        "role": "BODEGUERO",
        "exento_autorizacion": False,
        "puede_autorizar": False,
        "password_hash": hash_password("BodegaFyag2026#"),
    },
    "tecnico@fyag.cl": {
        "user_id": "usr_tec_01",
        "id_usuario": 3,
        "usuario": "tecnico",
        "nombres": "Técnico",
        "apellidos": "Terreno",
        "correo_electronico": "tecnico@fyag.cl",
        "role": "TECNICO",
        "exento_autorizacion": False,
        "puede_autorizar": False,
        "password_hash": hash_password("TecnicoFyag2026#"),
    },
    "finanzas@fyag.cl": {
        "user_id": "usr_fin_01",
        "id_usuario": 4,
        "usuario": "finanzas",
        "nombres": "Finanzas",
        "apellidos": "FYAG",
        "correo_electronico": "finanzas@fyag.cl",
        "role": "FINANZAS",
        "exento_autorizacion": False,
        "puede_autorizar": False,
        "password_hash": hash_password("ClaveFyag2026#"),
    },
    "supervisor@fyag.cl": {
        "user_id": "usr_sup_02",
        "id_usuario": 5,
        "usuario": "supervisor",
        "nombres": "Supervisor",
        "apellidos": "Obras",
        "correo_electronico": "supervisor@fyag.cl",
        "role": "SUPERVISOR_OBRAS",
        "exento_autorizacion": False,
        "puede_autorizar": True,
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


def _buscar_usuario_modelo_relacional(identificador: str) -> Optional[Dict[str, Any]]:
    """Intenta autenticar contra las tablas 'usuario' y 'rol' si Django/BD está disponible."""
    if not identificador:
        return None
    try:
        from django.db import connection

        if not apps.ready:
            return None

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.id_usuario, u.nombres, u.apellidos, u.correo_electronico,
                       u.usuario, u.password_hash, r.nombre,
                       r.exento_autorizacion, r.puede_autorizar
                FROM usuario u
                JOIN rol r ON r.id_rol = u.id_rol
                WHERE u.activo = TRUE
                  AND r.activo = TRUE
                  AND (LOWER(u.correo_electronico) = LOWER(%s) OR LOWER(u.usuario) = LOWER(%s))
                LIMIT 1;
                """,
                [identificador, identificador],
            )
            row = cursor.fetchone()
            if not row:
                return None

            return {
                "user_id": str(row[0]),
                "id_usuario": int(row[0]),
                "nombres": row[1],
                "apellidos": row[2],
                "correo_electronico": row[3],
                "usuario": row[4],
                "password_hash": row[5] or "",
                "role": (row[6] or "TECNICO").upper(),
                "exento_autorizacion": bool(row[7]),
                "puede_autorizar": bool(row[8]),
            }
    except Exception:
        return None


def _resolver_usuario_login(identificador: str) -> Optional[Dict[str, Any]]:
    """Busca primero en 'usuario'/'rol' del modelo relacional y luego en DEMO_USERS."""
    usuario_bd = _buscar_usuario_modelo_relacional(identificador)
    if usuario_bd:
        return usuario_bd

    if identificador in DEMO_USERS:
        return DEMO_USERS[identificador]

    for data in DEMO_USERS.values():
        if data.get("usuario", "").lower() == identificador.lower():
            return data

    return None


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

        def _set_cors_headers(self) -> None:
            origin = self.headers.get("Origin", "")
            if origin in ALLOWED_ORIGINS:
                self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
            self.send_header(
                "Access-Control-Allow-Headers", "Content-Type, Authorization"
            )
            self.send_header("Vary", "Origin")

        def _send_json(
            self, status_code: int, payload: Dict[str, Any]
        ) -> None:
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status_code)
            self._set_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self) -> None:
            self.send_response(204)
            self._set_cors_headers()
            self.send_header("Content-Length", "0")
            self.end_headers()

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
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                self._send_json(400, {"error": "JSON inválido."})
                return

            if self.path == "/auth/login":
                identificador = str(
                    data.get("email")
                    or data.get("correo_electronico")
                    or data.get("usuario")
                    or ""
                ).strip()
                password = data.get("password", "")
                device_id = data.get("device_id", "web_default")

                if store.exists(f"blacklist:device:{device_id}"):
                    self._send_json(
                        401, {"error": "Dispositivo revocado o extraviado."}
                    )
                    return

                user = _resolver_usuario_login(identificador)
                password_ok = False
                if user and user.get("password_hash"):
                    try:
                        password_ok = verify_password(
                            password, user["password_hash"]
                        )
                    except Exception:
                        password_ok = False

                if not user or not password_ok:
                    self._send_json(401, {"error": "Credenciales inválidas."})
                    return

                tokens = jwt_manager.issue_token_pair(
                    user["user_id"], user["role"], device_id
                )
                self._send_json(
                    200,
                    {
                        **tokens,
                        "user": {
                            "id_usuario": user.get("id_usuario"),
                            "usuario": user.get("usuario"),
                            "nombres": user.get("nombres"),
                            "apellidos": user.get("apellidos"),
                            "correo_electronico": user.get("correo_electronico"),
                            "rol": user["role"],
                            "exento_autorizacion": user.get(
                                "exento_autorizacion", False
                            ),
                            "puede_autorizar": user.get(
                                "puede_autorizar", False
                            ),
                        },
                    },
                )
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