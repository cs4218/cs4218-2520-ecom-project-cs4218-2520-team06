#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

function parseArgs(argv) {
  const args = {
    input: "",
    output: "",
    date: "",
    runId: "run-1",
    title: "Test Hygiene Audit Report",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--input" && next) {
      args.input = next;
      i += 1;
    } else if (token === "--output" && next) {
      args.output = next;
      i += 1;
    } else if (token === "--date" && next) {
      args.date = next;
      i += 1;
    } else if (token === "--run-id" && next) {
      args.runId = next;
      i += 1;
    } else if (token === "--title" && next) {
      args.title = next;
      i += 1;
    } else if (token === "--help" || token === "-h") {
      printHelpAndExit(0);
    }
  }

  if (!args.input || !args.output) {
    printHelpAndExit(1);
  }

  if (args.date && !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
    throw new Error("--date must be in YYYY-MM-DD format");
  }

  return args;
}

function printHelpAndExit(code) {
  const usage = [
    "Usage:",
    '  node .claude/skills/test-hygiene-auditor/tools/generate-html-report.mjs --input <audit.json> --output <report.html> [--date YYYY-MM-DD] [--run-id run-1] [--title "Custom title"]',
    "",
    "Notes:",
    "  - Use --date for deterministic markdown header output.",
    "  - HTML output is deterministic for the same input and args.",
  ].join("\n");

  process.stdout.write(`${usage}\n`);
  process.exit(code);
}

function toIsoDateUtc() {
  return new Date().toISOString().slice(0, 10);
}

function compareStrings(a, b) {
  return String(a || "").localeCompare(String(b || ""), "en", {
    sensitivity: "base",
  });
}

function severityRank(value) {
  return SEVERITY_RANK[value] ?? 99;
}

function normalizeAudit(auditRaw) {
  const frameworks = auditRaw.frameworks || {
    jest: { detected: false, evidence: [] },
    playwright: { detected: false, evidence: [] },
  };
  const suppression = auditRaw.suppression || {
    enabled: true,
    files_loaded: [],
    follow_up_mode: false,
  };

  const files = Array.isArray(auditRaw.files) ? auditRaw.files : [];

  const normalizedFindings = [];
  for (const file of files) {
    const filePath = file.path || "unknown";
    const framework = file.framework || "unknown";
    const testType = file.test_type || "unknown";
    const issues = Array.isArray(file.issues) ? file.issues : [];

    for (const issue of issues) {
      normalizedFindings.push({
        path: filePath,
        framework,
        test_type: testType,
        category: issue.category || "unknown",
        location: issue.location || "test_body",
        severity: issue.severity || "low",
        fingerprint: issue.fingerprint || "",
        title: issue.title || "Untitled finding",
        details: issue.details || "",
        evidence: Array.isArray(issue.evidence) ? issue.evidence : [],
        recommendations: Array.isArray(issue.recommendations)
          ? issue.recommendations
          : [],
      });
    }
  }

  normalizedFindings.sort((a, b) => {
    return (
      severityRank(a.severity) - severityRank(b.severity) ||
      compareStrings(a.category, b.category) ||
      compareStrings(a.path, b.path) ||
      compareStrings(a.location, b.location) ||
      compareStrings(a.fingerprint, b.fingerprint) ||
      compareStrings(a.title, b.title)
    );
  });

  const countsBySeverity = { high: 0, medium: 0, low: 0 };
  const countsByCategory = {};
  for (const finding of normalizedFindings) {
    if (countsBySeverity[finding.severity] === undefined) {
      countsBySeverity[finding.severity] = 0;
    }
    countsBySeverity[finding.severity] += 1;
    countsByCategory[finding.category] =
      (countsByCategory[finding.category] || 0) + 1;
  }

  const categories = Object.keys(countsByCategory).sort((a, b) =>
    compareStrings(a, b)
  );

  return {
    frameworks,
    suppression,
    findings: normalizedFindings,
    stats: {
      total_files: files.length,
      total_findings: normalizedFindings.length,
      severities: countsBySeverity,
      categories: categories.map((name) => ({
        name,
        count: countsByCategory[name],
      })),
    },
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serializeForInlineScript(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function renderHtml({ title, date, runId, payload, rawAudit }) {
  const titleEscaped = escapeHtml(title);
  const payloadJsonScript = serializeForInlineScript(payload);
  const rawAuditJsonScript = serializeForInlineScript(rawAudit);
  const dateEscaped = escapeHtml(date);
  const runIdEscaped = escapeHtml(runId);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titleEscaped}</title>
  <style>
    :root {
      --bg: #f6f6f3;
      --card: #ffffff;
      --ink: #192026;
      --muted: #5f6b73;
      --line: #d5ddd8;
      --accent: #0a6f69;
      --warn: #b26b00;
      --danger: #b83a3a;
      --ok: #1f7d4c;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Source Sans 3", "Segoe UI", sans-serif;
      color: var(--ink);
      background: radial-gradient(circle at 20% 0%, #edf4f1 0, var(--bg) 55%);
    }

    .wrap {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      gap: 16px;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 16px;
    }

    h1, h2 { margin: 0 0 10px; }
    h1 { font-size: 1.5rem; }
    h2 { font-size: 1.1rem; }
    p, label, td, th, input, select, button, textarea { font-size: 0.95rem; }
    .muted { color: var(--muted); }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
    }

    .stat {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      background: #fbfcfb;
    }

    .controls {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      align-items: end;
    }

    .controls label {
      display: grid;
      gap: 4px;
    }

    input, select, textarea {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 8px;
      background: #fff;
    }

    textarea {
      min-height: 96px;
      font-family: "IBM Plex Mono", monospace;
    }

    button {
      border: 0;
      border-radius: 8px;
      padding: 9px 12px;
      color: #fff;
      background: var(--accent);
      cursor: pointer;
    }

    button.secondary { background: #4f5c64; }
    button:disabled { opacity: 0.55; cursor: not-allowed; }

    .table-wrap {
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #fff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
    }

    th, td {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid #edf1ef;
      vertical-align: top;
    }

    .summary-row { cursor: pointer; }
    .summary-row td:last-child { text-align: right; }

    .tag {
      display: inline-block;
      border-radius: 999px;
      padding: 2px 8px;
      color: #fff;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .sev-high { background: var(--danger); }
    .sev-medium { background: var(--warn); }
    .sev-low { background: var(--ok); }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    code {
      font-family: "IBM Plex Mono", monospace;
      font-size: 0.85rem;
      background: #f2f5f4;
      padding: 1px 5px;
      border-radius: 5px;
    }

    .fingerprint {
      display: inline-block;
      max-width: 36ch;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      line-height: 1.35;
    }

    .view-btn {
      border: 1px solid var(--line);
      background: #f7faf8;
      color: var(--ink);
      width: 28px;
      height: 28px;
      padding: 0;
      border-radius: 6px;
      font-size: 0.95rem;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .view-btn:hover { background: #eef4f1; }

    .detail-row { display: none; }
    .detail-row.open { display: table-row; }
    .detail-cell {
      background: #fbfcfb;
      border-bottom: 1px solid #e3ebe7;
      padding: 12px;
    }

    .detail-panel {
      display: grid;
      gap: 10px;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      background: #ffffff;
    }

    .detail-section strong { display: block; margin-bottom: 4px; }
    .detail-section ul { margin: 0; padding-left: 18px; }
    .detail-section li { margin: 2px 0; }

    .evidence-block {
      display: block;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
      background: #f2f5f4;
      border: 1px solid #dbe6e1;
      border-radius: 8px;
      padding: 8px;
      margin: 0 0 8px;
      font-family: "IBM Plex Mono", monospace;
      font-size: 0.82rem;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="card">
      <h1>${titleEscaped}</h1>
      <p class="muted">Report generated from audit run. Select findings to suppress and export a Markdown suppression file.</p>
      <div class="stats" id="stats"></div>
    </section>

    <section class="card">
      <h2>Filter Findings</h2>
      <div class="controls">
        <label>Severity
          <select id="filterSeverity">
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>Category
          <select id="filterCategory">
            <option value="">All</option>
          </select>
        </label>
        <label>Framework
          <select id="filterFramework">
            <option value="">All</option>
          </select>
        </label>
        <label>Path contains
          <input id="filterPath" type="text" placeholder="tests/auth.spec.ts">
        </label>
      </div>
      <div class="actions">
        <button type="button" class="secondary" id="selectFiltered">Select filtered</button>
        <button type="button" class="secondary" id="clearSelection">Clear selection</button>
        <span class="muted" id="selectionInfo"></span>
      </div>
    </section>

    <section class="card">
      <h2>Findings</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Suppress</th>
              <th>Severity</th>
              <th>Category</th>
              <th>Path</th>
              <th>Title</th>
              <th>Fingerprint</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody id="findingsBody"></tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2>Suppression Markdown</h2>
      <div class="controls">
        <label>Date
          <input id="metaDate" type="text" value="${dateEscaped}" placeholder="YYYY-MM-DD">
        </label>
        <label>Run ID
          <input id="metaRunId" type="text" value="${runIdEscaped}" placeholder="run-1">
        </label>
        <label>Added by
          <input id="metaAddedBy" type="text" value="audit-user" placeholder="your-name">
        </label>
        <label>Default reason
          <input id="metaReason" type="text" value="accepted tradeoff for now">
        </label>
        <label>Expires at (optional)
          <input id="metaExpires" type="text" placeholder="YYYY-MM-DD">
        </label>
      </div>
      <div class="actions">
        <button type="button" id="downloadMarkdown">Download Markdown</button>
      </div>
      <p class="muted">Save the downloaded file into <code>.claude/skills/test-hygiene-auditor/suppressions/</code>.</p>
      <textarea id="markdownPreview" spellcheck="false"></textarea>
    </section>
  </main>

  <script>
    window.__AUDIT_REPORT__ = ${rawAuditJsonScript};
    window.__AUDIT_REPORT_DERIVED__ = ${payloadJsonScript};
  </script>
  <script>
    (function () {
      function escapeText(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function severityClass(severity) {
        if (severity === "high") return "sev-high";
        if (severity === "medium") return "sev-medium";
        return "sev-low";
      }

      function pad4(index) {
        var str = String(index);
        while (str.length < 4) str = "0" + str;
        return str;
      }

      var payload = window.__AUDIT_REPORT_DERIVED__ || { findings: [], stats: {} };
      var rawAudit = window.__AUDIT_REPORT__ || {};
      var findings = Array.isArray(payload.findings) ? payload.findings : [];
      var selectedFingerprints = new Set();
      var expandedRows = new Set();

      var filterSeverity = document.getElementById("filterSeverity");
      var filterCategory = document.getElementById("filterCategory");
      var filterFramework = document.getElementById("filterFramework");
      var filterPath = document.getElementById("filterPath");
      var findingsBody = document.getElementById("findingsBody");
      var selectionInfo = document.getElementById("selectionInfo");
      var markdownPreview = document.getElementById("markdownPreview");

      var metaDate = document.getElementById("metaDate");
      var metaRunId = document.getElementById("metaRunId");
      var metaAddedBy = document.getElementById("metaAddedBy");
      var metaReason = document.getElementById("metaReason");
      var metaExpires = document.getElementById("metaExpires");

      function renderStats() {
        var statsHost = document.getElementById("stats");
        var stats = payload.stats || {};
        var sev = stats.severities || {};
        var parts = [
          { title: "Total files", value: stats.total_files || 0 },
          { title: "Total findings", value: stats.total_findings || 0 },
          { title: "High", value: sev.high || 0 },
          { title: "Medium", value: sev.medium || 0 },
          { title: "Low", value: sev.low || 0 }
        ];

        var html = "";
        for (var i = 0; i < parts.length; i += 1) {
          html += "<div class='stat'><div class='muted'>" + escapeText(parts[i].title) + "</div><strong>" + escapeText(parts[i].value) + "</strong></div>";
        }
        statsHost.innerHTML = html;
      }

      function renderAuditMeta() {
        var title = document.querySelector("h1");
        var files = Array.isArray(rawAudit.files) ? rawAudit.files.length : 0;
        var risks = Array.isArray(rawAudit.cross_cutting) ? rawAudit.cross_cutting.length : 0;
        title.textContent = title.textContent + " (" + files + " files, " + risks + " cross-cutting risk(s))";
      }

      function populateFilters() {
        var categories = [];
        var frameworks = [];
        var categoryMap = Object.create(null);
        var frameworkMap = Object.create(null);

        for (var i = 0; i < findings.length; i += 1) {
          var c = findings[i].category || "unknown";
          var f = findings[i].framework || "unknown";
          if (!categoryMap[c]) {
            categoryMap[c] = true;
            categories.push(c);
          }
          if (!frameworkMap[f]) {
            frameworkMap[f] = true;
            frameworks.push(f);
          }
        }

        categories.sort();
        frameworks.sort();

        for (var ci = 0; ci < categories.length; ci += 1) {
          var option = document.createElement("option");
          option.value = categories[ci];
          option.textContent = categories[ci];
          filterCategory.appendChild(option);
        }

        for (var fi = 0; fi < frameworks.length; fi += 1) {
          var fwOption = document.createElement("option");
          fwOption.value = frameworks[fi];
          fwOption.textContent = frameworks[fi];
          filterFramework.appendChild(fwOption);
        }
      }

      function filteredFindings() {
        var severity = filterSeverity.value;
        var category = filterCategory.value;
        var framework = filterFramework.value;
        var pathNeedle = filterPath.value.trim().toLowerCase();

        var rows = [];
        for (var i = 0; i < findings.length; i += 1) {
          var finding = findings[i];
          if (severity && finding.severity !== severity) continue;
          if (category && finding.category !== category) continue;
          if (framework && finding.framework !== framework) continue;
          if (pathNeedle && String(finding.path || "").toLowerCase().indexOf(pathNeedle) === -1) continue;
          rows.push(finding);
        }
        return rows;
      }

      function renderFindings() {
        var rows = filteredFindings();
        var html = "";

        for (var i = 0; i < rows.length; i += 1) {
          var row = rows[i];
          var fp = row.fingerprint || "";
          var checked = fp && selectedFingerprints.has(fp) ? " checked" : "";
          var disabled = fp ? "" : " disabled";
          var escapedFp = escapeText(fp || "missing-fingerprint");
          var rowId = escapeText(encodeURIComponent(fp || (row.path + "|" + row.category + "|" + row.title + "|" + String(i))));
          var isOpen = expandedRows.has(rowId) ? " open" : "";
          var toggleIcon = expandedRows.has(rowId) ? "▾" : "▸";
          var toggleLabel = expandedRows.has(rowId) ? "Hide details" : "View details";
          var detailsText = escapeText(row.details || "No details provided.");

          var recItems = "";
          var recs = Array.isArray(row.recommendations) ? row.recommendations : [];
          for (var r = 0; r < recs.length; r += 1) {
            recItems += "<li>" + escapeText(recs[r]) + "</li>";
          }
          if (!recItems) {
            recItems = "<li>None provided</li>";
          }

          var evItems = "";
          var evidence = Array.isArray(row.evidence) ? row.evidence : [];
          for (var e = 0; e < evidence.length; e += 1) {
            evItems += "<code class='evidence-block'>" + escapeText(evidence[e]) + "</code>";
          }
          if (!evItems) {
            evItems = "<code class='evidence-block'>None provided</code>";
          }

          html += "<tr class='summary-row' data-summary='" + rowId + "'>" +
            "<td><input type='checkbox' data-fp='" + escapedFp + "'" + checked + disabled + "></td>" +
            "<td><span class='tag " + severityClass(row.severity) + "'>" + escapeText(row.severity) + "</span></td>" +
            "<td>" + escapeText(row.category) + "</td>" +
            "<td><code>" + escapeText(row.path) + "</code></td>" +
            "<td>" + escapeText(row.title) + "</td>" +
            "<td><code class='fingerprint' title='" + escapedFp + "'>" + escapedFp + "</code></td>" +
            "<td><button type='button' class='view-btn' data-toggle='" + rowId + "' aria-label='" + toggleLabel + "' title='" + toggleLabel + "'>" + toggleIcon + "</button></td>" +
          "</tr>" +
          "<tr class='detail-row" + isOpen + "' data-detail='" + rowId + "'>" +
            "<td colspan='7' class='detail-cell'>" +
              "<div class='detail-panel'>" +
                "<div class='detail-section'><strong>Details</strong><div>" + detailsText + "</div></div>" +
                "<div class='detail-section'><strong>Recommendations</strong><ul>" + recItems + "</ul></div>" +
                "<div class='detail-section'><strong>Evidence</strong>" + evItems + "</div>" +
              "</div>" +
            "</td>" +
          "</tr>";
        }

        findingsBody.innerHTML = html;

        var checkboxes = findingsBody.querySelectorAll("input[type='checkbox'][data-fp]");
        for (var cbIndex = 0; cbIndex < checkboxes.length; cbIndex += 1) {
          checkboxes[cbIndex].addEventListener("change", function (event) {
            var fp = event.target.getAttribute("data-fp");
            if (!fp || fp === "missing-fingerprint") return;
            if (event.target.checked) {
              selectedFingerprints.add(fp);
            } else {
              selectedFingerprints.delete(fp);
            }
            renderFindings();
            refreshSuppressionPreview();
          });
        }

        var toggles = findingsBody.querySelectorAll("button[data-toggle]");
        for (var t = 0; t < toggles.length; t += 1) {
          toggles[t].addEventListener("click", function (event) {
            event.stopPropagation();
            var rowId = event.target.getAttribute("data-toggle");
            if (!rowId) return;
            if (expandedRows.has(rowId)) {
              expandedRows.delete(rowId);
            } else {
              expandedRows.add(rowId);
            }
            renderFindings();
          });
        }

        var summaryRows = findingsBody.querySelectorAll("tr[data-summary]");
        for (var s = 0; s < summaryRows.length; s += 1) {
          summaryRows[s].addEventListener("click", function (event) {
            if (event.target.closest("input") || event.target.closest("button")) {
              return;
            }
            var rowId = event.currentTarget.getAttribute("data-summary");
            if (!rowId) return;
            if (expandedRows.has(rowId)) {
              expandedRows.delete(rowId);
            } else {
              expandedRows.add(rowId);
            }
            renderFindings();
          });
        }

        selectionInfo.textContent = selectedFingerprints.size + " fingerprint(s) selected";
      }

      function buildMarkdown() {
        var dateValue = metaDate.value.trim() || "1970-01-01";
        var addedBy = metaAddedBy.value.trim() || "audit-user";
        var reason = metaReason.value.trim() || "accepted tradeoff for now";
        var expiresAt = metaExpires.value.trim();

        var fingerprints = Array.from(selectedFingerprints);
        fingerprints.sort();

        var lines = [];
        lines.push("# Test Hygiene Suppressions");
        lines.push("");
        lines.push("## " + dateValue);
        lines.push("");

        for (var i = 0; i < fingerprints.length; i += 1) {
          lines.push("### WL-" + pad4(i + 1));
          lines.push("");
          lines.push("- type: fingerprint");
          lines.push("- fingerprint: " + fingerprints[i]);
          lines.push("- reason: " + reason);
          lines.push("- added_by: " + addedBy);
          if (expiresAt) {
            lines.push("- expires_at: " + expiresAt);
          }
          lines.push("");
        }

        return lines.join("\\n").trimEnd() + "\\n";
      }

      function refreshSuppressionPreview() {
        markdownPreview.value = buildMarkdown();
      }

      function wireEvents() {
        var filterInputs = [filterSeverity, filterCategory, filterFramework, filterPath];
        for (var i = 0; i < filterInputs.length; i += 1) {
          filterInputs[i].addEventListener("input", function () {
            renderFindings();
          });
          filterInputs[i].addEventListener("change", function () {
            renderFindings();
          });
        }

        var metaInputs = [metaDate, metaRunId, metaAddedBy, metaReason, metaExpires];
        for (var j = 0; j < metaInputs.length; j += 1) {
          metaInputs[j].addEventListener("input", function () {
            refreshSuppressionPreview();
          });
        }

        document.getElementById("selectFiltered").addEventListener("click", function () {
          var rows = filteredFindings();
          for (var i = 0; i < rows.length; i += 1) {
            if (rows[i].fingerprint) {
              selectedFingerprints.add(rows[i].fingerprint);
            }
          }
          renderFindings();
          refreshSuppressionPreview();
        });

        document.getElementById("clearSelection").addEventListener("click", function () {
          selectedFingerprints.clear();
          renderFindings();
          refreshSuppressionPreview();
        });

        document.getElementById("downloadMarkdown").addEventListener("click", function () {
          var runId = metaRunId.value.trim() || "run-1";
          var dateValue = metaDate.value.trim() || "1970-01-01";
          var fileName = dateValue + "_" + runId + ".md";
          var markdown = buildMarkdown();

          var blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
          var link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        });
      }

      renderStats();
      renderAuditMeta();
      populateFilters();
      wireEvents();
      renderFindings();
      refreshSuppressionPreview();
    })();
  </script>
</body>
</html>
`;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);
  const raw = await fs.readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  const normalized = normalizeAudit(parsed);

  const date = args.date || toIsoDateUtc();
  const html = renderHtml({
    title: args.title,
    date,
    runId: args.runId,
    payload: normalized,
    rawAudit: parsed,
  });

  await fs.writeFile(outputPath, html.replaceAll("\r\n", "\n"), "utf8");
  process.stdout.write(`Wrote report to ${outputPath}\n`);
}

run().catch((error) => {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exit(1);
});
