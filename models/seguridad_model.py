"""Capa Modelo (MVC): Seguridad transversal, JWT, cifrado AES-256, IAM y autorizaciones."""

import base64
import hashlib
import json
import os
import time
import urllib.error
import urllib.request
import uuid
from datetime import date
from typing import Any, Dict, List, Optional

import bcrypt
import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.db import connection, models, transaction


def hash_password(plain_password: str) -> str:
    """Genera hash bcrypt con factor de costo 12."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contrasena plana contra su hash bcrypt."""
    if not plain_password or not hashed_password:
        return False
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


class AES256FieldCipher:
    """Cifrado autenticado AES-256-GCM para datos sensibles."""

    def __init__(self, key_b64: str) -> None:
        raw_key = base64.b64decode(key_b64.encode("utf-8"))
        if len(raw_key) != 32:
            raise ValueError("La clave AES-256 debe tener 32 bytes.")
        self._key = raw_key
        self._aesgcm = AESGCM(self._key)

    def encrypt(self, plaintext: str) -> str:
        """Cifra texto y retorna nonce + ciphertext en base64."""
        nonce = os.urandom(12)
        ct = self._aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
        return base64.b64encode(nonce + ct).decode("utf-8")

    def decrypt(self, token_b64: str) -> str:
        """Descifra un payload base64 generado por encrypt."""
        raw = base64.b64decode(token_b64.encode("utf-8"))
        nonce = raw[:12]
        ct = raw[12:]
        pt = self._aesgcm.decrypt(nonce, ct, None)
        return pt.decode("utf-8")


class JWTManager:
    """Gestiona emision, rotacion y revocacion de tokens JWT."""

    def __init__(self, secret_key: str, redis_client: Any) -> None:
        self.secret_key = secret_key
        self.redis = redis_client

    def _hash_jti(self, jti: str) -> str:
        return hashlib.sha256(jti.encode("utf-8")).hexdigest()

    def issue_token_pair(
        self, user_id: str, role: str, device_id: str
    ) -> Dict[str, Any]:
        """Emite access_token y refresh_token asociados a un dispositivo."""
        now = int(time.time())
        access_jti = str(uuid.uuid4())
        refresh_jti = str(uuid.uuid4())

        access_payload = {
            "sub": user_id,
            "role": role,
            "device_id": device_id,
            "type": "access",
            "jti": access_jti,
            "iat": now,
            "exp": now + 900,
        }
        refresh_payload = {
            "sub": user_id,
            "role": role,
            "device_id": device_id,
            "type": "refresh",
            "jti": refresh_jti,
            "iat": now,
            "exp": now + 86400,
        }

        access_token = jwt.encode(
            access_payload, self.secret_key, algorithm="HS256"
        )
        refresh_token = jwt.encode(
            refresh_payload, self.secret_key, algorithm="HS256"
        )

        self.redis.setex(
            f"refresh:{self._hash_jti(refresh_jti)}", 86400, "active"
        )
        self.redis.setex(
            f"device_refresh:{user_id}:{device_id}", 86400, refresh_jti
        )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": 900,
        }

    def rotate_refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Rota un refresh_token y detecta reuso o replay attacks."""
        payload = jwt.decode(
            refresh_token, self.secret_key, algorithms=["HS256"]
        )
        if payload.get("type") != "refresh":
            raise jwt.InvalidTokenError("Tipo de token invalido.")

        user_id = payload["sub"]
        role = payload["role"]
        device_id = payload["device_id"]
        jti = payload["jti"]

        if self.redis.exists(f"blacklist:device:{device_id}"):
            raise jwt.InvalidTokenError("Dispositivo revocado o extraviado.")

        jti_hash = self._hash_jti(jti)
        if self.redis.exists(f"blacklist:jti:{jti_hash}"):
            self.redis.setex(f"blacklist:device:{device_id}", 86400, "replay")
            raise jwt.InvalidTokenError(
                "Refresh token reutilizado; sesion bloqueada."
            )

        self.redis.setex(f"blacklist:jti:{jti_hash}", 86400, "used")
        return self.issue_token_pair(user_id, role, device_id)

    def revoke_device(self, user_id: str, device_id: str) -> None:
        """Marca un dispositivo como extraviado/robado y revoca su refresh."""
        self.redis.setex(f"blacklist:device:{device_id}", 86400, "lost")
        active_jti = self.redis.get(f"device_refresh:{user_id}:{device_id}")
        if active_jti:
            if isinstance(active_jti, bytes):
                active_jti = active_jti.decode("utf-8")
            self.redis.setex(
                f"blacklist:jti:{self._hash_jti(active_jti)}", 86400, "revoked"
            )


class AuthServiceClient:
    """Cliente REST hacia el microservicio de autenticación."""

    def __init__(self, base_url: str = "http://127.0.0.1:8001") -> None:
        self.base_url = base_url.rstrip("/")

    def _post(self, path: str, body_dict: Dict[str, Any]) -> Dict[str, Any]:
        payload = json.dumps(body_dict).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}{path}",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=3) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8")
            raise RuntimeError(f"Error {exc.code} en Auth Service: {detail}")

    def login(
        self, email: str, password: str, device_id: str = "web_default"
    ) -> Dict[str, Any]:
        return self._post(
            "/auth/login",
            {"email": email, "password": password, "device_id": device_id},
        )

    def revoke_device(self, user_id: str, device_id: str) -> Dict[str, Any]:
        return self._post(
            "/auth/revoke-device",
            {"user_id": user_id, "device_id": device_id},
        )


# ==============================================================================
# MODELOS Y REGLAS DE SEGURIDAD / AUTORIZACIÓN (MODELO RELACIONAL PROYECTO ALPHA)
# ==============================================================================


class Rol(models.Model):
    """Mapea la tabla 'rol' del Modelo Relacional."""

    id_rol = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=25)
    descripcion = models.CharField(max_length=200, blank=True, null=True)
    exento_autorizacion = models.BooleanField(default=False)
    puede_autorizar = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        app_label = "models"
        db_table = "rol"
        managed = False

    def __str__(self) -> str:
        return self.nombre


class Usuario(models.Model):
    """Mapea la tabla 'usuario' del Modelo Relacional."""

    id_usuario = models.AutoField(primary_key=True)
    id_rol = models.IntegerField()
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    rut = models.CharField(max_length=12)
    correo_electronico = models.CharField(max_length=100)
    telefono = models.CharField(max_length=9, blank=True, null=True)
    usuario = models.CharField(max_length=100)
    password_hash = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)

    class Meta:
        app_label = "models"
        db_table = "usuario"
        managed = False

    def __str__(self) -> str:
        return f"{self.nombres} {self.apellidos} ({self.usuario})"


def obtener_permisos_rol_usuario(id_usuario: int) -> Dict[str, Any]:
    """Consulta 'exento_autorizacion' y 'puede_autorizar' del rol asociado a 'id_usuario'."""
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT r.id_rol, r.nombre, r.exento_autorizacion, r.puede_autorizar
                FROM usuario u
                JOIN rol r ON r.id_rol = u.id_rol
                WHERE u.id_usuario = %s AND u.activo = TRUE AND r.activo = TRUE
                LIMIT 1;
                """,
                [id_usuario],
            )
            row = cursor.fetchone()
            if row:
                return {
                    "id_rol": int(row[0]),
                    "rol": row[1],
                    "exento_autorizacion": bool(row[2]),
                    "puede_autorizar": bool(row[3]),
                }
    except Exception:
        pass
    return {
        "id_rol": None,
        "rol": None,
        "exento_autorizacion": False,
        "puede_autorizar": False,
    }


def usuario_esta_exento_autorizacion(id_usuario: int) -> bool:
    """Indica si el usuario puede ejecutar acciones críticas sin autorización previa."""
    perms = obtener_permisos_rol_usuario(id_usuario)
    return bool(perms["exento_autorizacion"])


def usuario_puede_autorizar(id_usuario: int) -> bool:
    """Indica si el usuario tiene facultad para aprobar o rechazar autorizaciones."""
    perms = obtener_permisos_rol_usuario(id_usuario)
    return bool(perms["puede_autorizar"])


def registrar_solicitud_autorizacion(
    id_solicitante: int,
    tabla_afectada: str,
    accion: str,
    motivo: str,
    justificacion: str,
    datos_propuestos: Dict[str, Any],
    id_movimiento: Optional[int] = None,
    id_autorizador: Optional[int] = None,
) -> Dict[str, Any]:
    """Registra una solicitud en 'autorizacion' ('modificar' o 'eliminar')."""
    accion_norm = accion.strip().lower()
    if accion_norm not in ("modificar", "eliminar"):
        raise ValueError("La acción de autorización debe ser 'modificar' o 'eliminar'.")

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO autorizacion (
                    id_movimiento, id_solicitante, id_autorizador, tabla_afectada,
                    accion, motivo, justificacion, datos_propuestos,
                    estado, ejecutada, fecha_solicitud
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, 'pendiente', FALSE, %s)
                RETURNING id_autorizacion, estado, fecha_solicitud;
                """,
                [
                    id_movimiento,
                    id_solicitante,
                    id_autorizador,
                    tabla_afectada[:50],
                    accion_norm,
                    motivo[:150],
                    justificacion[:500],
                    json.dumps(datos_propuestos),
                    date.today(),
                ],
            )
            row = cursor.fetchone()

    return {
        "id_autorizacion": int(row[0]),
        "estado": row[1],
        "fecha_solicitud": str(row[2]),
        "requiere_autorizacion": True,
    }


def listar_autorizaciones_pendientes() -> List[Dict[str, Any]]:
    """Lista las solicitudes pendientes desde 'autorizacion'."""
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id_autorizacion, id_movimiento, id_solicitante, id_autorizador,
                       tabla_afectada, accion, motivo, justificacion,
                       datos_propuestos, estado, ejecutada, fecha_solicitud, fecha_resolucion
                FROM autorizacion
                WHERE estado = 'pendiente'
                ORDER BY id_autorizacion ASC;
                """
            )
            rows = cursor.fetchall()
            return [
                {
                    "id_autorizacion": r[0],
                    "id_movimiento": r[1],
                    "id_solicitante": r[2],
                    "id_autorizador": r[3],
                    "tabla_afectada": r[4],
                    "accion": r[5],
                    "motivo": r[6],
                    "justificacion": r[7],
                    "datos_propuestos": r[8],
                    "estado": r[9],
                    "ejecutada": r[10],
                    "fecha_solicitud": str(r[11]) if r[11] else None,
                    "fecha_resolucion": str(r[12]) if r[12] else None,
                }
                for r in rows
            ]
    except Exception:
        return []


def resolver_autorizacion(
    id_autorizacion: int,
    id_autorizador: int,
    nuevo_estado: str,
    ejecutada: bool = False,
) -> Dict[str, Any]:
    """Aprueba ('aprobada') o rechaza ('rechazada') una autorización pendiente."""
    estado_norm = nuevo_estado.strip().lower()
    if estado_norm not in ("aprobada", "rechazada"):
        raise ValueError("El estado de resolución debe ser 'aprobada' o 'rechazada'.")

    if not usuario_puede_autorizar(id_autorizador):
        raise PermissionError("El usuario no tiene permiso 'puede_autorizar' en su rol.")

    marcar_ejecutada = bool(ejecutada) if estado_norm == "aprobada" else False

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE autorizacion
                SET id_autorizador = %s,
                    estado = %s,
                    ejecutada = %s,
                    fecha_resolucion = %s
                WHERE id_autorizacion = %s
                RETURNING id_autorizacion, estado, ejecutada, fecha_resolucion;
                """,
                [
                    id_autorizador,
                    estado_norm,
                    marcar_ejecutada,
                    date.today(),
                    id_autorizacion,
                ],
            )
            row = cursor.fetchone()
            if not row:
                raise LookupError(f"Autorización #{id_autorizacion} no encontrada.")

    return {
        "id_autorizacion": int(row[0]),
        "estado": row[1],
        "ejecutada": bool(row[2]),
        "fecha_resolucion": str(row[3]),
    }