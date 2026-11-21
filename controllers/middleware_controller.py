"""Capa Controlador (MVC): Middleware JWT para extraer rol e identidad."""

import jwt
from django.conf import settings


class JWTAuthMiddleware:
    """Decodifica el token Bearer del frontend (si existe) y adjunta request.jwt_role."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            try:
                secret = getattr(
                    settings,
                    "JWT_SECRET_KEY",
                    "clave-secreta-proyecto-alpha-fyag-2026-32bytes!",
                )
                payload = jwt.decode(token, secret, algorithms=["HS256"])
                request.jwt_role = payload.get("role")
                request.jwt_user_id = payload.get("sub")
            except jwt.PyJWTError:
                request.jwt_role = None
        return self.get_response(request)
