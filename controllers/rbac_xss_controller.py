"""Capa Controlador (MVC): Reglas RBAC y sanitización XSS."""

import re
from functools import wraps
from typing import Any, Callable, Dict, Set

import bleach
from django.http import JsonResponse

RBAC_MATRIX: Dict[str, Dict[str, Set[str]]] = {
    "FINANZAS": {
        "finanzas_costos": {"C", "R", "U", "D"},
        "inventario_bodega": {"R"},
        "obras_mantencion": {"R"},
        "usuarios_roles": set(),
    },
    "SUPERVISOR_OBRAS": {
        "obras_mantencion": {"C", "R", "U", "D"},
        "inventario_bodega": {"C", "R", "U"},
        "finanzas_costos": set(),
        "usuarios_roles": set(),
    },
    "BODEGUERO": {
        "inventario_bodega": {"C", "R", "U"},
        "obras_mantencion": {"R"},
        "finanzas_costos": set(),
        "usuarios_roles": set(),
    },
    "ADMIN_TI": {
        "finanzas_costos": {"C", "R", "U", "D"},
        "inventario_bodega": {"C", "R", "U", "D"},
        "obras_mantencion": {"C", "R", "U", "D"},
        "usuarios_roles": {"C", "R", "U", "D"},
    },
}


def sanitize_text_input(raw_text: str) -> str:
    """Limpia etiquetas o scripts peligrosos (prevención XSS)."""
    if not raw_text:
        return ""
    without_scripts = re.sub(
        r"<script\b[^>]*>.*?</script>",
        "",
        raw_text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return bleach.clean(
        without_scripts,
        tags=["b", "i", "u", "p", "br"],
        attributes={},
        strip=True,
    )


def require_rbac(module: str, action: str) -> Callable:
    """Decorador que verifica rol y permiso CRUD según RBAC_MATRIX."""

    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        def _wrapped(request: Any, *args: Any, **kwargs: Any) -> JsonResponse:
            role = getattr(request, "jwt_role", None)
            if not role:
                return JsonResponse(
                    {"error": "No autenticado: falta rol JWT."}, status=401
                )
            allowed = RBAC_MATRIX.get(role, {}).get(module, set())
            if action not in allowed:
                return JsonResponse(
                    {
                        "error": (
                            f"Acceso denegado para rol '{role}' en "
                            f"módulo '{module}' ({action})."
                        )
                    },
                    status=403,
                )
            return view_func(request, *args, **kwargs)

        return _wrapped

    return decorator
