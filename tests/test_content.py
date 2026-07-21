"""Content pack and runtime asset validation (no browser)."""
from tests.automation.content_validator import (
    validate_all_content,
    validate_registered_content,
    validate_runtime_assets,
    load_registry,
)


def test_registry_lists_games():
    registry = load_registry()
    assert registry.get("defaultContentId") == "dr-dirt"
    assert len(registry.get("games", [])) >= 1


def test_registered_content_valid():
    results = validate_registered_content()
    failures = {gid: errs for gid, errs in results.items() if errs}
    assert not failures, f"Registered content validation failed: {failures}"


def test_all_content_folders_valid():
    results = validate_all_content()
    failures = {gid: errs for gid, errs in results.items() if errs}
    assert not failures, f"Content validation failed: {failures}"


def test_runtime_assets_present():
    errors = validate_runtime_assets()
    assert not errors, errors
