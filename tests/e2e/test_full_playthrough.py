"""Full playthrough tests — opt-in only (slow, exhaustive feature coverage)."""
from __future__ import annotations

import pytest

MAX_ATTEMPTS = 20

PLAYTHROUGH_OPTIONS = {
    "speed": 100,
    "maxRealMs": 120000,
    "fastForwardSeconds": 600,
}


def attach_playthrough_console(page) -> None:
    """Forward in-browser playthrough logs to pytest terminal output."""

    def on_console(msg):
        text = msg.text
        if "[AFK-PLAYTHROUGH]" in text or msg.type == "error":
            print(text, flush=True)

    page.on("console", on_console)


def print_playthrough_summary(content_id: str, attempt: int, result: dict) -> None:
    status = "COMPLETE" if result.get("complete") else result.get("reason", "unknown")
    print(
        f"\n=== {content_id} attempt {attempt}/{MAX_ATTEMPTS}: {status} "
        f"({result.get('durationMs', 0)}ms, {result.get('totalActions', 0)} actions, "
        f"{result.get('steps', 0)} steps) ===",
        flush=True,
    )
    coverage = result.get("coverage", {})
    systems = coverage.get("systems", {})
    print(
        f"  systems: tap={systems.get('tap')} gen={systems.get('generatorPurchase')} "
        f"upg={systems.get('upgradePurchase')} prestige={systems.get('prestige')} "
        f"ascension={systems.get('ascension')} tier={coverage.get('ascensionTierReached')}",
        flush=True,
    )
    missing = result.get("missing") or []
    if missing:
        preview = missing[:15]
        suffix = f" (+{len(missing) - 15} more)" if len(missing) > 15 else ""
        print(f"  missing ({len(missing)}): {preview}{suffix}", flush=True)


@pytest.mark.full_playthrough
@pytest.mark.parametrize("content_id", ["cosmic-time-factory", "dr-dirt"])
def test_full_playthrough_all_features(page, clean_game, content_id):
    """Simulate 100× gameplay and buy everything as it unlocks."""
    attach_playthrough_console(page)
    page.add_init_script(f'localStorage.setItem("afk_selected_content", "{content_id}");')
    page.goto(f"{clean_game}/index.html?automation=1", wait_until="networkidle")
    page.wait_for_function("() => window.__AFK_TEST__?.ready === true", timeout=15000)
    print(f"\n>>> Starting full playthrough: {content_id} @ 100x (up to {MAX_ATTEMPTS} attempts)", flush=True)

    last_result = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        if attempt > 1:
            print(f"\n--- Reload for attempt {attempt} ---", flush=True)
            page.reload(wait_until="networkidle")
            page.wait_for_function("() => window.__AFK_TEST__?.ready === true", timeout=15000)

        opts = {**PLAYTHROUGH_OPTIONS, "attempt": attempt}
        last_result = page.evaluate(
            """async (opts) => window.__AFK_TEST__.runFullPlaythrough(opts)""",
            opts,
        )
        print_playthrough_summary(content_id, attempt, last_result)

        if last_result.get("complete"):
            break

    assert last_result is not None, "playthrough returned no result"
    assert last_result.get("complete"), (
        f"{content_id} incomplete after {MAX_ATTEMPTS} attempts "
        f"(last reason={last_result.get('reason')}, missing={last_result.get('missing')})"
    )
    assert last_result.get("contentId") == content_id
    systems = last_result.get("coverage", {}).get("systems", {})
    assert systems.get("tap"), "tap not exercised"
    assert systems.get("generatorPurchase"), "generator purchase not exercised"
    assert systems.get("upgradePurchase"), "upgrade purchase not exercised"
    ui_tabs = systems.get("uiTabs") or {}
    assert ui_tabs.get("generators"), "generators tab not visited"
    logs = last_result.get("logs") or []
    assert any(entry.get("status") == "OK" for entry in logs), "expected OK log entries"
    print(f"\n>>> {content_id} full playthrough PASSED on attempt {last_result.get('attempt')}", flush=True)
