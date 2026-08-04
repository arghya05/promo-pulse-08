# Polish the Data Quality & Ingestion dashboards

## Goal
Make the existing Data Quality page and the Ingestion view inside the knowledge graph feel like a 2026 production observability console: denser information, clearer hierarchy, meaningful charts, and obvious trust signals.

## What will change

### 1. Data Quality page (`/data-quality`)
- **Hero KPI rail**: convert the four summary cards into a single cohesive score strip with a radial trust-score gauge, animated counts, and a freshness pulse.
- **Overview tab**: add a layer-status donut chart next to the dimension bar chart; replace the plain layer cards with compact status tiles that show pass/warn/fail ratios and mini progress bars.
- **Gate register**: add search (rule name / expression), dimension filter chips, sticky table header, alternating row backgrounds, and a hover detail row.
- **Incidents tab**: render open incidents as a vertical timeline with severity color coding, affected-row counts, and a "quarantine reason" badge.
- **Export bar**: move CSV/Markdown actions into a clean toolbar with last-run timestamp.

### 2. Ingestion view (`/graph` → Data ingestion & quality)
- **Pipeline stepper**: turn the five medallion layers into a horizontal stepper with per-layer gate counts and a "last run" timestamp.
- **Feed cards**: upgrade feed cards to show throughput, landing mode badge, and a status dot derived from the DQ gate runs.
- **Messy-data playbook**: add a search/filter bar and severity chips (handled vs quarantined vs blocked).
- **Table trace**: make the certified-table trace a vertical timeline with explicit arrows and checks.

### 3. Visual consistency
- Use only semantic tokens (`--status-good`, `--status-warning`, `--destructive`, `--primary`, `--muted`, etc.).
- Keep the existing light Daylight Indigo theme.
- Add subtle `animate-fade-up` and hover transitions; avoid hardcoded colors or shadows.

## Verification
- Build the app and check for TypeScript errors.
- Capture Playwright screenshots of `/data-quality` and `/graph` (ingestion tab) at desktop viewport.
- Confirm no console errors and that exports still download correctly.
