#!/usr/bin/env python3
"""
Run full test automation for the AFK game engine.

Usage:
  python3 scripts/test.py          # validate content + E2E tests
  python3 scripts/test.py --quick  # skip content validation
  python3 scripts/test.py --e2e    # browser tests only
  python3 scripts/test.py --full-playthrough  # exhaustive 100x sim (slow)

Agents: run this after config or engine changes to verify a working game.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VENV = ROOT / ".venv-test"
PY = VENV / "bin" / "python3"
PIP = VENV / "bin" / "pip"
PYTEST = VENV / "bin" / "pytest"


def run(cmd: list[str], **kwargs) -> int:
    print("+", " ".join(cmd), flush=True)
    return subprocess.call(cmd, cwd=str(ROOT), **kwargs)


def ensure_venv() -> None:
    if PY.exists():
        return
    print("Creating .venv-test …")
    if run([sys.executable, "-m", "venv", str(VENV)]) != 0:
        sys.exit(1)
    if run([str(PIP), "install", "-r", "requirements-test.txt"]) != 0:
        sys.exit(1)
    run([str(VENV / "bin" / "playwright"), "install", "chromium"])


def main() -> int:
    parser = argparse.ArgumentParser(description="AFK game test automation")
    parser.add_argument("--quick", action="store_true", help="Skip content validation")
    parser.add_argument("--e2e", action="store_true", help="Run browser E2E tests only")
    parser.add_argument("--content", action="store_true", help="Run content validation only")
    parser.add_argument(
        "--full-playthrough",
        action="store_true",
        help="Run exhaustive 100x playthrough tests (slow; not part of default suite)",
    )
    args = parser.parse_args()

    ensure_venv()

    if not args.e2e and not args.content and not args.quick:
        code = run([sys.executable, str(ROOT / "scripts" / "bundle.py")])
        if code != 0:
            return code

    if args.content:
        return run([str(PYTEST), "tests/test_content.py", "-v"])

    if args.full_playthrough:
        bundle = not args.quick
        if bundle:
            code = run([sys.executable, str(ROOT / "scripts" / "bundle.py")])
            if code != 0:
                return code
        return run([
            str(PYTEST),
            "tests/e2e/test_full_playthrough.py",
            "-v",
            "-m",
            "full_playthrough",
            "--override-ini=addopts=-ra --tb=short",
        ])

    if args.e2e:
        return run([str(PYTEST), "tests/e2e", "-v"])

    code = run([str(PYTEST), "tests/test_content.py", "-v"])
    if code != 0:
        return code
    return run([str(PYTEST), "tests/e2e", "-v"])


if __name__ == "__main__":
    raise SystemExit(main())
