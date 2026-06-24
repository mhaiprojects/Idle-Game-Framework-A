"""Content pack and bundle validation (no browser)."""
from tests.automation.content_validator import (
    validate_all_content,
    validate_bundles,
    load_registry,
)


def test_registry_lists_games():
    registry = load_registry()
    assert registry.get("defaultContentId")
    assert len(registry.get("games", [])) >= 2


def test_all_content_packs_valid():
    results = validate_all_content()
    failures = {gid: errs for gid, errs in results.items() if errs}
    assert not failures, f"Content validation failed: {failures}"


def test_bundles_present():
    errors = validate_bundles()
    assert not errors, errors
