#!/usr/bin/env python3
"""Serve the AFK game engine over HTTP for local play and development."""
from __future__ import annotations

import argparse
import os
import sys
import urllib.error
import urllib.request
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
MAX_PORT_ATTEMPTS = 10
PROBE_TIMEOUT_S = 1.5


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


class GameHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a local HTTP server for the AFK idle game engine."
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
        help=f"Starting TCP port (default: {DEFAULT_PORT}, use 0 for OS-assigned, env: AFK_SERVE_PORT)",
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


def probe_host(host: str) -> str:
    """Host used for HTTP probes (connect to localhost when binding all interfaces)."""
    if host in ("0.0.0.0", "::", ""):
        return "127.0.0.1"
    if host.startswith("::ffff:"):
        return host.split("::ffff:", 1)[1]
    return host


def build_base_url(host: str, port: int) -> str:
    display_host = host if host not in ("0.0.0.0", "::") else "localhost"
    if ":" in display_host and not display_host.startswith("["):
        display_host = f"[{display_host}]"
    return f"http://{display_host}:{port}/"


def build_game_url(host: str, port: int) -> str:
    return f"{build_base_url(host, port)}index.html"


def is_game_served(host: str, port: int) -> bool:
    """Return True when something on this port is serving this project's game."""
    probe = probe_host(host)
    index_url = f"http://{probe}:{port}/index.html"
    try:
        req = urllib.request.Request(index_url, headers={"User-Agent": "afk-serve-probe/1"})
        with urllib.request.urlopen(req, timeout=PROBE_TIMEOUT_S) as resp:
            if resp.status != 200:
                return False
            body = resp.read(16384)
            if b'js/main.js' not in body or b'id="app"' not in body:
                return False
    except (urllib.error.URLError, TimeoutError, OSError):
        return False

    registry_url = f"http://{probe}:{port}/content/registry.json"
    try:
        req = urllib.request.Request(registry_url, headers={"User-Agent": "afk-serve-probe/1"})
        with urllib.request.urlopen(req, timeout=PROBE_TIMEOUT_S) as resp:
            if resp.status != 200:
                return False
            body = resp.read(4096)
            return b'"defaultContentId"' in body and b'"games"' in body
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def resolve_server(
    host: str,
    start_port: int,
    handler,
) -> tuple[GameHTTPServer | None, int, bool]:
    """
    Find a port to use. Returns (server, port, already_running).
    server is None when the game is already being served on that port.
    """
    if start_port == 0:
        server = GameHTTPServer((host, 0), handler)
        return server, server.server_port, False

    last_port = start_port + MAX_PORT_ATTEMPTS - 1
    for offset in range(MAX_PORT_ATTEMPTS):
        port = start_port + offset

        if is_game_served(host, port):
            return None, port, True

        try:
            server = GameHTTPServer((host, port), handler)
            if offset > 0:
                print(
                    f"Port {start_port} in use by another app — started on {port}.",
                    file=sys.stderr,
                )
            return server, port, False
        except OSError as exc:
            if exc.errno in (98, 48):  # EADDRINUSE
                continue
            raise

    print(
        f"Error: could not bind ports {start_port}–{last_port} "
        f"({MAX_PORT_ATTEMPTS} attempts).\n"
        "Each port is either in use by another application or unreachable.\n"
        f"Try:  python3 scripts/serve.py --port {last_port + 1}",
        file=sys.stderr,
    )
    raise SystemExit(1)


def main() -> int:
    args = parse_args()
    os.chdir(ROOT)

    handler = partial(
        GameHTTPRequestHandler,
        directory=ROOT,
        no_cache=args.no_cache,
    )
    server, bound_port, already_running = resolve_server(args.host, args.port, handler)
    game_url = build_game_url(args.host, bound_port)

    if already_running:
        print("AFK Game Engine — already running")
        print(f"  {game_url}")
        if args.open:
            webbrowser.open(game_url)
        return 0

    print("AFK Game Engine — local HTTP server")
    print(f"  Root: {ROOT}")
    print(f"  {game_url}")
    print(f"  Listen: {args.host}:{bound_port}")
    print("Press Ctrl+C to stop.\n")

    if args.open:
        webbrowser.open(game_url)

    assert server is not None
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        print("\nShutting down.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
