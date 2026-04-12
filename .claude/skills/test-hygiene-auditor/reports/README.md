# Report Artifacts

Report mode writes generated artifacts here.

- JSON: `<YYYY-MM-DD>_<run-id>.json`
- HTML: `<YYYY-MM-DD>_<run-id>.html`

Behavior requirements:

- JSON is written to file only (never printed inline in normal/report responses).
- HTML is generated from the JSON file via:
  `node .claude/skills/test-hygiene-auditor/tools/generate-html-report.mjs --input <json> --output <html> --date <YYYY-MM-DD> --run-id <run-id>`
