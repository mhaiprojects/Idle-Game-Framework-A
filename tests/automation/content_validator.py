"""Shared validation logic for content packs and bundles."""
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
    errors = []
    gens = cfg["generators"]["generators"]
    primary = next(
        (r["codeName"] for r in cfg["resources"]["resources"] if r.get("isPrimary")),
        None,
    )
    for i in range(len(gens) - 1):
        current = gens[i]
        nxt = gens[i + 1]
        produces = [p["resource"] for p in current.get("produces", [])]
        next_costs = [c["resource"] for c in nxt.get("costResources", [])]
        conds = nxt.get("unlockConditions") or {}
        next_held = [
            c["resource"]
            for c in (conds.get("conditions") or [])
            if c.get("type") == "resourceHeld"
        ]
        needed = list(dict.fromkeys(next_costs + next_held))
        for res in needed:
            if res == primary:
                continue
            if res not in produces:
                errors.append(
                    f"{current['codeName']} does not produce {res} for {nxt['codeName']}"
                )
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


def validate_all_content() -> dict[str, list[str]]:
    registry = load_registry()
    results = {}
    for game in registry["games"]:
        results[game["id"]] = validate_content_pack(game["id"])
    return results


def validate_bundles() -> list[str]:
    errors = []
    bundle_path = ROOT / "js" / "config-bundle.js"
    if not bundle_path.exists():
        return ["js/config-bundle.js missing — run scripts/bundle-for-file-protocol.py"]

    text = bundle_path.read_text()
    if "window.AFK_CONTENT" not in text:
        errors.append("config-bundle.js missing window.AFK_CONTENT")

    registry = load_registry()
    for game in registry["games"]:
        gid = game["id"]
        if f'"{gid}"' not in text and f"'{gid}'" not in text:
            errors.append(f"config-bundle.js missing content pack {gid}")

    for name in ("afk-engine.bundle.js", "afk-ui.bundle.js"):
        if not (ROOT / "js" / name).exists():
            errors.append(f"js/{name} missing")

    return errors
