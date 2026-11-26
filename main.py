"""Punto de entrada principal - Proyecto Alpha (Estructura MVC)."""

import argparse
import os
import sys


def run_django(args_list):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    from django.core.management import execute_from_command_line

    execute_from_command_line(["manage.py"] + args_list)


def run_auth_service(host: str, port: int):
    from views.auth_service_view import create_server

    server = create_server(host, port)
    print(f"Microservicio Auth IAM corriendo en http://{host}:{port}")
    server.serve_forever()


def main():
    parser = argparse.ArgumentParser(
        description="Punto de entrada de Proyecto Alpha (MVC)"
    )
    sub = parser.add_subparsers(dest="mode")

    srv = sub.add_parser("api", help="Inicia el servidor Django (por defecto runserver)")
    srv.add_argument("django_args", nargs="*", default=["runserver"])

    auth = sub.add_parser("auth", help="Inicia el microservicio Auth IAM")
    auth.add_argument("--host", default=os.environ.get("AUTH_SERVICE_HOST", "127.0.0.1"))
    auth.add_argument("--port", type=int, default=int(os.environ.get("AUTH_SERVICE_PORT", "8001")))

    args, unknown = parser.parse_known_args()
    if args.mode == "auth":
        run_auth_service(args.host, args.port)
    elif args.mode == "api":
        run_django(args.django_args + unknown)
    else:
        run_django(["runserver"] + unknown)


if __name__ == "__main__":
    main()
