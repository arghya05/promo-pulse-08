// ============================================================================
// ASK ANYTHING — ontology-grounded, zero-hallucination answer engine
//
// Pipeline:
//   1. PLAN     LLM maps the question onto the retail ontology (datasets,
//               metrics, dimensions, filters, time window). No SQL, no numbers.
//   2. EXECUTE  Deterministic engine queries governed datasets and computes
//               every metric in code -> "facts".
//   3. NARRATE  LLM writes the answer using {{ref.metric}} placeholders ONLY.
//   4. GUARD    Placeholders are substituted with database values; any raw
//               number the model tried to write is rejected. Anything that
//               cannot be grounded is dropped and reported.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  datasets,
  graphForDatasets,
  ontologyCatalog,
  ontologyPromptSpec,
  sqlEquivalent,
} from '../_shared/retail-ontology.ts';
import { executeQuery, loadLookups, type FactSet, type QuerySpec } from '../_shared/ontology-engine.ts';
import { runScenario, scenarioPromptSpec, SCENARIO_KINDS, type ScenarioSet, type ScenarioSpec } from '../_shared/scenario-engine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-3.6-flash';

async function callModel(apiKey: string, messages: unknown[], maxTokens = 1600) {
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: 'json_object' },
      reasoning: { effort: 'low' },
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 400)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? '';
  if (!content || String(content).trim() === '') {
    console.error('empty model content', JSON.stringify(json?.choices?.[0] ?? {}).slice(0, 600));
    return {};
  }
  try {
    return JSON.parse(content);
  } catch {
    const match = String(content).match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        console.error('unparseable model json', String(content).slice(0, 800));
        return {};
      }
    }
    console.error('no json in model output', String(content).slice(0, 400));
    return {};
  }
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function defaultWindow() {
  const to = new Date();
  const from = new Date(to.getTime() - 90 * 86400000);
  return { from: isoDay(from), to: isoDay(to) };
}

// ------------------------------ planner ------------------------------------

function plannerPrompt(): string {
  const today = isoDay(new Date());
  return `You are the query planner of a production retail merchandising intelligence platform for a large US grocery chain.
Today is ${today}. The retail calendar is FY2026.

Your ONLY job: translate the user's question into a JSON query plan over the governed retail ontology below.
You must NEVER state facts, numbers, or conclusions. You never write SQL.

${ontologyPromptSpec()}

RULES
- Use only dataset ids, metric keys, dimension keys and filter keys listed above. Never invent names.
- Pick the dataset whose grain answers the question. Named products/SKUs/brands -> sku_sales. Availability/out-of-shelf -> inventory. Competitor/price index -> price_gap. Forecast/accuracy -> forecast. Trade spend/mechanics -> promotions. Vendor/on-time -> supplier_performance. Shelf/space -> space. Footfall/conversion -> store_traffic. Markdown/clearance -> markdowns. Company or category P&L -> sales.
- For cross-module questions (e.g. "are my out-of-stocks hurting sales in Dairy?") emit 2-3 queries on different datasets that share a dimension (category, store, region or product) so they can be connected.
- Always include a company/total view plus a ranked breakdown when the question implies drivers, best/worst, or comparison.
- Time window: use ISO dates. Default to the last 90 days when the question has no period. "This year"/"YTD" -> ${today.slice(0, 4)}-01-01 to ${today}. Snapshot datasets (inventory, space) ignore dates.
- limit <= 15. sortDir "desc" for best/top, "asc" for worst/lowest.

${scenarioPromptSpec()}

Return JSON exactly:
{
  "interpretation": "one sentence restating the question in retail terms",
  "answerable": true,
  "modules": ["executive"],
  "queries": [
    {"id":"q1","dataset":"sales","metrics":["net_sales","gross_margin_pct"],"dimension":"category","filters":{},"dateFrom":"YYYY-MM-DD","dateTo":"YYYY-MM-DD","sortBy":"net_sales","sortDir":"desc","limit":10}
  ],
  "scenarios": [],
  "chart": {"query":"q1","metric":"net_sales","type":"bar"},
  "clarify": null
}
AMBIGUITY — ask back instead of guessing. If the question is materially ambiguous (no entity or scope named where one is required, two or more equally valid readings, an undefined comparison basis, or an unspecified time period where the answer would change a lot), return:
  "clarify": {"question":"one short clarifying question","options":["concrete option 1","concrete option 2","concrete option 3"],"why":"what is ambiguous"}
with empty queries and scenarios. Every option must be a fully-formed question the engine can answer as-is. Do NOT ask back for questions that are merely broad — only when a wrong reading would produce a misleading answer.
If the question cannot be answered from these datasets or scenarios, return "answerable": false with empty queries and scenarios and explain in "interpretation".`;
}

// ------------------------------ narrator -----------------------------------

function compactFacts(factSets: FactSet[]) {
  return factSets.map((fs) => ({
    query: fs.id,
    dataset: fs.dataset,
    module: fs.module,
    grain: fs.grain,
    filters: fs.filters,
    window: fs.window,
    recordsAnalysed: fs.rowsScanned,
    dimension: fs.dimensionLabel,
    total: {
      ref: fs.total.ref,
      label: fs.total.label,
      metrics: Object.fromEntries(Object.entries(fs.total.values).map(([k, v]) => [k, { ref: `${fs.total.ref}.${k}`, label: v.label, display: v.formatted }])),
    },
    rows: fs.rows.map((r) => ({
      ref: r.ref,
      name: r.label,
      metrics: Object.fromEntries(Object.entries(r.values).map(([k, v]) => [k, { ref: `${r.ref}.${k}`, label: v.label, display: v.formatted }])),
    })),
  }));
}

function compactScenarios(scenarios: ScenarioSet[]) {
  return scenarios.map((sc) => ({
    scenario: sc.id,
    kind: sc.kind,
    module: sc.module,
    title: sc.title,
    method: sc.method,
    grain: sc.entityLabel,
    scope: sc.scope,
    levers: sc.levers,
    assumptions: sc.assumptions,
    baselineWindow: sc.window,
    recordsAnalysed: sc.rowsScanned,
    projectedTotal: {
      ref: sc.total.ref,
      label: sc.total.label,
      metrics: Object.fromEntries(Object.entries(sc.total.values).map(([k, v]) => [k, { ref: `${sc.total.ref}.${k}`, label: v.label, display: v.formatted }])),
    },
    projectedRows: sc.rows.map((r) => ({
      ref: r.ref,
      name: r.label,
      metrics: Object.fromEntries(Object.entries(r.values).map(([k, v]) => [k, { ref: `${r.ref}.${k}`, label: v.label, display: v.formatted }])),
    })),
    notes: sc.notes,
  }));
}

function narratorPrompt(hasScenarios: boolean): string {
  return `You are Maya, a senior merchandising analyst for a large US grocery retailer. You are answering an executive.

ABSOLUTE RULES (violations are automatically rejected by a guardrail):
1. You may NOT write any digit. Every number, currency amount, percentage, unit count or name-with-number must be a placeholder token of the form {{ref}} taken verbatim from the FACTS json (e.g. {{q1.total.net_sales}}, {{q1.3.margin_pct}}).
2. Entity names (categories, SKUs, stores, suppliers, competitors) must come from the "name" fields; reference them as {{q1.3.name}} so they stay exact.
3. Never state a fact that is not in FACTS. No benchmarks, no outside knowledge, no assumed causes. If FACTS do not support a claim, do not make it.
4. Causality: only say "correlates with" / "coincides with" unless FACTS include a causal metric. Recommendations must be tied to a placeholder metric.
5. Brevity: each bullet 15-25 words, format "[Metric or entity]: [insight] - [placeholder]".
${hasScenarios ? `
PREDICTIVE / PRESCRIPTIVE MODE — a SCENARIOS block is present. It was simulated deterministically in code.
6. Label projected numbers as projected/modelled/expected, never as actual results. Actuals come from FACTS queries only.
7. Use "projection" for the forward view: what the simulation says will happen under the stated levers.
8. Every action must quantify the modelled outcome with a scenario placeholder (e.g. {{s1.total.margin_delta}}) and name the lever in words.
9. Put the two most material scenario assumptions into "caveats", worded as limits of the simulation.
10. Confidence: "high" only when many records were analysed and the scenario has a narrow band; use "medium" or "low" otherwise.` : ''}

Return JSON exactly:
{
  "headline": "one sentence direct answer, placeholders only for numbers",
  "insights": [{"text":"...", "refs":["q1.total.net_sales"]}],
  "drivers": [{"text":"...", "refs":["q1.2.net_sales"]}],
  "projection": [{"text":"...", "refs":["s1.total.forecast_sales"]}],
  "actions": [{"text":"...", "impact":"...", "refs":["s1.1.margin_delta"]}],
  "caveats": ["what the data or simulation does NOT cover"],
  "confidence": "high" | "medium" | "low"
}
3-5 insights, 0-4 drivers, ${hasScenarios ? '2-4 projection bullets' : 'empty projection array'}, 2-3 actions. Use "low" confidence when few records were analysed.`;
}

// ------------------------------ guardrail ----------------------------------

interface GroundedText {
  text: string;
  refs: string[];
  ok: boolean;
  violation?: string;
}

function buildFactIndex(factSets: FactSet[], scenarios: ScenarioSet[] = []) {
  const index = new Map<string, string>();
  const sets: { total: { ref: string; label: string; values: Record<string, { formatted: string }> }; rows: { ref: string; label: string; values: Record<string, { formatted: string }> }[] }[] = [
    ...factSets,
    ...scenarios,
  ] as any;
  for (const fs of sets) {
    for (const [k, v] of Object.entries(fs.total.values)) index.set(`${fs.total.ref}.${k}`, v.formatted);
    index.set(`${fs.total.ref}.name`, fs.total.label);
    for (const row of fs.rows) {
      index.set(`${row.ref}.name`, row.label);
      for (const [k, v] of Object.entries(row.values)) index.set(`${row.ref}.${k}`, v.formatted);
    }
  }
  return index;
}

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

function ground(raw: unknown, index: Map<string, string>): GroundedText | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const used: string[] = [];
  let unresolved = false;

  const substituted = raw.replace(PLACEHOLDER, (_all, ref: string) => {
    const value = index.get(ref);
    if (value === undefined) {
      unresolved = true;
      return '⟂';
    }
    used.push(ref);
    return value;
  });

  if (unresolved) {
    return { text: substituted, refs: used, ok: false, violation: 'referenced a fact that does not exist' };
  }

  // any digit the model wrote itself (outside placeholders) is ungrounded
  const modelAuthored = raw.replace(PLACEHOLDER, '');
  if (/\d/.test(modelAuthored)) {
    return { text: substituted, refs: used, ok: false, violation: 'wrote a number that is not a database fact' };
  }

  // collapse the "… at 21.6% - 21.6%" pattern the brevity format can produce
  const tidy = substituted
    .replace(/\b([^\s]+)\s+[-–]\s+\1\b/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { text: tidy, refs: Array.from(new Set(used)), ok: true };
}

function groundList(items: unknown, index: Map<string, string>) {
  const kept: { text: string; refs: string[]; impact?: string }[] = [];
  const rejected: { text: string; violation: string }[] = [];
  if (!Array.isArray(items)) return { kept, rejected };
  for (const item of items) {
    const obj = (typeof item === 'string' ? { text: item } : item) as Record<string, unknown>;
    const grounded = ground(obj.text, index);
    if (!grounded) continue;
    if (grounded.ok) {
      const impact = ground(obj.impact, index);
      kept.push({ text: grounded.text, refs: grounded.refs, impact: impact?.ok ? impact.text : undefined });
    } else {
      rejected.push({ text: grounded.text, violation: grounded.violation! });
    }
  }
  return { kept, rejected };
}

// ------------------------ lineage + evaluation ------------------------------

export interface LineageEntry {
  ref: string;
  kind: 'observed' | 'projected';
  value: string;
  metric: string;
  metricLabel: string;
  formula: string;
  scope: string;
  dataset: string;
  module: string;
  table: string;
  grain: string;
  window: { from: string | null; to: string | null };
  recordsAnalysed: number;
  method: string | null;
}

/**
 * Resolves every groundable placeholder ref to its full lineage: which row of
 * which governed dataset, which physical table, which formula, which window.
 * The UI renders this per claim so a reader can trace any figure end to end.
 */
function buildLineageIndex(factSets: FactSet[], scenarios: ScenarioSet[]): Record<string, LineageEntry> {
  const out: Record<string, LineageEntry> = {};

  const add = (
    rowRef: string,
    scope: string,
    values: Record<string, { metric: string; label: string; formatted: string }>,
    base: Omit<LineageEntry, 'ref' | 'value' | 'metric' | 'metricLabel' | 'formula' | 'scope'>,
    formulaFor: (metric: string) => string,
  ) => {
    for (const [key, v] of Object.entries(values)) {
      out[`${rowRef}.${key}`] = {
        ...base,
        ref: `${rowRef}.${key}`,
        scope,
        metric: key,
        metricLabel: v.label ?? key,
        formula: formulaFor(key),
        value: v.formatted,
      };
    }
  };

  for (const fs of factSets) {
    const ds = datasets[fs.dataset];
    const base = {
      kind: 'observed' as const,
      dataset: fs.dataset,
      module: fs.module,
      table: ds?.table ?? fs.tables[0] ?? '',
      grain: fs.grain,
      window: fs.window,
      recordsAnalysed: fs.rowsScanned,
      method: null,
    };
    const formulaFor = (m: string) => ds?.metrics[m]?.definition ?? `${ds?.metrics[m]?.agg ?? 'sum'}(${m})`;
    add(fs.total.ref, `${fs.total.label} (all rows in scope)`, fs.total.values as never, base, formulaFor);
    for (const row of fs.rows) {
      add(row.ref, `${fs.dimensionLabel ?? 'segment'} = ${row.label}`, row.values as never, base, formulaFor);
    }
  }

  for (const sc of scenarios) {
    const base = {
      kind: 'projected' as const,
      dataset: `${sc.kind}_simulation`,
      module: sc.module,
      table: sc.tables.join(', '),
      grain: `simulated at ${sc.entityLabel} level`,
      window: sc.window,
      recordsAnalysed: sc.rowsScanned,
      method: sc.method,
    };
    const formulaFor = () => sc.method;
    add(sc.total.ref, `${sc.title} — modelled total`, sc.total.values as never, base, formulaFor);
    for (const row of sc.rows) {
      add(row.ref, `${sc.entityLabel} = ${row.label} (modelled)`, row.values as never, base, formulaFor);
    }
  }

  return out;
}

export interface EvalCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  fix: string | null;
}

interface GuardPass {
  headline: GroundedText | null;
  insights: ReturnType<typeof groundList>;
  drivers: ReturnType<typeof groundList>;
  projection: ReturnType<typeof groundList>;
  actions: ReturnType<typeof groundList>;
  caveats: ReturnType<typeof groundList>;
  rejected: { text: string; violation: string }[];
  verified: number;
  confidence: string;
}

/**
 * Deterministic evaluator. Runs in code — no model judges the answer — so the
 * verdict is reproducible. Any `fail` triggers one self-correction pass.
 */
function evaluateAnswer(
  pass: GuardPass,
  factSets: FactSet[],
  scenarios: ScenarioSet[],
  lineage: Record<string, LineageEntry>,
): { checks: EvalCheck[]; score: number; passed: boolean; verdict: string } {
  const checks: EvalCheck[] = [];
  const claims = [...pass.insights.kept, ...pass.drivers.kept, ...pass.projection.kept, ...pass.actions.kept];
  const refs = new Set(claims.flatMap((c) => c.refs ?? []));
  const records = [...factSets.map((f) => f.rowsScanned), ...scenarios.map((s) => s.rowsScanned)]
    .reduce((a, b) => a + b, 0);

  const push = (id: string, label: string, ok: boolean, warn: boolean, detail: string, fix: string | null) =>
    checks.push({ id, label, status: ok ? 'pass' : warn ? 'warn' : 'fail', detail, fix: ok ? null : fix });

  push(
    'grounding',
    'Every figure traced to a computed value',
    pass.rejected.length === 0,
    false,
    pass.rejected.length === 0
      ? `${pass.verified} claims verified, 0 model-authored numbers survived`
      : `${pass.rejected.length} claim(s) were rejected for ungrounded numbers`,
    'Rewrite the rejected claims using only {{ref}} placeholders that exist in FACTS/SCENARIOS.',
  );

  push(
    'answered',
    'Question directly answered',
    Boolean(pass.headline?.ok),
    false,
    pass.headline?.ok ? 'Headline is a grounded direct answer' : 'Headline was rejected; a deterministic fallback was used',
    'Write a one-sentence headline that answers the question, with numbers as placeholders only.',
  );

  push(
    'evidence',
    'Evidence breadth',
    refs.size >= 3,
    refs.size >= 1,
    `${refs.size} distinct computed values cited across ${claims.length} claims`,
    'Cite at least three distinct placeholder refs, including at least one row-level ref.',
  );

  const rowRefsUsed = Array.from(refs).some((r) => /\.\d+\./.test(r));
  push(
    'granularity',
    'Row-level detail, not just totals',
    rowRefsUsed || factSets.every((f) => f.rows.length === 0),
    true,
    rowRefsUsed ? 'At least one claim names a specific segment or SKU' : 'All claims cite totals only',
    'Name the specific top/bottom segments using row refs such as {{q1.1.name}}.',
  );

  const scenarioRefsUsed = Array.from(refs).some((r) => r.startsWith('s'));
  if (scenarios.length > 0) {
    push(
      'projection',
      'Simulation results used for the forward view',
      pass.projection.kept.length >= 1 && scenarioRefsUsed,
      false,
      pass.projection.kept.length >= 1
        ? `${pass.projection.kept.length} projection claim(s) from ${scenarios.length} simulation(s)`
        : 'Simulations ran but the narrative did not use them',
      'Add projection bullets that cite scenario refs (s1.*) and label them as modelled, not actual.',
    );
  } else {
    push(
      'projection',
      'No projections invented without a simulation',
      pass.projection.kept.length === 0 && !scenarioRefsUsed,
      false,
      pass.projection.kept.length === 0 ? 'Descriptive answer, no forward claims' : 'Forward claims made with no simulation behind them',
      'Remove the projection bullets — no scenario was simulated for this question.',
    );
  }

  push(
    'actionability',
    'Actions tied to a metric',
    pass.actions.kept.length >= 1,
    false,
    `${pass.actions.kept.length} recommended action(s)`,
    'Add 2-3 actions, each quantified with a placeholder metric.',
  );

  push(
    'sample',
    'Sample size supports the confidence stated',
    records >= 50 || pass.confidence !== 'high',
    true,
    `${records.toLocaleString('en-US')} records analysed with "${pass.confidence}" confidence`,
    'Lower confidence to medium or low — too few records were analysed for a high-confidence answer.',
  );

  push(
    'limits',
    'Limits of the data disclosed',
    pass.caveats.kept.length >= 1,
    true,
    `${pass.caveats.kept.length} caveat(s) stated`,
    'State at least one caveat about what the data or simulation does not cover.',
  );

  const unresolvedRefs = Array.from(refs).filter((r) => !lineage[r]);
  push(
    'lineage',
    'Full lineage resolvable for every cited value',
    unresolvedRefs.length === 0,
    false,
    unresolvedRefs.length === 0
      ? `All ${refs.size} cited values resolve to a dataset, table and formula`
      : `${unresolvedRefs.length} cited value(s) have no lineage entry`,
    'Only cite refs that appear in the FACTS/SCENARIOS json.',
  );

  const weight = (c: EvalCheck) => (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0);
  const score = Math.round((checks.reduce((a, c) => a + weight(c), 0) / checks.length) * 100);
  const failed = checks.filter((c) => c.status === 'fail');
  return {
    checks,
    score,
    passed: failed.length === 0,
    verdict: failed.length === 0
      ? `Grounded — ${checks.filter((c) => c.status === 'pass').length}/${checks.length} checks passed`
      : `${failed.length} check(s) failed: ${failed.map((c) => c.label).join('; ')}`,
  };
}

/** Turns failing checks into an instruction block for the self-correction pass. */
function repairBrief(pass: GuardPass, evaluation: { checks: EvalCheck[] }): string {
  const problems = evaluation.checks.filter((c) => c.status !== 'pass' && c.fix);
  const lines = problems.map((c, i) => `${i + 1}. ${c.label} — ${c.detail}. Fix: ${c.fix}`);
  const rejects = pass.rejected.slice(0, 6).map((r) => `- "${r.text}" (${r.violation})`);
  return `Your previous answer failed automated evaluation. Rewrite it completely, keeping only what was valid.

FINDINGS TO FIX:
${lines.join('\n')}
${rejects.length ? `\nCLAIMS THAT WERE THROWN AWAY (do not repeat these mistakes):\n${rejects.join('\n')}` : ''}
Return the same JSON shape. Remember: you may not write a single digit outside a {{ref}} placeholder.`;
}

// ------------------------------ handler ------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Ontology catalog for the explorable knowledge-graph UI (no data, vocabulary only).
  if (req.method === 'GET') {
    return new Response(JSON.stringify(ontologyCatalog()), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const started = Date.now();
  const steps: { id: string; stage: string; label: string; detail: string; ms: number }[] = [];
  const mark = (id: string, stage: string, label: string, detail: string, from: number) =>
    steps.push({ id, stage, label, detail, ms: Date.now() - from });
  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured');

    const body = await req.json().catch(() => ({}));
    const question = String(body.question ?? '').trim();
    const persona = String(body.persona ?? 'Executive');
    if (question.length < 3) {
      return new Response(JSON.stringify({ error: 'Please ask a question.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ---------- 1. PLAN ----------
    const planStart = Date.now();
    const plan = await callModel(apiKey, [
      { role: 'system', content: plannerPrompt() },
      { role: 'user', content: `Persona: ${persona}\nQuestion: ${question}` },
    ], 8000);
    mark('plan', 'plan', 'Mapped the question onto the retail ontology',
      String(plan?.interpretation ?? 'Planner produced a governed query specification'), planStart);

    // ---------- 1b. ASK BACK (disambiguation before any data is touched) ----------
    const clarify = plan?.clarify;
    if (clarify && typeof clarify === 'object' && String(clarify.question ?? '').trim().length > 5) {
      const options = (Array.isArray(clarify.options) ? clarify.options : [])
        .map((o: unknown) => String(o).trim())
        .filter(Boolean)
        .slice(0, 4);
      if (options.length >= 2) {
        return new Response(JSON.stringify({
          question,
          persona,
          answerable: false,
          needsClarification: true,
          clarification: {
            question: String(clarify.question).trim(),
            why: String(clarify.why ?? 'The question has more than one valid reading.'),
            options,
          },
          interpretation: String(plan?.interpretation ?? ''),
          reasoning: steps,
          elapsedMs: Date.now() - started,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const win = defaultWindow();
    const rawQueries: QuerySpec[] = Array.isArray(plan?.queries) ? plan.queries.slice(0, 3) : [];
    const specs: QuerySpec[] = rawQueries.map((q, i) => ({
      id: q.id && /^[a-z0-9]+$/i.test(String(q.id)) ? String(q.id) : `q${i + 1}`,
      dataset: String(q.dataset ?? ''),
      metrics: Array.isArray(q.metrics) ? q.metrics.map(String) : [],
      dimension: q.dimension ? String(q.dimension) : null,
      filters: (q.filters ?? {}) as Record<string, string>,
      dateFrom: q.dateFrom ? String(q.dateFrom).slice(0, 10) : win.from,
      dateTo: q.dateTo ? String(q.dateTo).slice(0, 10) : win.to,
      sortBy: q.sortBy ? String(q.sortBy) : null,
      sortDir: q.sortDir === 'asc' ? 'asc' : 'desc',
      limit: Math.min(Number(q.limit ?? 10) || 10, 15),
    }));

    const rawScenarios = Array.isArray(plan?.scenarios) ? plan.scenarios.slice(0, 2) : [];
    const scenarioSpecs: ScenarioSpec[] = rawScenarios
      .filter((s: any) => SCENARIO_KINDS.includes(String(s?.kind) as any))
      .map((s: any, i: number) => ({
        id: s.id && /^s[a-z0-9]*$/i.test(String(s.id)) ? String(s.id) : `s${i + 1}`,
        kind: String(s.kind) as ScenarioSpec['kind'],
        entity: ['category', 'subcategory', 'brand', 'product', 'store', 'region'].includes(String(s.entity))
          ? (String(s.entity) as ScenarioSpec['entity'])
          : 'category',
        scope: Object.fromEntries(
          Object.entries((s.scope ?? {}) as Record<string, unknown>)
            .filter(([k, v]) => ['category', 'subcategory', 'brand', 'product_sku', 'store', 'region'].includes(k) && String(v ?? '').trim() !== '')
            .map(([k, v]) => [k, String(v).trim()]),
        ),
        levers: Object.fromEntries(
          Object.entries((s.levers ?? {}) as Record<string, unknown>)
            .filter(([, v]) => Number.isFinite(Number(v)))
            .map(([k, v]) => [k, Number(v)]),
        ),
        dateFrom: s.dateFrom ? String(s.dateFrom).slice(0, 10) : null,
        dateTo: s.dateTo ? String(s.dateTo).slice(0, 10) : null,
        limit: Math.min(Number(s.limit ?? 10) || 10, 15),
      }));

    if ((specs.length === 0 && scenarioSpecs.length === 0) || plan?.answerable === false) {
      return new Response(JSON.stringify({
        question,
        answerable: false,
        interpretation: String(plan?.interpretation ?? ''),
        headline:
          'I can only answer from governed retail data, and this question falls outside the connected datasets.',
        availableDomains: Object.values(datasets).map((d) => ({ id: d.id, module: d.module, description: d.description })),
        guardrail: { verifiedClaims: 0, rejectedClaims: 0, mode: 'refused' },
        elapsedMs: Date.now() - started,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---------- 2. EXECUTE ----------
    const lookups = await loadLookups(supabase);
    const factSets: FactSet[] = [];
    const executionErrors: string[] = [];
    const specById = new Map<string, QuerySpec>();
    for (const spec of specs) {
      const t = Date.now();
      specById.set(spec.id, spec);
      try {
        const fs = await executeQuery(supabase, spec, lookups);
        factSets.push(fs);
        mark(spec.id, 'execute', `Queried ${spec.dataset} (${fs.module})`,
          `${fs.rowsScanned.toLocaleString('en-US')} records at ${fs.grain}${spec.dimension ? ` grouped by ${spec.dimension}` : ''}`, t);
      } catch (err) {
        executionErrors.push(`${spec.dataset}: ${err instanceof Error ? err.message : 'query failed'}`);
        mark(spec.id, 'execute', `Query on ${spec.dataset} failed`, 'Dropped from the answer', t);
      }
    }

    // ---------- 2b. SIMULATE (predictive / prescriptive) ----------
    const scenarioSets: ScenarioSet[] = [];
    for (const spec of scenarioSpecs) {
      const t = Date.now();
      try {
        const sc = await runScenario(supabase, spec, lookups);
        scenarioSets.push(sc);
        mark(sc.id, 'simulate', `Simulated ${sc.title}`, `${sc.method} · ${sc.rowsScanned.toLocaleString('en-US')} records`, t);
      } catch (err) {
        executionErrors.push(`${spec.kind} scenario: ${err instanceof Error ? err.message : 'simulation failed'}`);
        mark(spec.id, 'simulate', `${spec.kind} simulation failed`, 'Dropped from the answer', t);
      }
    }

    if (factSets.length === 0 && scenarioSets.length === 0) {
      return new Response(JSON.stringify({
        question,
        answerable: false,
        headline: 'The governed datasets returned no records for this question, so no answer can be grounded.',
        errors: executionErrors,
        guardrail: { verifiedClaims: 0, rejectedClaims: 0, mode: 'no-data' },
        elapsedMs: Date.now() - started,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---------- 3-5. NARRATE -> GUARD -> EVALUATE -> SELF-CORRECT ----------
    const facts = compactFacts(factSets);
    const scenarioFacts = compactScenarios(scenarioSets);
    const index = buildFactIndex(factSets, scenarioSets);
    const lineage = buildLineageIndex(factSets, scenarioSets);

    const factBrief = `Persona: ${persona}
Question: ${question}
Planner interpretation: ${plan?.interpretation ?? ''}
FACTS (observed database results — the only source of actuals):
${JSON.stringify(facts)}
SCENARIOS (deterministic simulations of the future — the only source of projections):
${JSON.stringify(scenarioFacts)}`;

    const narrateAndGuard = async (attempt: number, repair: string | null) => {
      const nStart = Date.now();
      const narration = await callModel(apiKey, [
        { role: 'system', content: narratorPrompt(scenarioSets.length > 0) },
        { role: 'user', content: repair ? `${factBrief}\n\n${repair}` : factBrief },
      ], 8000);
      mark(
        `narrate-${attempt}`,
        'narrate',
        attempt === 1 ? 'Wrote the narrative with reference placeholders only' : 'Rewrote the narrative to fix the evaluator findings',
        attempt === 1
          ? 'The model may reference computed values but may not author digits'
          : 'Self-correction pass — the failing checks were fed back as instructions',
        nStart,
      );

      const gStart = Date.now();
      const headline = ground(narration?.headline, index);
      const insights = groundList(narration?.insights, index);
      const drivers = groundList(narration?.drivers, index);
      const projection = groundList(narration?.projection, index);
      const actions = groundList(narration?.actions, index);
      const caveats = groundList(narration?.caveats, index);
      const rejected = [...insights.rejected, ...drivers.rejected, ...projection.rejected, ...actions.rejected, ...caveats.rejected];
      const verified = insights.kept.length + drivers.kept.length + projection.kept.length + actions.kept.length + (headline?.ok ? 1 : 0);
      mark(
        `guard-${attempt}`,
        'guard',
        'Substituted every figure from code-computed values',
        `${verified} claims verified · ${rejected.length} rejected · ${index.size} groundable values`,
        gStart,
      );

      return {
        headline,
        insights,
        drivers,
        projection,
        actions,
        caveats,
        rejected,
        verified,
        confidence: ['high', 'medium', 'low'].includes(String(narration?.confidence)) ? String(narration.confidence) : 'medium',
      };
    };

    let pass = await narrateAndGuard(1, null);
    const evalStart1 = Date.now();
    let evaluation = evaluateAnswer(pass, factSets, scenarioSets, lineage);
    mark('evaluate-1', 'evaluate', `Evaluated the answer against ${evaluation.checks.length} deterministic checks`,
      `Score ${evaluation.score}/100 · ${evaluation.verdict}`, evalStart1);

    const attempts = [{ attempt: 1, score: evaluation.score, verdict: evaluation.verdict, rejectedClaims: pass.rejected.length }];
    let selfCorrected = false;

    if (!evaluation.passed) {
      const correctStart = Date.now();
      try {
        const retryPass = await narrateAndGuard(2, repairBrief(pass, evaluation));
        const retryEval = evaluateAnswer(retryPass, factSets, scenarioSets, lineage);
        attempts.push({ attempt: 2, score: retryEval.score, verdict: retryEval.verdict, rejectedClaims: retryPass.rejected.length });
        if (retryEval.score >= evaluation.score) {
          pass = retryPass;
          evaluation = retryEval;
          selfCorrected = true;
        }
        mark('evaluate-2', 'evaluate', selfCorrected ? 'Self-correction accepted' : 'Self-correction rejected — first answer scored higher',
          `Attempt 1 ${attempts[0].score}/100 → attempt 2 ${attempts[1].score}/100 · ${retryEval.verdict}`, correctStart);
      } catch (err) {
        mark('evaluate-2', 'evaluate', 'Self-correction pass failed', err instanceof Error ? err.message : 'retry error', correctStart);
      }
    }

    const { headline, insights, drivers, projection, actions, caveats, rejected, verified } = pass;

    // Deterministic fallback headline, built from facts only
    const primary = factSets[0] ?? (scenarioSets[0] as unknown as FactSet);
    const firstMetric = Object.values(primary.total.values)[0];
    const fallbackHeadline = `${firstMetric?.label ?? 'Result'} for the selected scope is ${firstMetric?.formatted ?? 'n/a'} across ${primary.rowsScanned.toLocaleString('en-US')} analysed records.`;

    // chart from facts or the scenario (never from the model)
    const chartSources: { rows: typeof primary.rows; total: typeof primary.total; dimensionLabel: string | null; id: string }[] = [
      ...factSets.map((fs) => ({ rows: fs.rows, total: fs.total, dimensionLabel: fs.dimensionLabel, id: fs.id })),
      ...scenarioSets.map((sc) => ({ rows: sc.rows, total: sc.total, dimensionLabel: sc.entityLabel, id: sc.id })),
    ];
    const preferScenario = scenarioSets.find((sc) => sc.rows.length > 0);
    const chartQuery =
      (preferScenario ? chartSources.find((c) => c.id === preferScenario.id) : null) ??
      chartSources.find((c) => c.id === String(plan?.chart?.query)) ??
      chartSources.find((c) => c.rows.length > 0) ??
      chartSources[0];
    const scenarioForChart = scenarioSets.find((sc) => sc.id === chartQuery.id);
    const chartMetric =
      (scenarioForChart && chartQuery.rows[0]?.values[scenarioForChart.chartMetric] ? scenarioForChart.chartMetric : null) ??
      (plan?.chart?.metric && chartQuery.rows[0]?.values[String(plan.chart.metric)] ? String(plan.chart.metric) : null) ??
      Object.keys(chartQuery.rows[0]?.values ?? chartQuery.total.values)[0];

    const response = {
      question,
      persona,
      answerable: true,
      interpretation: String(plan?.interpretation ?? ''),
      headline: headline?.ok ? headline.text : fallbackHeadline,
      insights: insights.kept,
      drivers: drivers.kept,
      projection: projection.kept,
      actions: actions.kept,
      caveats: caveats.kept.map((c) => c.text),
      confidence: ['high', 'medium', 'low'].includes(String(narration?.confidence)) ? String(narration.confidence) : 'medium',
      mode: scenarioSets.length > 0 ? 'predictive' : 'descriptive',
      scenarios: scenarioSets.map((sc) => ({
        id: sc.id,
        kind: sc.kind,
        module: sc.module,
        title: sc.title,
        method: sc.method,
        entity: sc.entityLabel,
        scope: sc.scope,
        levers: sc.levers,
        assumptions: sc.assumptions,
        window: sc.window,
        recordsAnalysed: sc.rowsScanned,
        tables: sc.tables,
        notes: sc.notes,
        total: sc.total,
        rows: sc.rows,
        chartMetric: sc.chartMetric,
      })),
      chart: {
        metric: chartMetric,
        metricLabel: chartQuery.rows[0]?.values[chartMetric]?.label ?? chartQuery.total.values[chartMetric]?.label ?? '',
        format: chartQuery.rows[0]?.values[chartMetric]?.format ?? 'number',
        dimension: chartQuery.dimensionLabel,
        data: chartQuery.rows.map((r) => ({
          name: r.label,
          value: r.values[chartMetric]?.value ?? 0,
          display: r.values[chartMetric]?.formatted ?? 'n/a',
        })),
      },
      facts: factSets.map((fs) => {
        const spec = specById.get(fs.id);
        const ds = datasets[fs.dataset];
        return {
          id: fs.id,
          dataset: fs.dataset,
          module: fs.module,
          grain: fs.grain,
          dimension: fs.dimensionLabel,
          filters: fs.filters,
          window: fs.window,
          recordsAnalysed: fs.rowsScanned,
          tables: fs.tables,
          notes: fs.notes,
          total: fs.total,
          rows: fs.rows,
          // provenance ledger — how every number in this fact set was produced
          provenance: {
            datasetDescription: ds?.description ?? '',
            table: ds?.table ?? fs.tables[0] ?? '',
            dateField: ds?.dateField ?? null,
            entities: (graphForDatasets([fs.dataset]).nodes ?? []).map((n) => n.label),
            metrics: Object.keys(fs.total.values).map((key) => ({
              key,
              label: ds?.metrics[key]?.label ?? key,
              agg: ds?.metrics[key]?.agg ?? 'sum',
              formula: ds?.metrics[key]?.definition ?? '',
            })),
            sql: spec
              ? sqlEquivalent({
                  dataset: fs.dataset,
                  metrics: spec.metrics,
                  dimension: spec.dimension,
                  filters: fs.filters,
                  window: fs.window,
                  limit: spec.limit,
                })
              : '',
          },
        };
      }),
      graph: graphForDatasets(factSets.map((fs) => fs.dataset)),
      reasoning: steps,
      modulesTouched: Array.from(new Set([...factSets.map((fs) => fs.module), ...scenarioSets.map((sc) => sc.module)])),
      guardrail: {
        mode: scenarioSets.length > 0 ? 'placeholder-substitution + coded simulation' : 'placeholder-substitution',
        verifiedClaims: verified,
        rejectedClaims: rejected.length,
        rejected,
        rule: 'Every figure — observed or projected — is substituted from a value computed in code; model-authored numbers are rejected.',
      },
      errors: executionErrors,
      elapsedMs: Date.now() - started,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ask-anything error', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
