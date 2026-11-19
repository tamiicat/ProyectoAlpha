"""
Cliente HTTP desacoplado para consultar el microservicio Auth IAM.
Permite login y revocación de dispositivos extraviados/robados vía red.
"""

import json
import urllib.error
import urllib.request
from typing import Any, Dict


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
