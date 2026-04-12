# Suppression Files

Store follow-up whitelist/unflag suppressions here.

- One suppression Markdown file per audit run/session.
- File naming convention: `<YYYY-MM-DD>_<run-id>.md`
- Add new suppressions from the same conversation/run to the same file.
- For a new run, create a new file.

Suggested file template:

```md
# Test Hygiene Suppressions

## 2026-04-11

### WL-0001

- type: fingerprint
- fingerprint: jest|tests/foo.test.ts|control_flow_gap|test_body|missing-error-branch
- reason: accepted tradeoff for now
- added_by: your-name

### WL-0002

- type: rule
- category: brittle_logic
- path_pattern: tests/legacy/\*\*
- location: hook
- reason: temporary suppression while migrating fixtures
- expires_at: 2026-05-01
```
