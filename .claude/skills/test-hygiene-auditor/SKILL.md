---
name: test-hygiene-auditor
description: Audit automated tests for missed validations, overlooked edge cases, inter-test state/side-effect leaks, brittle or flaky test logic, gaps in control-flow testing and data-dependence coverage, and blackbox perspective violations in e2e tests. Use this whenever the user asks to review, harden, refactor, or improve Jest and/or Playwright tests; investigate flaky tests; reduce brittleness; diagnose inter-test pollution (mock leakage, timers, globals, shared fixtures, reused storage/session); increase confidence that tests cover key branches and input partitions; or audit e2e tests for blackbox violations (internal imports, direct DB/API access bypassing UI). Always start by detecting whether the repo uses Jest and/or Playwright and tailor the audit accordingly. Always output a structured report listing test files found and the relevant problems for user review.
---

# Test Hygiene Auditor

You review test suites to find reliability risks and coverage gaps.

Primary goals:

- Identify missed validations and overlooked edge cases
- Detect potential leaks in state or side effects between test cases
- Identify brittle/flaky test logic
- Suggest improvements/refactors that reduce brittleness
- Incorporate control-flow testing and data-dependence coverage ideas
- Support follow-up audits by suppressing explicitly whitelisted findings

Non-goals:

- Do not change code unless the user explicitly requests edits.
- Do not rewrite tests wholesale unless the user asks.

## Inputs you should ask for (only if blocked)

If the user does not specify scope, infer it from the repo.
Only ask a question if you cannot proceed safely.

## Suppression whitelist model

This skill supports follow-up audits where known false positives are whitelisted.

- Suppression files live in: `.claude/skills/test-hygiene-auditor/suppressions/`
- File format: Markdown
- File naming convention: `<YYYY-MM-DD>_<run-id>.md`
- New suppression entries created in the same conversation/run MUST be appended to the same file.
- A new run/session MUST create a new suppression file.

Suppression file structure:

```md
# Test Hygiene Suppressions

## 2026-04-11

### WL-0001

- type: fingerprint
- fingerprint: playwright|tests/auth.spec.ts|blackbox_violation|test_body|direct_api_call
- reason: Intentional local smoke shortcut
- added_by: jabeztho
- expires_at: 2026-05-01

### WL-0002

- type: rule
- category: brittle_logic
- path_pattern: tests/legacy/\*\*
- location: hook
- reason: Legacy suite pending refactor
- added_by: jabeztho
```

Supported suppression types:

- `fingerprint` (exact match): suppress when finding fingerprint matches exactly.
- `rule` (pattern match): suppress when all provided rule keys match finding fields.
  - Supported keys: `category`, `path_pattern`, `location`

Suppression behavior requirements:

- Load suppression files before every audit run.
- Ignore expired suppressions (`expires_at` older than today).
- If a finding matches suppression, do not display it in Markdown output.
- If a finding matches suppression, do not include it in the main JSON findings payload.
- Invalid suppression entries may be skipped, but never silently crash the audit.

## Step 0: Detect frameworks (Jest / Playwright)

Before reviewing any tests, detect which frameworks are present and record evidence.

Look for Jest indicators:

- `package.json` deps/scripts mention `jest`, `ts-jest`, `babel-jest`
- `jest.config.*`, `jest.setup.*`, `setupTests.*`
- `__tests__/`, `*.test.*`, `*.spec.*`

Look for Playwright indicators:

- `playwright.config.*`
- `@playwright/test` in deps or imports
- `tests/` (project convention), `globalSetup`, `storageState`

If Jest detected: read `references/jest.md`.
If Playwright detected: read `references/playwright.md`.

Also note adjacent frameworks (Vitest, Cypress, Mocha) as context, but keep the audit focused on Jest/Playwright unless asked.

## Step 0.5: Load and apply suppressions (MANDATORY)

Before inventorying tests or drafting findings:

1. Discover suppression files under `.claude/skills/test-hygiene-auditor/suppressions/*.md`.
2. Parse date sections and entries.
3. Build active suppression matchers (`fingerprint` + `rule`), excluding expired entries.
4. During issue generation, filter out matched findings immediately.

This step is required for every initial audit and follow-up audit.

## Step 1: Inventory test files

Find likely test files. Prefer repo search tools:

- Use filename patterns: `**/*.(test|spec).(js|jsx|ts|tsx)`, `**/__tests__/**`
- For Playwright, include: `playwright.config.*`, `tests/**`, files importing `@playwright/test`

For each file, record:

- Framework: `jest` | `playwright` | `unknown`
- Test type: `unit` | `integration` | `e2e` | `unknown`
- Any shared setup/teardown involvement (setup files, global hooks, shared fixtures)
- **For e2e tests specifically**: note if file contains imports from internal source directories (e.g., `models/`, `config/`, `db-util`) or uses API clients directly

## Step 2: Missed validations and edge cases

For each suite, look for assertion gaps and missing scenarios:

Missed validations (common patterns):

- Only checking the happy path; missing invalid inputs and error paths
- Not asserting side effects (DB write, network call payload, event emission, navigation)
- Weak assertions (only `truthy`, only length checks, snapshot-only) when behavior-specific checks are needed
- Not asserting invariants (sorting, uniqueness, idempotency, deduping, security/permissions)

Edge case gaps (examples):

- `null`/`undefined`, empty strings/arrays/objects
- boundary values: 0/1/max, large payloads, precision/rounding
- locale/timezone, DST boundaries, unicode/emoji, different encodings
- network failures/timeouts/retries/cancellations

## Step 3: Control-flow testing (CFT)

Your job is to highlight when tests do not cover important execution paths.

Build a lightweight control-flow map per unit under test:

- Decision points: guard clauses, `if/else`, `switch`, ternaries
- Exception paths: thrown errors, rejected promises
- Retry/fallback/cancellation paths
- State-machine transitions (e.g., `idle -> loading -> success`, `idle -> loading -> error`)

Then audit tests for path coverage:

- Both outcomes for key branches where behavior differs
- Error branches and recovery behavior
- Loop edge cases: empty, single, many, break/continue
- Concurrency/race-sensitive paths (where order matters)

If you cannot see the source under test, infer control-flow from test names, mocks, and stubs, and mark findings as "inferred".

## Step 4: Data dependence (DD)

Highlight when outputs/side effects depend on inputs or environment that tests do not vary or control.

Build a lightweight data-dependence map:

- Explicit inputs: args, props, request bodies, query params
- Implicit inputs: env vars, feature flags, time, randomness, locale, config
- External dependencies: network responses, DB rows, caches, file system

Then audit tests for data-partition coverage:

- Equivalence classes (valid/invalid partitions)
- Boundary values and "shape" variants (missing fields, extra fields, unknown enum values)
- Sensitivity to locale/timezone/precision

Also identify data-flow coupling between tests:

- Shared fixtures mutated across tests
- Shared seeded DB state relied upon implicitly
- Reused browser storage/session state bleeding between tests

## Step 5: Detect state/side-effect leaks between tests

Flag any pattern that can cause inter-test pollution or flakes.

Framework-agnostic leak vectors:

- Globals mutated and not restored (`process.env`, `global`, `window`, `Date`, `Math.random`)
- Shared singletons (module-level caches, memoized values)
- Unawaited async work (promises, timers, subscriptions)
- Network/DB/filesystem state not reset

Use the framework reference checklists for concrete patterns and remediation.

## Step 6: Identify brittle test logic

Flag brittleness patterns and explain why they are fragile.

Examples:

- Timing-based waits / arbitrary sleeps
- Over-specified DOM structure or overly strict snapshots
- Over-mocking implementation details instead of verifying behavior
- Asserting internals/private methods rather than public outputs
- Tests coupled to production defaults (seeds/fixtures/config)

## Step 7: Recommendations and refactors

For each issue, propose 1-3 concrete improvements.

Prefer changes that reduce brittleness and increase determinism:

- Stronger behavioral assertions
- Explicit setup/teardown and cleanup
- Deterministic time/randomness
- Reduced mock surface area; avoid mocking implementation details
- Table-driven tests for partitions/branches (`test.each` / `describe.each`)
- Better fixture boundaries (fresh per test, or clearly-scoped per suite)

Optionally mention property-based testing for highly input-sensitive logic, but do not prescribe it as the default approach.

## Step 8: Blackbox Perspective Violations (E2E/Playwright only)

**Applies to:** Playwright e2e test files only. Skip for unit/integration tests.

Blackbox testing means the test exercises the system through its public interfaces (UI, public APIs) without knowledge of or coupling to internal implementation details. Violations indicate the test is brittle, tied to implementation, and may give false confidence.

### Detection patterns

Search e2e test files for these violation patterns:

**In test body (HIGH severity violations):**

| Pattern                          | Example                                                            |
| -------------------------------- | ------------------------------------------------------------------ |
| Import internal modules          | `import userModel from "../../../models/userModel"`                |
| Import DB utilities              | `import { deleteUserByEmail } from "../../../db-util"`             |
| Import DB config                 | `import connectDB from "../../../config/db"`                       |
| Direct API calls replacing UI    | `await request.post("http://localhost:6060/api/...")` in test body |
| `page.evaluate()` with app logic | `page.evaluate(() => window.localStorage.setItem(...))`            |
| Hardcoded internal selectors     | CSS classes, data attributes tied to framework internals           |

**In hooks (setup/teardown):**

| Pattern                      | Severity   | Notes                                      |
| ---------------------------- | ---------- | ------------------------------------------ |
| DB operations in hooks       | LOW/WARN   | Flag if excessive (>3 per test) or complex |
| Direct DB access for seeding | ACCEPTABLE | Pragmatic allowance for test setup         |
| Direct API calls for seeding | ACCEPTABLE | Pragmatic allowance for test setup         |

**Mixed approach within suite (MEDIUM severity):**

- Some tests use UI flow, others bypass with direct API/DB
- Inconsistent approach within same test file

### Audit steps

1. **Filter to e2e files**: Identify Playwright test files (`.spec.js`, `.spec.ts`)
2. **Scan for internal imports**: `grep` for `import.*models/`, `import.*db-util`, `import.*config/db`, `import.*\.model`
3. **Scan for direct API calls**: `grep` for `request\.(post|put|patch|delete|get)\(` outside of hooks
4. **Scan for internal manipulation**: `grep` for `page\.evaluate\(`
5. **Check hook complexity**: Count DB/API operations in hooks
6. **Assess consistency**: Compare approaches within each test suite

### Severity guidelines

| Severity | Condition                                                 |
| -------- | --------------------------------------------------------- |
| HIGH     | Direct DB/API access or internal imports in **test body** |
| MEDIUM   | Inconsistent approach within same test suite              |
| LOW/WARN | Excessive DB ops in hooks (>3 per test)                   |
| LOW      | Hardcoded internal selectors                              |

### Remediation guidance

- **Test body**: All interactions should go through the UI or public APIs. Replace direct DB/API calls with user interactions (`page.click()`, `page.fill()`, etc.)
- **Hooks**: Acceptable for setup/teardown, but keep minimal. Prefer UI-based or API-based seeding over direct DB access.
- **Selectors**: Use semantic locators (`getByRole`, `getByLabel`) over implementation-specific attributes.
- **Fixtures**: Use Playwright fixtures for shared authenticated state, not hardcoded credentials tied to DB seeds.

## Step 9: Follow-up unflag/whitelist workflow

When the user asks to unflag/whitelist findings after an initial audit:

1. Identify target findings and compute stable fingerprints.
2. Draft suppression entries (`fingerprint` preferred; `rule` when broad suppression is intentional).
3. Write entries into the current run/session suppression file.
   - If this is the first suppression in the run/session, create a new file using `<YYYY-MM-DD>_<run-id>.md`.
   - If suppressions already exist in this run/session, append to the same file.
4. On follow-up audit rerun, reload suppressions and ensure matched findings are absent from output.

Optional helper for deterministic suppression authoring:

- Report mode workflow (deterministic; no JSON printed inline):
  1. Write audit JSON to file only: `.claude/skills/test-hygiene-auditor/reports/<YYYY-MM-DD>_<run-id>.json`
  2. Generate HTML from that JSON file:
     - `node .claude/skills/test-hygiene-auditor/tools/generate-html-report.mjs --input .claude/skills/test-hygiene-auditor/reports/<YYYY-MM-DD>_<run-id>.json --output .claude/skills/test-hygiene-auditor/reports/<YYYY-MM-DD>_<run-id>.html --date <YYYY-MM-DD> --run-id <run-id>`
  3. Report back both file paths to the user.
- In the HTML report, select findings to suppress and download Markdown.
- Save the downloaded `.md` into `.claude/skills/test-hygiene-auditor/suppressions/`.

Use stable finding fingerprints in this format:

`<framework>|<path>|<category>|<location>|<title_slug>`

## Output format modes

Default mode (normal run):

1. Return Markdown report for humans only.
2. Do NOT print JSON in the response.

Report mode (only when user asks to generate HTML report or equivalent):

1. Return Markdown report for humans.
2. Write JSON payload to `.claude/skills/test-hygiene-auditor/reports/<YYYY-MM-DD>_<run-id>.json` (file output only).
3. Immediately run the HTML generator tool script against that JSON file.
4. Return the generated HTML path and JSON path to the user.
5. Do NOT print raw JSON in the response.

Follow-up report mode (user asks to generate report as a follow-up to an existing audit):

1. Do NOT regenerate or restate "Findings (by file)" markdown.
2. Write JSON payload to `.claude/skills/test-hygiene-auditor/reports/<YYYY-MM-DD>_<run-id>.json` (file output only).
3. Immediately run the HTML generator tool script against that JSON file.
4. Return a compact status update only:
   - suppression context (files loaded / follow-up mode)
   - artifact paths (JSON + HTML)
   - brief next action (open HTML and export suppression markdown)
5. Do NOT print raw JSON in the response.

Enforcement requirement:

- If the user does not explicitly request report mode / HTML generation, suppress JSON output entirely.
- Never include a JSON block in normal responses.

### Markdown template

Use this full template for normal runs and first-pass audits.
Do not use this full template for follow-up report mode.

# Test Hygiene Audit

## Detected frameworks

- jest: <yes/no + evidence>
- playwright: <yes/no + evidence>

## Suppression context

- suppression files loaded: <file paths or none>
- follow-up mode: <yes/no>

## Files reviewed

- <file paths>

## Findings (by file)

For each file:

- File: `path`
- Framework: jest|playwright|unknown
- Type: unit|integration|e2e|unknown
- Coverage notes: CFT: <paths missed> | DD: <deps not varied/controlled>
- Issues:
  - [State leak] ...
  - [Side-effect leak] ...
  - [Missed validation] ...
  - [Edge case gap] ...
  - [Control-flow gap] ...
  - [Data-dependence gap] ...
  - [Brittle logic] ...
  - [Blackbox violation] ... (e2e only; note location: `test_body` | `hook` | `mixed`)
- Fingerprint: `<framework>|<path>|<category>|<location>|<title_slug>` for each issue
- Evidence: cite the exact test/hook/fixture identifiers; include short quoted snippets only when necessary
- Recommendations: 1-3 concrete edits/refactors

## Cross-cutting risks

- <patterns repeated across many files>

## High-impact quick wins

1. ...
2. ...
3. ...

### JSON schema (for report mode file output)

```json
{
  "frameworks": {
    "jest": { "detected": true, "evidence": ["..."] },
    "playwright": { "detected": false, "evidence": [] }
  },
  "suppression": {
    "enabled": true,
    "files_loaded": [
      ".claude/skills/test-hygiene-auditor/suppressions/2026-04-11_run-1.md"
    ],
    "follow_up_mode": true
  },
  "files": [
    {
      "path": "tests/foo.test.ts",
      "framework": "jest",
      "test_type": "unit",
      "coverage_notes": {
        "control_flow": "...",
        "data_dependence": "..."
      },
      "issues": [
        {
          "category": "state_leak|side_effect_leak|missed_validation|edge_case_gap|control_flow_gap|data_dependence_gap|brittle_logic|blackbox_violation",
          "location": "test_body|hook|mixed",
          "severity": "high|medium|low",
          "fingerprint": "jest|tests/foo.test.ts|control_flow_gap|test_body|missing-error-branch",
          "title": "short label",
          "details": "what and why",
          "evidence": [
            "test name/hook",
            "identifier",
            "brief snippet description"
          ],
          "recommendations": ["concrete suggestion 1", "concrete suggestion 2"]
        }
      ]
    }
  ],
  "cross_cutting": [
    {
      "category": "state_leak|control_flow_gap|data_dependence_gap|brittle_logic|blackbox_violation",
      "details": "...",
      "recommendations": ["..."]
    }
  ]
}
```

### Follow-up report mode response template (compact)

```md
# Test Hygiene Audit (Follow-up Report)

## Suppression context

- suppression files loaded: <file paths or none>
- follow-up mode: <yes/no>

## Artifacts generated

- json: `.claude/skills/test-hygiene-auditor/reports/<YYYY-MM-DD>_<run-id>.json`
- html: `.claude/skills/test-hygiene-auditor/reports/<YYYY-MM-DD>_<run-id>.html`

Next: open the HTML report, select findings to suppress, and download suppression markdown.
```
