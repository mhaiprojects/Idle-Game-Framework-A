"""Pytest fixtures for browser E2E tests."""
from __future__ import annotations

import os
import socket
import subprocess
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
VENV_PYTHON = ROOT / ".venv-test" / "bin" / "python3"
SERVE_SCRIPT = ROOT / "scripts" / "serve.py"


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="session")
def game_server():
    port = int(os.environ.get("AFK_TEST_PORT", _free_port()))
    host = os.environ.get("AFK_TEST_HOST", "127.0.0.1")
    python = str(VENV_PYTHON if VENV_PYTHON.exists() else "python3")
    proc = subprocess.Popen(
        [python, str(SERVE_SCRIPT), "--host", host, "--port", str(port), "--no-cache"],
        cwd=str(ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    base_url = f"http://{host}:{port}"
    deadline = time.time() + 15
    while time.time() < deadline:
        try:
            import urllib.request
            urllib.request.urlopen(f"{base_url}/index.html", timeout=1)
            break
        except Exception:
            if proc.poll() is not None:
                err = proc.stderr.read() if proc.stderr else ""
                raise RuntimeError(f"Game server failed to start:\n{err}")
            time.sleep(0.2)
    else:
        proc.kill()
        raise RuntimeError("Game server did not become ready in time")

    yield base_url
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


@pytest.fixture
def clean_game(page, game_server):
    """Fresh localStorage before each test."""
    page.add_init_script("localStorage.clear(); sessionStorage.clear();")
    return game_server


@pytest.fixture
def game_page(page, clean_game):
    url = clean_game
    page.goto(f"{url}/index.html?automation=1", wait_until="networkidle")
    page.wait_for_function("() => window.__AFK_TEST__?.ready === true", timeout=15000)
    return page
