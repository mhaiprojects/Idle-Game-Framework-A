"""Shared validation logic for content packs."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT_DIR = ROOT / "content"
REGISTRY_PATH = CONTENT_DIR / "registry.json"

CONFIG_NAMES = [
    "framework", "difficulty", "resources", "generators", "upgrades",
    "items", "artifacts", "characters", "achievements", "events",
    "drops", "ascension", "prestige", "defaults",
]


def load_registry() -> dict:
    return json.loads(REGISTRY_PATH.read_text())


def list_content_pack_ids() -> list[str]:
    ids = []
    for path in sorted(CONTENT_DIR.iterdir()):
        if path.is_dir() and (path / "manifest.json").exists():
            ids.append(path.name)
    return ids


def load_content_pack(content_id: str) -> dict:
    base = CONTENT_DIR / content_id
    pack = {}
    for name in CONFIG_NAMES:
        path = base / f"{name}.json"
        if not path.exists():
            raise FileNotFoundError(f"Missing {path}")
        pack[name] = json.loads(path.read_text())
    manifest = base / "manifest.json"
    if manifest.exists():
        pack["_manifest"] = json.loads(manifest.read_text())
    return pack


def validate_generator_chain(cfg: dict) -> list[str]:
    """Source-of-truth generator chain validation (also mirrored at runtime in ConfigManager.js)."""
    errors = []
    gens = cfg["generators"]["generators"]
    primary = next(
        (r["codeName"] for r in cfg["resources"]["resources"] if r.get("isPrimary")),
        None,
    )
    produced_so_far = {primary} if primary else set()

    for gen in gens:
        next_costs = [c["resource"] for c in gen.get("costResources", [])]
        conds = gen.get("unlockConditions") or {}
        next_held = [
            c["resource"]
            for c in (conds.get("conditions") or [])
            if c.get("type") == "resourceHeld"
        ]
        needed = list(dict.fromkeys(next_costs + next_held))
        for res in needed:
            if res == primary:
                continue
            if res not in produced_so_far:
                idx = gens.index(gen)
                prev = gens[idx - 1]["codeName"] if idx > 0 else "(start)"
                errors.append(
                    f"{prev} does not produce {res} for {gen['codeName']}"
                )
        for prod in gen.get("produces", []):
            produced_so_far.add(prod["resource"])
    return errors


def validate_content_pack(content_id: str) -> list[str]:
    errors = []
    try:
        pack = load_content_pack(content_id)
    except FileNotFoundError as e:
        return [str(e)]

    primary = [r for r in pack["resources"]["resources"] if r.get("isPrimary")]
    if len(primary) != 1:
        errors.append(f"{content_id}: expected exactly one primary resource, got {len(primary)}")

    errors.extend(validate_generator_chain(pack))

    manifest = pack.get("_manifest") or {}
    if manifest.get("id") and manifest["id"] != content_id:
        errors.append(f"{content_id}: manifest id mismatch ({manifest['id']})")

    tiers = pack.get("framework", {}).get("generatorTiers") or {}
    gen_codes = {g["codeName"] for g in pack["generators"]["generators"]}
    for tier, codes in tiers.items():
        for code in codes:
            if code not in gen_codes:
                errors.append(f"{content_id}: generatorTiers[{tier}] references unknown {code}")

    pdc = pack.get("difficulty", {}).get("prestigeDifficultyPerCount")
    if not isinstance(pdc, dict):
        errors.append(f"{content_id}: difficulty.prestigeDifficultyPerCount required")
    elif "costIncreasePerPrestige" not in pdc:
        errors.append(f"{content_id}: difficulty.prestigeDifficultyPerCount.costIncreasePerPrestige required")

    return errors


def validate_registered_content() -> dict[str, list[str]]:
    registry = load_registry()
    results = {}
    for game in registry["games"]:
        results[game["id"]] = validate_content_pack(game["id"])
    return results


def validate_all_content() -> dict[str, list[str]]:
    results = {}
    for content_id in list_content_pack_ids():
        results[content_id] = validate_content_pack(content_id)
    return results


def validate_runtime_assets() -> list[str]:
    errors = []
    required = [
        ROOT / "index.html",
        ROOT / "js" / "main.js",
        ROOT / "js" / "afk.js",
        ROOT / "content" / "registry.json",
    ]
    for path in required:
        if not path.exists():
            errors.append(f"{path.relative_to(ROOT)} missing")
    return errors
