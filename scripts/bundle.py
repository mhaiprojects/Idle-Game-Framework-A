#!/usr/bin/env python3
"""Validate content packs (generator chains, primary resource, tiers).

Python validation in tests/automation/content_validator.py is the source of truth.
Run via: python3 scripts/bundle.py
Or:      python3 scripts/test.py --content
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from tests.automation.content_validator import validate_all_content, validate_registered_content


def main() -> int:
    registered = validate_registered_content()
    all_packs = validate_all_content()

    failed = False
    for label, results in [('registered', registered), ('all content folders', all_packs)]:
        for content_id, errors in results.items():
            if errors:
                failed = True
                print(f'Validation FAILED ({content_id}, {label}):')
                for err in errors:
                    print(f'  {err}')
            else:
                print(f'Validation OK ({content_id}, {label})')

    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
