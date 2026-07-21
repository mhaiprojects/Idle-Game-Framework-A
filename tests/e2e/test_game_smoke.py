"""End-to-end smoke tests via Playwright + in-browser test API."""
import pytest


@pytest.mark.parametrize("content_id", ["dr-dirt"])
def test_game_boots(page, clean_game, content_id):
    page.add_init_script(f'localStorage.setItem("afk_selected_content", "{content_id}");')
    page.goto(f"{clean_game}/index.html?automation=1", wait_until="networkidle")
    page.wait_for_function("() => window.__AFK_TEST__?.ready === true", timeout=15000)
    assert page.evaluate("() => window.__AFK_TEST__.getContentId()") == content_id
    title = page.title()
    assert title and title != "AFK Game Engine"


def test_tap_increases_primary(game_page):
    before = game_page.evaluate("() => window.__AFK_TEST__.getPrimary()")
    gain = game_page.evaluate("() => window.__AFK_TEST__.tap()")
    after = game_page.evaluate("() => window.__AFK_TEST__.getPrimary()")
    assert gain >= 1
    assert after > before


def test_buy_first_generator(game_page):
    code = game_page.evaluate("() => window.__AFK_TEST__.firstGeneratorCode()")
    game_page.evaluate("() => window.__AFK_TEST__.addPrimary(50000)")
    owned = game_page.evaluate(
        "(code) => window.__AFK_TEST__.buyGenerator(code)",
        code,
    )
    assert owned >= 1


def test_in_browser_selftest(game_page):
    results = game_page.evaluate("() => window.__AFK_TEST__.runSelfTest()")
    failed = [r for r in results if not r["ok"]]
    assert not failed, failed


def test_game_selector_switch(page, clean_game):
    page.goto(f"{clean_game}/index.html?automation=1", wait_until="networkidle")
    page.wait_for_function("() => window.__AFK_TEST__?.ready === true", timeout=15000)
    page.evaluate("() => window.__AFK_TEST__.setTab('gameSelector')")
    assert page.evaluate("() => window.__AFK_TEST__.activeTab()") == "gameSelector"
    games = page.evaluate("() => window.__AFK_TEST__.listGames()")
    assert "dr-dirt" in games
    page.evaluate("() => window.__AFK_TEST__.switchContent('dr-dirt')")
    page.wait_for_function(
        "() => window.__AFK_TEST__.getContentId() === 'dr-dirt'",
        timeout=15000,
    )
    assert page.evaluate("() => window.__AFK_TEST__.getPrimaryCode()") == "stone"


def test_reset_game_clears_progress(game_page):
    game_page.evaluate("() => window.__AFK_TEST__.addPrimary(50000)")
    assert game_page.evaluate("() => window.__AFK_TEST__.getPrimary()") >= 50000
    game_page.once("dialog", lambda dialog: dialog.accept())
    with game_page.expect_navigation():
        game_page.evaluate("() => window.__AFK_GAME__.resetGame()")
    game_page.wait_for_function("() => window.__AFK_TEST__?.ready === true", timeout=15000)
    assert game_page.evaluate("() => window.__AFK_TEST__.getPrimary()") < 1000
