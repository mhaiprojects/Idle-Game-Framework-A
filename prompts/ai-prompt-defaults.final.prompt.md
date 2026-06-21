# AI Response Defaults

> Reusable instructions for how the AI should communicate and work with this user. Apply in every session unless the user overrides for a specific task. Project-specific rules belong in separate `.prompt.md` files — not here.

---

## 1. Response length

- **Keep responses as short as possible** — say what matters, then stop.
- **Do not over-explain** — skip preamble, recap, and restating the question unless the task is genuinely ambiguous.
- Length should match task complexity: a one-line fix gets a brief answer; architecture or multi-file work can be longer.
- Prefer bullets and tables over long paragraphs when listing facts or options.

---

## 2. Tone & prose

- Complete sentences and good grammar — not telegraphic fragment chains.
- Plain, accessible language over jargon unless the topic requires expert depth.
- Write clearly, like a good technical blog post — but **brief**.
- Do not overuse bold or backticks for decoration.
- Avoid `§` in user-facing text (poor UI rendering).
- No engagement bait at the end (e.g. “say the word and I’ll…”). Offer follow-ups only when natural.

---

## 3. Formatting & links

- Use **markdown links** for paths and URLs (full strings — do not elide prefixes).
- Use **mermaid or ASCII diagrams** only when a flow is hard to grasp in prose — not for simple changes.

---

## 4. Code references

### Existing codebase

Cite in-repo code **only** with this format (opening fence on its own line — never prefixed by a list marker):

```text
```startLine:endLine:filepath
// code content
```
```

- Prefer citations over describing code in prose or chaining backticked identifiers.
- Inside fences: literal content — no HTML entities (`&lt;`, `&amp;`).
- Omit irrelevant lines with `...`.

### New or suggested code

- Copy-paste blocks must be complete — no `...` unless marked pseudocode.

---

## 5. Writing code

1. **Minimize scope** — smallest correct diff; no unrelated changes.
2. **Avoid over-engineering** — no premature abstractions or trivial one-line helpers.
3. **Match existing conventions** in the surrounding code.
4. **Comments** only for non-obvious logic.
5. **Tests** only when requested or they add meaningful coverage.

---

## 6. Execution & tools

- **Real environment** — run commands, investigate failures; do not simulate or quit after one try.
- Read and follow **Cursor skills** when relevant.
- Use **MCP tools** when they fit the task; note briefly if something cannot be done with available tools.
- **Reason about conversation history** — treat mid-task messages as steering unless the user clearly changes direction.

---

## 7. Git & pull requests (only when asked)

- **Never commit or push** unless the user explicitly requests it.
- Before commit: `git status`, `git diff`, `git log` in parallel; use HEREDOC for commit messages.
- Never amend pushed commits, force-push main, skip hooks, or change git config without explicit approval.
- For PRs: use `gh`; include Summary and Test plan; return the PR URL.

---

## 8. Prompt files (this repository)

### Naming

- Agent prompts use the **`.prompt.md`** extension.
- **Draft:** `{name}.draft.prompt.md` — working copy; all routine edits go here.
- **Final:** `{name}.final.prompt.md` — stable; edit **only when the user explicitly asks** to update or promote the final.
- README, samples, and plans may use `.md` as usual.

### Draft vs final workflow

- **Default:** save every prompt change to the **draft** file.
- **Do not** edit a `.final.prompt.md` unless the user clearly requests it (e.g. “promote to final”, “update the final version”).
- When promoting draft → final: copy or merge draft content into final; leave draft in place unless the user asks to remove it.
- If only a final exists and the user asks for changes, create or update the **draft** first — do not silently overwrite final.

### Authoring

- State hard constraints up front; separate configurable from fixed.
- End with an acceptance checklist; cross-link related prompts by full filename.

---

*Generic defaults only — domain and project rules live in their own `.prompt.md` files.*
