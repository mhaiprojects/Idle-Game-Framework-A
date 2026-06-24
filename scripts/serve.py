#!/usr/bin/env python3
"""Serve Cosmic Time Factory over HTTP for local play and development."""
from __future__ import annotations

import argparse
import os
import sys
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765


class GameHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Static file handler rooted at the project directory."""

    def __init__(self, *args, directory: str | None = None, no_cache: bool = False, **kwargs):
        self.no_cache = no_cache
        super().__init__(*args, directory=directory or ROOT, **kwargs)

    def end_headers(self) -> None:
        if self.no_cache:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write(f"[{self.log_date_time_string()}] {self.address_string()} {fmt % args}\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a local HTTP server for Cosmic Time Factory."
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("AFK_SERVE_HOST", DEFAULT_HOST),
        help=f"Bind address (default: {DEFAULT_HOST}, env: AFK_SERVE_HOST)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("AFK_SERVE_PORT", DEFAULT_PORT)),
        help=f"TCP port (default: {DEFAULT_PORT}, env: AFK_SERVE_PORT)",
    )
    parser.add_argument(
        "--open",
        action="store_true",
        help="Open the game in your default browser after the server starts",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Send no-cache headers (useful while editing assets)",
    )
    return parser.parse_args()


def build_url(host: str, port: int) -> str:
    display_host = host if host not in ("0.0.0.0", "::") else "localhost"
    if ":" in display_host and not display_host.startswith("["):
        display_host = f"[{display_host}]"
    return f"http://{display_host}:{port}/"


def main() -> int:
    args = parse_args()
    os.chdir(ROOT)

    handler = partial(
        GameHTTPRequestHandler,
        directory=ROOT,
        no_cache=args.no_cache,
    )
    server = ThreadingHTTPServer((args.host, args.port), handler)

    url = build_url(args.host, server.server_port)
    print("Cosmic Time Factory — local HTTP server")
    print(f"  Root:   {ROOT}")
    print(f"  URL:    {url}")
    print(f"  Listen: {args.host}:{server.server_port}")
    print("Press Ctrl+C to stop.\n")

    if args.open:
        webbrowser.open(url)

    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        print("\nShutting down.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
