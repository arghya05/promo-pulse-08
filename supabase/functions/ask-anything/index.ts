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
import { datasets, ontologyEdges, ontologyPromptSpec } from '../_shared/retail-ontology.ts';
import { executeQuery, loadLookups, type FactSet, type QuerySpec } from '../_shared/ontology-engine.ts';

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

Return JSON exactly:
{
  "interpretation": "one sentence restating the question in retail terms",
  "answerable": true,
  "modules": ["executive"],
  "queries": [
    {"id":"q1","dataset":"sales","metrics":["net_sales","gross_margin_pct"],"dimension":"category","filters":{},"dateFrom":"YYYY-MM-DD","dateTo":"YYYY-MM-DD","sortBy":"net_sales","sortDir":"desc","limit":10}
  ],
  "chart": {"query":"q1","metric":"net_sales","type":"bar"}
}
If the question cannot be answered from these datasets, return "answerable": false with an empty queries array and explain in "interpretation".`;
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

function narratorPrompt(): string {
  return `You are Maya, a senior merchandising analyst for a large US grocery retailer. You are answering an executive.

ABSOLUTE RULES (violations are automatically rejected by a guardrail):
1. You may NOT write any digit. Every number, currency amount, percentage, unit count or name-with-number must be a placeholder token of the form {{ref}} taken verbatim from the FACTS json (e.g. {{q1.total.net_sales}}, {{q1.3.margin_pct}}).
2. Entity names (categories, SKUs, stores, suppliers, competitors) must come from the "name" fields; reference them as {{q1.3.name}} so they stay exact.
3. Never state a fact that is not in FACTS. No benchmarks, no outside knowledge, no assumed causes. If FACTS do not support a claim, do not make it.
4. Causality: only say "correlates with" / "coincides with" unless FACTS include a causal metric. Recommendations must be tied to a placeholder metric.
5. Brevity: each bullet 15-25 words, format "[Metric or entity]: [insight] - [placeholder]".

Return JSON exactly:
{
  "headline": "one sentence direct answer, placeholders only for numbers",
  "insights": [{"text":"...", "refs":["q1.total.net_sales"]}],
  "drivers": [{"text":"...", "refs":["q1.2.net_sales"]}],
  "actions": [{"text":"...", "impact":"...", "refs":["q1.1.net_sales"]}],
  "caveats": ["what the data does NOT cover, if relevant"],
  "confidence": "high" | "medium" | "low"
}
3-5 insights, 0-4 drivers, 2-3 actions. Use "low" confidence when few records were analysed.`;
}

// ------------------------------ guardrail ----------------------------------

interface GroundedText {
  text: string;
  refs: string[];
  ok: boolean;
  violation?: string;
}

function buildFactIndex(factSets: FactSet[]) {
  const index = new Map<string, string>();
  for (const fs of factSets) {
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

  return { text: substituted, refs: used, ok: true };
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

// ------------------------------ handler ------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const started = Date.now();
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
    const plan = await callModel(apiKey, [
      { role: 'system', content: plannerPrompt() },
      { role: 'user', content: `Persona: ${persona}\nQuestion: ${question}` },
    ], 8000);

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

    if (specs.length === 0 || plan?.answerable === false) {
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
    for (const spec of specs) {
      try {
        factSets.push(await executeQuery(supabase, spec, lookups));
      } catch (err) {
        executionErrors.push(`${spec.dataset}: ${err instanceof Error ? err.message : 'query failed'}`);
      }
    }

    if (factSets.length === 0) {
      return new Response(JSON.stringify({
        question,
        answerable: false,
        headline: 'The governed datasets returned no records for this question, so no answer can be grounded.',
        errors: executionErrors,
        guardrail: { verifiedClaims: 0, rejectedClaims: 0, mode: 'no-data' },
        elapsedMs: Date.now() - started,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---------- 3. NARRATE ----------
    const facts = compactFacts(factSets);
    const narration = await callModel(apiKey, [
      { role: 'system', content: narratorPrompt() },
      {
        role: 'user',
        content: `Persona: ${persona}
Question: ${question}
Planner interpretation: ${plan?.interpretation ?? ''}
FACTS (the only truth you may use):
${JSON.stringify(facts)}`,
      },
    ], 8000);

    // ---------- 4. GUARD ----------
    const index = buildFactIndex(factSets);
    const headline = ground(narration?.headline, index);
    const insights = groundList(narration?.insights, index);
    const drivers = groundList(narration?.drivers, index);
    const actions = groundList(narration?.actions, index);
    const caveats = groundList(narration?.caveats, index);

    const rejected = [...insights.rejected, ...drivers.rejected, ...actions.rejected, ...caveats.rejected];
    const verified = insights.kept.length + drivers.kept.length + actions.kept.length + (headline?.ok ? 1 : 0);

    // Deterministic fallback headline, built from facts only
    const primary = factSets[0];
    const firstMetric = Object.values(primary.total.values)[0];
    const fallbackHeadline = `${firstMetric?.label ?? 'Result'} for the selected scope is ${firstMetric?.formatted ?? 'n/a'} across ${primary.rowsScanned.toLocaleString('en-US')} analysed records.`;

    // chart from facts (never from the model)
    const chartQuery = factSets.find((fs) => fs.id === String(plan?.chart?.query)) ?? factSets.find((fs) => fs.rows.length > 0) ?? primary;
    const chartMetric =
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
      actions: actions.kept,
      caveats: caveats.kept.map((c) => c.text),
      confidence: ['high', 'medium', 'low'].includes(String(narration?.confidence)) ? String(narration.confidence) : 'medium',
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
      facts: factSets.map((fs) => ({
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
      })),
      ontologyPath: ontologyEdges
        .filter((e) => factSets.some((fs) => datasets[fs.dataset]?.module && e.via.includes(datasets[fs.dataset].table.split('_')[0])))
        .slice(0, 6),
      modulesTouched: Array.from(new Set(factSets.map((fs) => fs.module))),
      guardrail: {
        mode: 'placeholder-substitution',
        verifiedClaims: verified,
        rejectedClaims: rejected.length,
        rejected,
        rule: 'Every figure is substituted from a computed database fact; model-authored numbers are rejected.',
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
