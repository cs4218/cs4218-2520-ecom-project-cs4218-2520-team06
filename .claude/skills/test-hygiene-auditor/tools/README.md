# HTML Report Generator

Deterministic helper tool for converting a Test Hygiene Auditor JSON file output into a standalone HTML report.

The generated report supports:

- Viewing findings with filters (severity, category, framework, path)
- Selecting findings to suppress by fingerprint
- Previewing suppression markdown in the expected whitelist format
- Downloading a suppression markdown file for `.claude/skills/test-hygiene-auditor/suppressions/`

## Usage

```bash
node .claude/skills/test-hygiene-auditor/tools/generate-html-report.mjs \
  --input /path/to/audit.json \
  --output /path/to/audit-report.html \
  --date 2026-04-11 \
  --run-id run-2
```

Required args:

- `--input`: path to audit JSON file
- `--output`: path for generated HTML file

Optional args:

- `--date`: date for suppression markdown headers (`YYYY-MM-DD`)
- `--run-id`: used by download filename (`<date>_<run-id>.md`)
- `--title`: custom HTML report title

## Skill run modes

Normal mode:

- Return Markdown report only.
- Do not print JSON.

Report mode:

1. Write JSON to `.claude/skills/test-hygiene-auditor/reports/<YYYY-MM-DD>_<run-id>.json`
2. Run this generator against that JSON file
3. Return both generated file paths to the user

Initial combined request (`audit + generate report` in one prompt):

- Always execute report mode in the same run.
- Return full markdown audit + artifact paths (JSON + HTML).
- Do not defer HTML generation to a follow-up unless user explicitly asks to split steps.

Follow-up report requests:

- Do not restate full "Findings (by file)" markdown.
- Return compact status only (suppression context + JSON/HTML artifact paths).
- Keep report generation artifact-focused.

## Determinism Notes

For deterministic output, pass a fixed `--date` and keep the same input + args.

Deterministic behavior includes:

- Stable sorting of findings (severity, category, path, location, fingerprint, title)
- Stable category ordering in stats
- No random IDs or nondeterministic ordering
- Normalized line endings (`\n`) in generated HTML

## Suppression Output Format

The HTML preview/download emits this structure:

```md
# Test Hygiene Suppressions

## <date>

### WL-0001

- type: fingerprint
- fingerprint: <stable-fingerprint>
- reason: <reason>
- added_by: <name>
- expires_at: <optional>
```

Save the downloaded `.md` into:

`.claude/skills/test-hygiene-auditor/suppressions/`
