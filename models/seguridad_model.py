"""Capa Modelo (MVC): Seguridad transversal, JWT, cifrado AES-256 y cliente Auth IAM."""

import base64
import hashlib
import json
import os
import time
import urllib.error
import urllib.request
import uuid
from typing import Any, Dict

import bcrypt
import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


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
