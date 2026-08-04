// ============================================================================
// ONTOLOGY QUERY ENGINE
// Executes validated plans against the governed datasets. All arithmetic runs
// here (never in the LLM), so every number the user sees is a database fact.
// ============================================================================

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { datasets, type Dataset, type MetricDef } from './retail-ontology.ts';

export interface QuerySpec {
  id: string;
  dataset: string;
  metrics: string[];
  dimension?: string | null;
  filters?: Record<string, string>;
  dateFrom?: string | null;
  dateTo?: string | null;
  sortBy?: string | null;
  sortDir?: 'asc' | 'desc';
  limit?: number;
}

export interface FactValue {
  metric: string;
  label: string;
  value: number | null;
  formatted: string;
  format: string;
}

export interface FactRow {
  ref: string;
  label: string;
  values: Record<string, FactValue>;
}

export interface FactSet {
  id: string;
  dataset: string;
  module: string;
  grain: string;
  dimension: string | null;
  dimensionLabel: string | null;
  filters: Record<string, string>;
  window: { from: string | null; to: string | null };
  rowsScanned: number;
  total: FactRow;
  rows: FactRow[];
  tables: string[];
  notes: string[];
}

// --------------------------- formatting ------------------------------------

export function formatValue(value: number | null, format: string): string {
  if (value === null || !Number.isFinite(value)) return 'n/a';
  switch (format) {
    case 'currency': {
      const abs = Math.abs(value);
      if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
      if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
      if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
      return `$${value.toFixed(2)}`;
    }
    case 'pct':
      return `${value.toFixed(1)}%`;
    case 'days':
      return `${value.toFixed(1)} days`;
    case 'ratio':
      return value.toFixed(2);
    default: {
      const abs = Math.abs(value);
      if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
      if (abs >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
  }
}

// --------------------------- dimension lookups ------------------------------

interface Lookups {
  products: Map<string, Record<string, unknown>>;
  stores: Map<string, Record<string, unknown>>;
  suppliers: Map<string, Record<string, unknown>>;
  planograms: Map<string, Record<string, unknown>>;
  promotions: Map<string, Record<string, unknown>>;
}

let lookupCache: Lookups | null = null;

async function fetchAll(
  supabase: SupabaseClient,
  table: string,
  select: string,
  maxRows: number,
  build?: (q: any) => any,
): Promise<Record<string, unknown>[]> {
  const page = 1000;
  const out: Record<string, unknown>[] = [];
  for (let offset = 0; offset < maxRows; offset += page) {
    let query = supabase.from(table).select(select);
    if (build) query = build(query);
    const { data, error } = await query.range(offset, offset + page - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...(data as Record<string, unknown>[]));
    if (data.length < page) break;
  }
  return out;
}

export async function loadLookups(supabase: SupabaseClient): Promise<Lookups> {
  if (lookupCache) return lookupCache;
  const [products, stores, suppliers, planograms, promotions] = await Promise.all([
    fetchAll(supabase, 'products', 'product_sku,product_name,category,subcategory,brand,base_price,cost', 200000),
    fetchAll(supabase, 'stores', 'id,store_name,store_code,region,store_format,store_type,country,district', 20000),
    fetchAll(supabase, 'suppliers', 'id,supplier_name,lead_time_days,reliability_score,country', 20000),
    fetchAll(supabase, 'planograms', 'id,planogram_name,category,store_type,status', 20000),
    fetchAll(supabase, 'promotions', 'id,promotion_name,promotion_type,promo_mechanism,product_category', 20000),
  ]);

  lookupCache = {
    products: new Map(products.map((p) => [String(p.product_sku), p])),
    stores: new Map(stores.map((s) => [String(s.id), s])),
    suppliers: new Map(suppliers.map((s) => [String(s.id), s])),
    planograms: new Map(planograms.map((p) => [String(p.id), p])),
    promotions: new Map(promotions.map((p) => [String(p.id), p])),
  };
  return lookupCache;
}

// --------------------------- enrichment ------------------------------------

function monthLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });
}

function weekLabel(iso: string): string {
  const d = new Date(iso);
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function enrichRow(row: Record<string, unknown>, ds: Dataset, lookups: Lookups) {
  const r = row as Record<string, any>;

  if (ds.enrich?.includes('product')) {
    const p = lookups.products.get(String(r.product_sku));
    r.product_name = r.product_name ?? p?.product_name ?? r.product_sku;
    r.product_category = p?.category ?? 'Unmapped';
    r.product_subcategory = p?.subcategory ?? 'Unmapped';
    r.product_brand = p?.brand ?? 'Unmapped';
    r.product_label = `${p?.product_name ?? r.product_name ?? r.product_sku} (${r.product_sku})`;
    if (r.stock_level !== undefined) {
      r.retail_value = Number(r.stock_level) * Number(p?.base_price ?? 0);
      r.cost_value = Number(r.stock_level) * Number(p?.cost ?? 0);
    }
  }
  if (ds.enrich?.includes('store')) {
    const s = lookups.stores.get(String(r.store_id));
    r.store_name = s ? `${s.store_name}` : 'Unassigned';
    r.store_region = s?.region ?? 'Unassigned';
    r.store_format = s?.store_format ?? s?.store_type ?? 'Unassigned';
  }
  if (ds.enrich?.includes('supplier')) {
    const s = lookups.suppliers.get(String(r.supplier_id));
    r.supplier_name = s?.supplier_name ?? 'Unassigned';
    r.supplier_lead_time_days = s?.lead_time_days ?? null;
    r.supplier_reliability = s?.reliability_score ?? null;
  }
  if (ds.enrich?.includes('planogram')) {
    const p = lookups.planograms.get(String(r.planogram_id));
    r.planogram_name = p?.planogram_name ?? 'Unassigned';
    if (!r.product_category || r.product_category === 'Unmapped') r.product_category = p?.category ?? 'Unmapped';
    r.linear_inches = Number(r.facings ?? 0) * Number(r.width_inches ?? 0);
  }
  if (ds.enrich?.includes('promotion')) {
    const p = r.promotion_id ? lookups.promotions.get(String(r.promotion_id)) : null;
    r.promotion_label = p?.promotion_name ?? 'Non-promoted';
    r.is_promoted = r.promotion_id ? 'yes' : 'no';
  }

  // derived helpers used by ratio metrics
  r.event_one = 1;
  if (r.net_sales !== undefined && r.net_sales_ly !== undefined) {
    r.net_sales_delta = Number(r.net_sales ?? 0) - Number(r.net_sales_ly ?? 0);
  }
  if (r.forecasted_units !== undefined && r.actual_units !== undefined && r.actual_units !== null) {
    r.abs_error = Math.abs(Number(r.forecasted_units) - Number(r.actual_units));
    r.signed_error = Number(r.forecasted_units) - Number(r.actual_units);
  }
  if (r.original_price !== undefined && r.markdown_price !== undefined) {
    r.markdown_delta = Number(r.original_price) - Number(r.markdown_price);
  }

  if (ds.dateField && r[ds.dateField]) {
    const iso = String(r[ds.dateField]).slice(0, 10);
    r.period_month = monthLabel(iso);
    r.period_week = weekLabel(iso);
  }
  return r;
}

// --------------------------- aggregation ------------------------------------

function computeMetric(rows: Record<string, any>[], def: MetricDef): number | null {
  if (rows.length === 0) return null;
  const num = (v: unknown) => (v === null || v === undefined || v === '' ? NaN : Number(v));

  switch (def.agg) {
    case 'count':
      return rows.length;
    case 'sum': {
      let s = 0;
      let seen = 0;
      for (const r of rows) {
        const v = num(r[def.field!]);
        if (Number.isFinite(v)) { s += v; seen++; }
      }
      return seen ? s : null;
    }
    case 'avg': {
      let s = 0;
      let n = 0;
      for (const r of rows) {
        const v = num(r[def.field!]);
        if (Number.isFinite(v)) { s += v; n++; }
      }
      return n ? s / n : null;
    }
    case 'wavg': {
      let s = 0;
      let w = 0;
      for (const r of rows) {
        const v = num(r[def.field!]);
        const wt = num(r[def.weight!]);
        if (Number.isFinite(v) && Number.isFinite(wt)) { s += v * wt; w += wt; }
      }
      return w ? s / w : null;
    }
    case 'ratio': {
      let n = 0;
      let d = 0;
      for (const r of rows) {
        const a = num(r[def.num!]);
        const b = num(r[def.den!]);
        if (Number.isFinite(a)) n += a;
        if (Number.isFinite(b)) d += b;
      }
      if (!d) return null;
      return (n / d) * (def.scale ?? 1);
    }
    case 'share': {
      let hit = 0;
      for (const r of rows) if (def.when!(r)) hit++;
      return (hit / rows.length) * (def.scale ?? 1);
    }
    default:
      return null;
  }
}

function buildRow(ref: string, label: string, rows: Record<string, any>[], ds: Dataset, metrics: string[]): FactRow {
  const values: Record<string, FactValue> = {};
  for (const key of metrics) {
    const def = ds.metrics[key];
    if (!def) continue;
    const value = computeMetric(rows, def);
    values[key] = {
      metric: key,
      label: def.label,
      value: value === null ? null : Number(value.toFixed(4)),
      formatted: formatValue(value, def.format),
      format: def.format,
    };
  }
  return { ref, label, values };
}

// --------------------------- execution -------------------------------------

export function validateQuery(spec: QuerySpec): { ok: true; ds: Dataset } | { ok: false; reason: string } {
  const ds = datasets[spec.dataset];
  if (!ds) return { ok: false, reason: `Unknown dataset "${spec.dataset}"` };
  const metrics = (spec.metrics ?? []).filter((k) => ds.metrics[k]);
  if (metrics.length === 0) return { ok: false, reason: `No valid metrics for dataset "${ds.id}"` };
  spec.metrics = metrics;
  if (spec.dimension && !ds.dimensions[spec.dimension]) spec.dimension = null;
  if (spec.sortBy && !ds.metrics[spec.sortBy]) spec.sortBy = metrics[0];
  const cleanFilters: Record<string, string> = {};
  for (const [k, v] of Object.entries(spec.filters ?? {})) {
    if (ds.filters[k] && v !== null && v !== undefined && String(v).trim() !== '') cleanFilters[k] = String(v).trim();
  }
  spec.filters = cleanFilters;
  return { ok: true, ds };
}

export async function executeQuery(
  supabase: SupabaseClient,
  spec: QuerySpec,
  lookups: Lookups,
): Promise<FactSet> {
  const validated = validateQuery(spec);
  if (!validated.ok) throw new Error(validated.reason);
  const ds = validated.ds;
  const notes: string[] = [];

  const pushdown = Object.entries(spec.filters ?? {}).filter(([k]) => ds.filters[k].column);
  const rawRows = await fetchAll(supabase, ds.table, ds.select, ds.maxRows, (q: any) => {
    let query = q;
    if (ds.dateField && spec.dateFrom) query = query.gte(ds.dateField, spec.dateFrom);
    if (ds.dateField && spec.dateTo) query = query.lte(ds.dateField, spec.dateTo);
    for (const [key, value] of pushdown) {
      const f = ds.filters[key];
      query = f.match === 'ilike' ? query.ilike(f.column!, `%${value}%`) : query.eq(f.column!, value);
    }
    if (ds.dateField) query = query.order(ds.dateField, { ascending: false });
    return query;
  });

  let rows = rawRows.map((r) => enrichRow({ ...r }, ds, lookups));

  // post-filters on enriched fields
  for (const [key, value] of Object.entries(spec.filters ?? {})) {
    const f = ds.filters[key];
    if (f.column) continue;
    const needle = value.toLowerCase();
    rows = rows.filter((r) => String(r[f.field] ?? '').toLowerCase().includes(needle));
  }

  if (rows.length === 0) notes.push('No records matched these filters, so no numbers are reported.');

  const total = buildRow(`${spec.id}.total`, 'All matching records', rows, ds, spec.metrics);

  let factRows: FactRow[] = [];
  if (spec.dimension) {
    const dim = ds.dimensions[spec.dimension];
    const groups = new Map<string, Record<string, any>[]>();
    for (const r of rows) {
      const key = String(r[dim.field] ?? 'Unassigned');
      const bucket = groups.get(key);
      if (bucket) bucket.push(r);
      else groups.set(key, [r]);
    }
    const sortMetric = spec.sortBy ?? spec.metrics[0];
    const dir = spec.sortDir === 'asc' ? 1 : -1;
    factRows = Array.from(groups.entries())
      .map(([label, groupRows], i) => buildRow(`${spec.id}.${i + 1}`, label, groupRows, ds, spec.metrics))
      .sort((a, b) => {
        const av = a.values[sortMetric]?.value ?? -Infinity;
        const bv = b.values[sortMetric]?.value ?? -Infinity;
        return (av - bv) * dir;
      })
      .slice(0, Math.min(spec.limit ?? 10, 25))
      .map((row, i) => ({ ...row, ref: `${spec.id}.${i + 1}` }));
  }

  if (rows.length >= ds.maxRows) {
    notes.push(`Scan capped at ${ds.maxRows.toLocaleString('en-US')} most recent records for this dataset.`);
  }

  const tables = [ds.table, ...(ds.enrich ?? []).map((e) =>
    e === 'product' ? 'products' : e === 'store' ? 'stores' : e === 'supplier' ? 'suppliers' : e === 'planogram' ? 'planograms' : 'promotions',
  )];

  return {
    id: spec.id,
    dataset: ds.id,
    module: ds.module,
    grain: ds.grain,
    dimension: spec.dimension ?? null,
    dimensionLabel: spec.dimension ? ds.dimensions[spec.dimension].label : null,
    filters: spec.filters ?? {},
    window: { from: spec.dateFrom ?? null, to: spec.dateTo ?? null },
    rowsScanned: rows.length,
    total,
    rows: factRows,
    tables: Array.from(new Set(tables)),
    notes,
  };
}
