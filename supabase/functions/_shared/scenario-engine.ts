// ============================================================================
// SCENARIO ENGINE — predictive & prescriptive simulation
//
// Every projection here is computed in TypeScript from database facts:
//   forecast      trailing-series trend + seasonality projection
//   price         own-price elasticity (products.price_elasticity)
//   promotion     depth × elasticity uplift, funded spend, incremental ROI
//   planogram     space elasticity on facings / linear inches
//   assortment    tail rationalisation with demand-transfer assumption
//   replenishment safety stock, reorder point, cover and order-now quantity
//
// The LLM may only choose the scenario + levers. It never produces a number.
// ============================================================================

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { formatValue, type FactRow, type FactValue } from './ontology-engine.ts';

export type ScenarioKind =
  | 'forecast'
  | 'price'
  | 'promotion'
  | 'planogram'
  | 'assortment'
  | 'replenishment'
  | 'markdown'
  | 'supplier_risk'
  | 'stockout_risk'
  | 'plan';

export interface ScenarioSpec {
  id: string;
  kind: ScenarioKind;
  entity?: 'category' | 'subcategory' | 'brand' | 'product' | 'store' | 'region';
  scope?: Record<string, string>;
  levers?: Record<string, number>;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit?: number;
}

export interface ScenarioSet {
  id: string;
  kind: ScenarioKind;
  module: string;
  title: string;
  method: string;
  entityLabel: string;
  scope: Record<string, string>;
  levers: Record<string, string>;
  assumptions: string[];
  window: { from: string | null; to: string | null };
  rowsScanned: number;
  total: FactRow;
  rows: FactRow[];
  extra: FactRow[];
  tables: string[];
  notes: string[];
  chartMetric: string;
}

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function fv(metric: string, label: string, value: number | null, format: string): FactValue {
  return {
    metric,
    label,
    value: value === null || !Number.isFinite(value) ? null : Number(value.toFixed(4)),
    formatted: formatValue(value, format),
    format,
  };
}

function row(ref: string, label: string, values: Record<string, FactValue>): FactRow {
  return { ref, label, values };
}

async function fetchPaged(
  supabase: SupabaseClient,
  table: string,
  select: string,
  maxRows: number,
  build?: (q: any) => any,
): Promise<Record<string, any>[]> {
  const page = 1000;
  const out: Record<string, any>[] = [];
  for (let offset = 0; offset < maxRows; offset += page) {
    let q = supabase.from(table).select(select);
    if (build) q = build(q);
    const { data, error } = await q.range(offset, offset + page - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...(data as Record<string, any>[]));
    if (data.length < page) break;
  }
  return out;
}

// --------------------------- baseline ---------------------------------------

interface BaseEntity {
  key: string;
  label: string;
  units: number;
  sales: number;
  margin: number;
  cogs: number;
  elasticitySum: number;
  elasticityWeight: number;
  skus: Set<string>;
  weekly: Map<string, number>;
  weeklySales: Map<string, number>;
}

interface Baseline {
  entities: BaseEntity[];
  rowsScanned: number;
  from: string;
  to: string;
  weeks: number;
  weekKeys: string[];
  /** units sold per store|sku position, used for position-level cover and availability maths */
  positionUnits: Map<string, number>;
}

function weekKey(isoDate: string): string {
  const d = new Date(isoDate);
  const day = (d.getUTCDay() + 6) % 7; // Monday start
  const monday = new Date(d.getTime() - day * DAY);
  return iso(monday);
}

function entityKeyFor(spec: ScenarioSpec, r: Record<string, any>, product: Record<string, any> | undefined, store: Record<string, any> | undefined) {
  switch (spec.entity) {
    case 'product':
      return {
        key: String(r.product_sku),
        label: `${product?.product_name ?? r.product_name ?? r.product_sku} (${r.product_sku})`,
      };
    case 'subcategory':
      return { key: String(product?.subcategory ?? 'Unmapped'), label: String(product?.subcategory ?? 'Unmapped') };
    case 'brand':
      return { key: String(product?.brand ?? 'Unmapped'), label: String(product?.brand ?? 'Unmapped') };
    case 'store':
      return { key: String(r.store_id ?? 'na'), label: String(store?.store_name ?? 'Unassigned') };
    case 'region':
      return { key: String(store?.region ?? 'Unassigned'), label: String(store?.region ?? 'Unassigned') };
    default:
      return { key: String(product?.category ?? 'Unmapped'), label: String(product?.category ?? 'Unmapped') };
  }
}

function scopeMatches(spec: ScenarioSpec, product: Record<string, any> | undefined, store: Record<string, any> | undefined, sku: string) {
  const s = spec.scope ?? {};
  // scope values may list several members ("Bakery and Pantry", "dairy, produce") — any match passes
  const terms = (raw: string) =>
    String(raw)
      .split(/,|\band\b|\bor\b|\/|\|/i)
      .map((t) => t.trim())
      .filter((t) => t.length > 1);
  const has = (v: unknown, raw: string) => {
    const hay = String(v ?? '').toLowerCase();
    const list = terms(raw);
    if (list.length === 0) return true;
    return list.some((t) => hay.includes(t.toLowerCase()));
  };
  if (s.category && !has(product?.category, s.category)) return false;
  if (s.subcategory && !has(product?.subcategory, s.subcategory)) return false;
  if (s.brand && !has(product?.brand, s.brand)) return false;
  if (s.product_sku && !has(sku, s.product_sku) && !has(product?.product_name, s.product_sku)) return false;
  if (s.store && !has(store?.store_name, s.store)) return false;
  if (s.region && !has(store?.region, s.region)) return false;
  return true;
}

async function loadBaseline(supabase: SupabaseClient, spec: ScenarioSpec, lookups: any): Promise<Baseline> {
  const to = spec.dateTo ?? iso(new Date());
  const from = spec.dateFrom ?? iso(new Date(new Date(to).getTime() - 182 * DAY));

  const rows = await fetchPaged(
    supabase,
    'transactions',
    'transaction_date,store_id,product_sku,product_name,quantity,unit_price,net_sales,total_amount,discount_amount,cost_of_goods_sold,margin',
    30000,
    (q: any) =>
      q
        .gte('transaction_date', from)
        .lte('transaction_date', `${to}T23:59:59`)
        .order('transaction_date', { ascending: false }),
  );

  const map = new Map<string, BaseEntity>();
  const weekKeys = new Set<string>();
  const positionUnits = new Map<string, number>();
  let scanned = 0;

  for (const r of rows) {
    const sku = String(r.product_sku);
    const product = lookups.products.get(sku);
    const store = lookups.stores.get(String(r.store_id));
    if (!scopeMatches(spec, product, store, sku)) continue;
    scanned++;

    const { key, label } = entityKeyFor(spec, r, product, store);
    let e = map.get(key);
    if (!e) {
      e = {
        key,
        label,
        units: 0,
        sales: 0,
        margin: 0,
        cogs: 0,
        elasticitySum: 0,
        elasticityWeight: 0,
        skus: new Set(),
        weekly: new Map(),
        weeklySales: new Map(),
      };
      map.set(key, e);
    }
    const units = num(r.quantity);
    const sales = num(r.net_sales) || num(r.total_amount);
    e.units += units;
    e.sales += sales;
    e.margin += num(r.margin);
    e.cogs += num(r.cost_of_goods_sold);
    e.skus.add(sku);
    const elasticity = Number(product?.price_elasticity);
    if (Number.isFinite(elasticity)) {
      e.elasticitySum += elasticity * sales;
      e.elasticityWeight += sales;
    }
    const wk = weekKey(String(r.transaction_date).slice(0, 10));
    weekKeys.add(wk);
    e.weekly.set(wk, (e.weekly.get(wk) ?? 0) + units);
    e.weeklySales.set(wk, (e.weeklySales.get(wk) ?? 0) + sales);
    const posKey = `${r.store_id}|${sku}`;
    positionUnits.set(posKey, (positionUnits.get(posKey) ?? 0) + units);
  }

  const spanWeeks = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / (7 * DAY)));
  return {
    entities: Array.from(map.values()).sort((a, b) => b.sales - a.sales),
    rowsScanned: scanned,
    from,
    to,
    weeks: spanWeeks,
    weekKeys: Array.from(weekKeys).sort(),
    positionUnits,
  };
}

const elasticityOf = (e: BaseEntity) => (e.elasticityWeight > 0 ? e.elasticitySum / e.elasticityWeight : -1.5);

// --------------------------- scenarios --------------------------------------

function linearTrend(series: number[]): { slope: number; intercept: number; sigma: number } {
  const n = series.length;
  if (n < 2) return { slope: 0, intercept: series[0] ?? 0, sigma: 0 };
  const meanX = (n - 1) / 2;
  const meanY = series.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (i - meanX) * (series[i] - meanY);
    sxx += (i - meanX) ** 2;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = meanY - slope * meanX;
  let se = 0;
  for (let i = 0; i < n; i++) se += (series[i] - (intercept + slope * i)) ** 2;
  return { slope, intercept, sigma: Math.sqrt(se / Math.max(1, n - 2)) };
}

function seriesFor(e: BaseEntity, weekKeys: string[]) {
  // drop the trailing partial week so the trend is not biased down
  const keys = weekKeys.slice(0, Math.max(1, weekKeys.length - 1));
  return keys.map((k) => e.weekly.get(k) ?? 0);
}

function buildForecast(b: Baseline, spec: ScenarioSpec): ScenarioSet {
  const horizon = Math.min(Math.max(Math.round(spec.levers?.horizonWeeks ?? 13), 1), 52);
  const rows: FactRow[] = [];
  let tUnits = 0;
  let tSales = 0;
  let tBaseUnits = 0;
  let tLow = 0;
  let tHigh = 0;

  const ranked = b.entities.slice(0, Math.min(spec.limit ?? 10, 15));
  for (const [i, e] of ranked.entries()) {
    const series = seriesFor(e, b.weekKeys);
    const { slope, intercept, sigma } = linearTrend(series);
    const n = series.length;
    let projUnits = 0;
    for (let h = 1; h <= horizon; h++) projUnits += Math.max(0, intercept + slope * (n - 1 + h));
    const asp = e.units > 0 ? e.sales / e.units : 0;
    const marginRate = e.sales > 0 ? e.margin / e.sales : 0;
    const baseUnits = (e.units / Math.max(1, n)) * horizon;
    const band = 1.28 * sigma * Math.sqrt(horizon);
    const low = Math.max(0, projUnits - band);
    const high = projUnits + band;

    tUnits += projUnits;
    tSales += projUnits * asp;
    tBaseUnits += baseUnits;
    tLow += low;
    tHigh += high;

    rows.push(
      row(`${spec.id}.${i + 1}`, e.label, {
        forecast_units: fv('forecast_units', `Forecast units (next ${horizon}w)`, projUnits, 'number'),
        forecast_sales: fv('forecast_sales', `Forecast net sales (next ${horizon}w)`, projUnits * asp, 'currency'),
        forecast_margin: fv('forecast_margin', 'Forecast gross margin', projUnits * asp * marginRate, 'currency'),
        run_rate_units: fv('run_rate_units', 'Flat run-rate units', baseUnits, 'number'),
        growth_vs_run_rate_pct: fv('growth_vs_run_rate_pct', 'Forecast vs run-rate', baseUnits > 0 ? ((projUnits - baseUnits) / baseUnits) * 100 : null, 'pct'),
        weekly_trend_units: fv('weekly_trend_units', 'Weekly trend (units/week)', slope, 'number'),
        forecast_low: fv('forecast_low', 'Low case (80% band)', low, 'number'),
        forecast_high: fv('forecast_high', 'High case (80% band)', high, 'number'),
      }),
    );
  }

  const totalAsp = b.entities.reduce((a, e) => a + e.sales, 0) / Math.max(1, b.entities.reduce((a, e) => a + e.units, 0));
  const total = row(`${spec.id}.total`, `All in scope (${horizon}-week horizon)`, {
    forecast_units: fv('forecast_units', 'Forecast units', tUnits, 'number'),
    forecast_sales: fv('forecast_sales', 'Forecast net sales', tSales, 'currency'),
    run_rate_units: fv('run_rate_units', 'Flat run-rate units', tBaseUnits, 'number'),
    growth_vs_run_rate_pct: fv('growth_vs_run_rate_pct', 'Forecast vs run-rate', tBaseUnits > 0 ? ((tUnits - tBaseUnits) / tBaseUnits) * 100 : null, 'pct'),
    forecast_low: fv('forecast_low', 'Low case (80% band)', tLow, 'number'),
    forecast_high: fv('forecast_high', 'High case (80% band)', tHigh, 'number'),
    avg_selling_price: fv('avg_selling_price', 'Avg selling price used', totalAsp, 'currency'),
  });

  return {
    id: spec.id,
    kind: 'forecast',
    module: 'demand',
    title: `Demand forecast — next ${horizon} weeks`,
    method: 'Ordinary-least-squares trend on weekly POS units per entity, projected over the horizon with an 80% prediction band from the residual standard error.',
    entityLabel: spec.entity ?? 'category',
    scope: spec.scope ?? {},
    levers: { horizonWeeks: `${horizon} weeks` },
    assumptions: [
      'Selling price and margin rate stay at the trailing-period average.',
      'No new promotions, price changes or distribution changes are applied.',
      'The 80% band is a statistical residual band, not a supply-constrained range.',
    ],
    window: { from: b.from, to: b.to },
    rowsScanned: b.rowsScanned,
    total,
    rows,
    extra: [],
    tables: ['transactions', 'products', 'stores'],
    notes: [],
    chartMetric: 'forecast_sales',
  };
}

function buildPrice(b: Baseline, spec: ScenarioSpec): ScenarioSet {
  const pricePct = spec.levers?.pricePct ?? 3;
  const passThrough = Math.min(Math.max(spec.levers?.passThrough ?? 1, 0), 1);
  const rows: FactRow[] = [];
  let tSalesDelta = 0;
  let tMarginDelta = 0;
  let tUnitDelta = 0;
  let tNewSales = 0;
  let tNewMargin = 0;

  const ranked = b.entities.slice(0, Math.min(spec.limit ?? 10, 15));
  for (const [i, e] of ranked.entries()) {
    const el = elasticityOf(e);
    const unitChangePct = el * pricePct * passThrough;
    const newUnits = e.units * (1 + unitChangePct / 100);
    const asp = e.units > 0 ? e.sales / e.units : 0;
    const newAsp = asp * (1 + pricePct / 100);
    const unitCost = e.units > 0 ? (e.sales - e.margin) / e.units : 0;
    const newSales = newUnits * newAsp;
    const newMargin = newUnits * (newAsp - unitCost);

    tSalesDelta += newSales - e.sales;
    tMarginDelta += newMargin - e.margin;
    tUnitDelta += newUnits - e.units;
    tNewSales += newSales;
    tNewMargin += newMargin;

    rows.push(
      row(`${spec.id}.${i + 1}`, e.label, {
        baseline_sales: fv('baseline_sales', 'Baseline net sales', e.sales, 'currency'),
        simulated_sales: fv('simulated_sales', 'Simulated net sales', newSales, 'currency'),
        sales_delta: fv('sales_delta', 'Net sales impact', newSales - e.sales, 'currency'),
        margin_delta: fv('margin_delta', 'Gross margin impact', newMargin - e.margin, 'currency'),
        unit_change_pct: fv('unit_change_pct', 'Volume response', unitChangePct, 'pct'),
        elasticity: fv('elasticity', 'Own-price elasticity', el, 'ratio'),
        baseline_price: fv('baseline_price', 'Baseline avg price', asp, 'currency'),
        simulated_price: fv('simulated_price', 'Simulated avg price', newAsp, 'currency'),
      }),
    );
  }

  const baseSales = b.entities.reduce((a, e) => a + e.sales, 0);
  const baseMargin = b.entities.reduce((a, e) => a + e.margin, 0);
  const baseUnits = b.entities.reduce((a, e) => a + e.units, 0);
  const total = row(`${spec.id}.total`, `All in scope at ${pricePct > 0 ? '+' : ''}${pricePct}% price`, {
    baseline_sales: fv('baseline_sales', 'Baseline net sales', baseSales, 'currency'),
    simulated_sales: fv('simulated_sales', 'Simulated net sales', tNewSales, 'currency'),
    sales_delta: fv('sales_delta', 'Net sales impact', tSalesDelta, 'currency'),
    sales_delta_pct: fv('sales_delta_pct', 'Net sales impact %', baseSales > 0 ? (tSalesDelta / baseSales) * 100 : null, 'pct'),
    baseline_margin: fv('baseline_margin', 'Baseline gross margin', baseMargin, 'currency'),
    simulated_margin: fv('simulated_margin', 'Simulated gross margin', tNewMargin, 'currency'),
    margin_delta: fv('margin_delta', 'Gross margin impact', tMarginDelta, 'currency'),
    unit_delta: fv('unit_delta', 'Unit impact', tUnitDelta, 'number'),
    unit_change_pct: fv('unit_change_pct', 'Volume response', baseUnits > 0 ? (tUnitDelta / baseUnits) * 100 : null, 'pct'),
  });

  return {
    id: spec.id,
    kind: 'price',
    module: 'pricing',
    title: `Price move simulation — ${pricePct > 0 ? '+' : ''}${pricePct}%`,
    method: 'Own-price elasticity from the product master applied to trailing POS volume; margin recomputed at actual unit cost with full price pass-through to shelf.',
    entityLabel: spec.entity ?? 'category',
    scope: spec.scope ?? {},
    levers: { pricePct: `${pricePct > 0 ? '+' : ''}${pricePct}%`, passThrough: `${Math.round(passThrough * 100)}%` },
    assumptions: [
      'Elasticity is the trailing sales-weighted product elasticity and is assumed stable over the price range.',
      'Competitor prices, promotions and assortment stay unchanged.',
      'Unit cost stays at the trailing average; no supplier cost renegotiation.',
    ],
    window: { from: b.from, to: b.to },
    rowsScanned: b.rowsScanned,
    total,
    rows,
    extra: [],
    tables: ['transactions', 'products'],
    notes: [],
    chartMetric: 'margin_delta',
  };
}

function buildPromotion(b: Baseline, spec: ScenarioSpec): ScenarioSet {
  const depth = Math.abs(spec.levers?.discountPct ?? 15);
  const weeks = Math.min(Math.max(Math.round(spec.levers?.weeks ?? 2), 1), 13);
  const displayLift = spec.levers?.displayLiftPct ?? 20; // incremental lift from display/feature support
  const fundingRate = Math.min(Math.max(spec.levers?.vendorFundingPct ?? 30, 0), 100);
  const rows: FactRow[] = [];
  let tIncSales = 0;
  let tIncMargin = 0;
  let tSpend = 0;
  let tPromoSales = 0;

  const weeksInBase = Math.max(1, b.weekKeys.length - 1);
  const ranked = b.entities.slice(0, Math.min(spec.limit ?? 10, 15));
  for (const [i, e] of ranked.entries()) {
    const el = elasticityOf(e);
    const baseUnits = (e.units / weeksInBase) * weeks;
    const asp = e.units > 0 ? e.sales / e.units : 0;
    const unitCost = e.units > 0 ? (e.sales - e.margin) / e.units : 0;
    const liftPct = Math.abs(el) * depth + displayLift;
    const promoUnits = baseUnits * (1 + liftPct / 100);
    const incUnits = promoUnits - baseUnits;
    const promoPrice = asp * (1 - depth / 100);
    const promoSales = promoUnits * promoPrice;
    const baseSales = baseUnits * asp;
    const grossSpend = promoUnits * (asp - promoPrice);
    const netSpend = grossSpend * (1 - fundingRate / 100);
    const promoMargin = promoUnits * (promoPrice - unitCost);
    const baseMargin = baseUnits * (asp - unitCost);
    const incMargin = promoMargin + grossSpend * (fundingRate / 100) - baseMargin;
    const roi = netSpend > 0 ? incMargin / netSpend : null;

    tIncSales += promoSales - baseSales;
    tIncMargin += incMargin;
    tSpend += netSpend;
    tPromoSales += promoSales;

    rows.push(
      row(`${spec.id}.${i + 1}`, e.label, {
        promo_sales: fv('promo_sales', 'Promoted period sales', promoSales, 'currency'),
        incremental_sales: fv('incremental_sales', 'Incremental sales', promoSales - baseSales, 'currency'),
        incremental_units: fv('incremental_units', 'Incremental units', incUnits, 'number'),
        uplift_pct: fv('uplift_pct', 'Modelled volume uplift', liftPct, 'pct'),
        trade_spend: fv('trade_spend', 'Net trade spend', netSpend, 'currency'),
        incremental_margin: fv('incremental_margin', 'Incremental margin', incMargin, 'currency'),
        roi: fv('roi', 'Incremental margin ROI', roi, 'ratio'),
        promo_price: fv('promo_price', 'Promoted price', promoPrice, 'currency'),
      }),
    );
  }

  const total = row(`${spec.id}.total`, `All in scope at ${depth}% off for ${weeks} weeks`, {
    promo_sales: fv('promo_sales', 'Promoted period sales', tPromoSales, 'currency'),
    incremental_sales: fv('incremental_sales', 'Incremental sales', tIncSales, 'currency'),
    trade_spend: fv('trade_spend', 'Net trade spend', tSpend, 'currency'),
    incremental_margin: fv('incremental_margin', 'Incremental margin', tIncMargin, 'currency'),
    roi: fv('roi', 'Incremental margin ROI', tSpend > 0 ? tIncMargin / tSpend : null, 'ratio'),
    breakeven_uplift_pct: fv('breakeven_uplift_pct', 'Breakeven uplift needed', tPromoSales > 0 ? (tSpend / Math.max(1, tPromoSales)) * 100 : null, 'pct'),
  });

  return {
    id: spec.id,
    kind: 'promotion',
    module: 'promotion',
    title: `Promotion what-if — ${depth}% off, ${weeks} weeks`,
    method: 'Volume uplift = |elasticity| × discount depth plus a display/feature lift; incremental margin nets funded discount dollars against baseline margin.',
    entityLabel: spec.entity ?? 'category',
    scope: spec.scope ?? {},
    levers: {
      discountPct: `${depth}%`,
      weeks: `${weeks} weeks`,
      displayLiftPct: `${displayLift}%`,
      vendorFundingPct: `${fundingRate}%`,
    },
    assumptions: [
      'Baseline volume is the trailing weekly run-rate for the same scope.',
      'No cannibalisation of non-promoted SKUs and no post-promotion dip are modelled.',
      'Vendor funding is applied to the discount dollars at the stated rate.',
    ],
    window: { from: b.from, to: b.to },
    rowsScanned: b.rowsScanned,
    total,
    rows,
    extra: [],
    tables: ['transactions', 'products', 'promotions'],
    notes: [],
    chartMetric: 'incremental_margin',
  };
}

function buildAssortment(b: Baseline, spec: ScenarioSpec): ScenarioSet {
  const tailPct = Math.min(Math.max(spec.levers?.tailThresholdPct ?? 20, 1), 60);
  const transfer = Math.min(Math.max(spec.levers?.transferRate ?? 45, 0), 100);
  const carryingCostPct = spec.levers?.carryingCostPct ?? 18;

  const sorted = [...b.entities].sort((a, c) => c.sales - a.sales);
  const totalSales = sorted.reduce((a, e) => a + e.sales, 0);
  let cum = 0;
  const head: BaseEntity[] = [];
  const tail: BaseEntity[] = [];
  for (const e of sorted) {
    cum += e.sales;
    if (cum <= totalSales * (1 - tailPct / 100)) head.push(e);
    else tail.push(e);
  }

  const rows: FactRow[] = [];
  let delistSales = 0;
  let delistMargin = 0;
  let recoveredMargin = 0;
  for (const [i, e] of tail.slice(0, Math.min(spec.limit ?? 12, 15)).entries()) {
    const marginRate = e.sales > 0 ? e.margin / e.sales : 0;
    const transferred = e.sales * (transfer / 100);
    const lostSales = e.sales - transferred;
    const netMargin = transferred * marginRate - e.margin;
    rows.push(
      row(`${spec.id}.${i + 1}`, e.label, {
        baseline_sales: fv('baseline_sales', 'Baseline net sales', e.sales, 'currency'),
        sales_share_pct: fv('sales_share_pct', 'Share of scope sales', totalSales > 0 ? (e.sales / totalSales) * 100 : null, 'pct'),
        baseline_margin: fv('baseline_margin', 'Baseline gross margin', e.margin, 'currency'),
        margin_rate_pct: fv('margin_rate_pct', 'Margin rate', marginRate * 100, 'pct'),
        transferred_sales: fv('transferred_sales', 'Sales retained via transfer', transferred, 'currency'),
        sales_at_risk: fv('sales_at_risk', 'Sales at risk if delisted', lostSales, 'currency'),
        net_margin_impact: fv('net_margin_impact', 'Net margin impact', netMargin, 'currency'),
        units: fv('units', 'Units sold', e.units, 'number'),
      }),
    );
  }
  for (const e of tail) {
    const marginRate = e.sales > 0 ? e.margin / e.sales : 0;
    delistSales += e.sales;
    delistMargin += e.margin;
    recoveredMargin += e.sales * (transfer / 100) * marginRate;
  }
  const freedWorkingCapital = delistSales * (carryingCostPct / 100);

  const total = row(`${spec.id}.total`, `Tail candidates (bottom ${tailPct}% of sales)`, {
    tail_items: fv('tail_items', 'Delist candidates', tail.length, 'number'),
    head_items: fv('head_items', 'Core items retained', head.length, 'number'),
    baseline_sales: fv('baseline_sales', 'Tail net sales', delistSales, 'currency'),
    sales_share_pct: fv('sales_share_pct', 'Tail share of scope sales', totalSales > 0 ? (delistSales / totalSales) * 100 : null, 'pct'),
    transferred_sales: fv('transferred_sales', 'Sales retained via transfer', delistSales * (transfer / 100), 'currency'),
    sales_at_risk: fv('sales_at_risk', 'Sales at risk', delistSales * (1 - transfer / 100), 'currency'),
    net_margin_impact: fv('net_margin_impact', 'Net margin impact', recoveredMargin - delistMargin, 'currency'),
    working_capital_released: fv('working_capital_released', 'Working capital released', freedWorkingCapital, 'currency'),
  });

  return {
    id: spec.id,
    kind: 'assortment',
    module: 'assortment',
    title: `Assortment rationalisation — bottom ${tailPct}% of sales`,
    method: 'Items ranked by trailing net sales; the tail below the cumulative threshold is tested for delist with a demand-transfer rate applied to retained sales and margin.',
    entityLabel: spec.entity ?? 'product',
    scope: spec.scope ?? {},
    levers: { tailThresholdPct: `${tailPct}%`, transferRate: `${transfer}%`, carryingCostPct: `${carryingCostPct}%` },
    assumptions: [
      `${transfer}% of delisted demand transfers to remaining items at their own margin rate.`,
      'No supplier delisting penalties or listing fees are modelled.',
      'Space released is assumed re-used by the retained range, not left empty.',
    ],
    window: { from: b.from, to: b.to },
    rowsScanned: b.rowsScanned,
    total,
    rows,
    extra: [],
    tables: ['transactions', 'products'],
    notes: [],
    chartMetric: 'net_margin_impact',
  };
}

async function buildPlanogram(supabase: SupabaseClient, b: Baseline, spec: ScenarioSpec, lookups: any): Promise<ScenarioSet> {
  const spaceElasticity = spec.levers?.spaceElasticity ?? 0.25;
  const facingsPct = spec.levers?.facingsPct ?? 20;

  const allocations = await fetchPaged(
    supabase,
    'shelf_allocations',
    'planogram_id,product_sku,shelf_number,facings,width_inches,sales_per_sqft,is_eye_level',
    5000,
  );

  const linearBySku = new Map<string, { facings: number; inches: number; eye: boolean }>();
  for (const a of allocations) {
    const sku = String(a.product_sku);
    const prev = linearBySku.get(sku) ?? { facings: 0, inches: 0, eye: false };
    linearBySku.set(sku, {
      facings: prev.facings + num(a.facings),
      inches: prev.inches + num(a.facings) * num(a.width_inches),
      eye: prev.eye || Boolean(a.is_eye_level),
    });
  }

  // aggregate space to the scenario entity
  const spaceByEntity = new Map<string, { facings: number; inches: number }>();
  for (const [sku, s] of linearBySku) {
    const p = lookups.products.get(sku);
    let key: string;
    if (spec.entity === 'product') key = sku;
    else if (spec.entity === 'subcategory') key = String(p?.subcategory ?? 'Unmapped');
    else if (spec.entity === 'brand') key = String(p?.brand ?? 'Unmapped');
    else key = String(p?.category ?? 'Unmapped');
    const prev = spaceByEntity.get(key) ?? { facings: 0, inches: 0 };
    spaceByEntity.set(key, { facings: prev.facings + s.facings, inches: prev.inches + s.inches });
  }

  const rows: FactRow[] = [];
  const scored = b.entities
    .map((e) => {
      const space = spaceByEntity.get(e.key) ?? { facings: 0, inches: 0 };
      const productivity = space.inches > 0 ? e.sales / space.inches : null;
      return { e, space, productivity };
    })
    .filter((x) => x.space.inches > 0)
    .sort((a, c) => (c.productivity ?? 0) - (a.productivity ?? 0));

  let totalDeltaSales = 0;
  let totalDeltaMargin = 0;
  const ranked = scored.slice(0, Math.min(spec.limit ?? 10, 15));
  for (const [i, x] of ranked.entries()) {
    const marginRate = x.e.sales > 0 ? x.e.margin / x.e.sales : 0;
    const medianProd = scored[Math.floor(scored.length / 2)]?.productivity ?? 0;
    const direction = (x.productivity ?? 0) >= medianProd ? 1 : -1;
    const changePct = direction * facingsPct;
    const salesDelta = x.e.sales * spaceElasticity * (changePct / 100);
    totalDeltaSales += salesDelta;
    totalDeltaMargin += salesDelta * marginRate;

    rows.push(
      row(`${spec.id}.${i + 1}`, x.e.label, {
        sales_per_linear_inch: fv('sales_per_linear_inch', 'Sales per linear inch', x.productivity, 'currency'),
        current_facings: fv('current_facings', 'Current facings', x.space.facings, 'number'),
        recommended_facings: fv('recommended_facings', 'Recommended facings', x.space.facings * (1 + changePct / 100), 'number'),
        facings_change_pct: fv('facings_change_pct', 'Facings change', changePct, 'pct'),
        baseline_sales: fv('baseline_sales', 'Baseline net sales', x.e.sales, 'currency'),
        sales_delta: fv('sales_delta', 'Modelled sales impact', salesDelta, 'currency'),
        margin_delta: fv('margin_delta', 'Modelled margin impact', salesDelta * marginRate, 'currency'),
      }),
    );
  }

  const total = row(`${spec.id}.total`, `Space reallocation at ±${facingsPct}% facings`, {
    entities_reviewed: fv('entities_reviewed', 'Entities reviewed', scored.length, 'number'),
    sales_delta: fv('sales_delta', 'Net sales impact', totalDeltaSales, 'currency'),
    margin_delta: fv('margin_delta', 'Gross margin impact', totalDeltaMargin, 'currency'),
    space_elasticity: fv('space_elasticity', 'Space elasticity used', spaceElasticity, 'ratio'),
    total_linear_inches: fv('total_linear_inches', 'Linear inches in scope', scored.reduce((a, x) => a + x.space.inches, 0), 'number'),
  });

  return {
    id: spec.id,
    kind: 'planogram',
    module: 'space',
    title: `Planogram space what-if — ±${facingsPct}% facings`,
    method: 'Sales per linear inch ranks the range; facings shift toward above-median productivity and away from below-median, with sales response scaled by the space elasticity.',
    entityLabel: spec.entity ?? 'category',
    scope: spec.scope ?? {},
    levers: { facingsPct: `±${facingsPct}%`, spaceElasticity: String(spaceElasticity) },
    assumptions: [
      'Space elasticity is a planning constant applied uniformly; it is not fitted per item.',
      'Total bay space is held constant — gains are funded by reductions elsewhere in scope.',
      'Availability effects from deeper facings are not separately modelled.',
    ],
    window: { from: b.from, to: b.to },
    rowsScanned: b.rowsScanned,
    total,
    rows,
    extra: [],
    tables: ['transactions', 'shelf_allocations', 'planograms', 'products'],
    notes: scored.length === 0 ? ['No planogram space is mapped for this scope, so no space impact can be modelled.'] : [],
    chartMetric: 'margin_delta',
  };
}

const Z_FOR_SERVICE: Record<number, number> = { 90: 1.28, 92: 1.41, 95: 1.65, 97: 1.88, 98: 2.05, 99: 2.33 };

async function buildReplenishment(supabase: SupabaseClient, b: Baseline, spec: ScenarioSpec, lookups: any): Promise<ScenarioSet> {
  const serviceLevel = Math.min(Math.max(Math.round(spec.levers?.serviceLevelPct ?? 97), 90), 99);
  const z = Z_FOR_SERVICE[serviceLevel] ?? 1.88;
  const reviewDays = Math.min(Math.max(Math.round(spec.levers?.reviewDays ?? 3), 1), 14);
  const leadTimeOverride = spec.levers?.leadTimeDays;

  const inventory = await fetchPaged(supabase, 'inventory_levels', 'store_id,product_sku,stock_level,reorder_point,stockout_risk', 40000);
  const suppliers = Array.from(lookups.suppliers.values()) as Record<string, any>[];
  const avgLeadTime = suppliers.length
    ? suppliers.reduce((a, s) => a + num(s.lead_time_days), 0) / suppliers.length
    : 5;
  const leadTime = leadTimeOverride ?? avgLeadTime;

  // weekly demand stats per scenario entity
  const rows: FactRow[] = [];
  const weeksInBase = Math.max(1, b.weekKeys.length - 1);

  const stockByEntity = new Map<string, { stock: number; positions: number; below: number }>();
  for (const inv of inventory) {
    const p = lookups.products.get(String(inv.product_sku));
    const st = lookups.stores.get(String(inv.store_id));
    if (!scopeMatches(spec, p, st, String(inv.product_sku))) continue;
    let key: string;
    if (spec.entity === 'product') key = String(inv.product_sku);
    else if (spec.entity === 'subcategory') key = String(p?.subcategory ?? 'Unmapped');
    else if (spec.entity === 'brand') key = String(p?.brand ?? 'Unmapped');
    else if (spec.entity === 'store') key = String(inv.store_id);
    else if (spec.entity === 'region') key = String(st?.region ?? 'Unassigned');
    else key = String(p?.category ?? 'Unmapped');
    const prev = stockByEntity.get(key) ?? { stock: 0, positions: 0, below: 0 };
    stockByEntity.set(key, {
      stock: prev.stock + num(inv.stock_level),
      positions: prev.positions + 1,
      below: prev.below + (num(inv.stock_level) < num(inv.reorder_point) ? 1 : 0),
    });
  }

  let tSafety = 0;
  let tOrder = 0;
  let tOrderValue = 0;
  let tStock = 0;
  let tRisk = 0;

  const ranked = b.entities.slice(0, Math.min(spec.limit ?? 10, 15));
  for (const [i, e] of ranked.entries()) {
    const weekly = b.weekKeys.slice(0, weeksInBase).map((k) => e.weekly.get(k) ?? 0);
    const mean = weekly.reduce((a, v) => a + v, 0) / Math.max(1, weekly.length);
    const variance = weekly.reduce((a, v) => a + (v - mean) ** 2, 0) / Math.max(1, weekly.length - 1);
    const sd = Math.sqrt(Math.max(0, variance));
    const dailyMean = mean / 7;
    const dailySd = sd / Math.sqrt(7);
    const protectionDays = leadTime + reviewDays;
    const safetyStock = z * dailySd * Math.sqrt(protectionDays);
    const reorderPoint = dailyMean * protectionDays + safetyStock;
    const stock = stockByEntity.get(e.key)?.stock ?? 0;
    const coverDays = dailyMean > 0 ? stock / dailyMean : null;
    const orderQty = Math.max(0, reorderPoint - stock);
    const unitCost = e.units > 0 ? (e.sales - e.margin) / e.units : 0;
    const asp = e.units > 0 ? e.sales / e.units : 0;
    const shortfallDays = coverDays !== null ? Math.max(0, protectionDays - coverDays) : 0;
    const salesAtRisk = shortfallDays * dailyMean * asp;

    tSafety += safetyStock;
    tOrder += orderQty;
    tOrderValue += orderQty * unitCost;
    tStock += stock;
    tRisk += salesAtRisk;

    rows.push(
      row(`${spec.id}.${i + 1}`, e.label, {
        avg_weekly_demand: fv('avg_weekly_demand', 'Avg weekly demand', mean, 'number'),
        demand_volatility: fv('demand_volatility', 'Weekly demand std dev', sd, 'number'),
        safety_stock: fv('safety_stock', `Safety stock at ${serviceLevel}% service`, safetyStock, 'number'),
        reorder_point: fv('reorder_point', 'Recommended reorder point', reorderPoint, 'number'),
        stock_on_hand: fv('stock_on_hand', 'Stock on hand', stock, 'number'),
        cover_days: fv('cover_days', 'Days of cover', coverDays, 'days'),
        order_now_units: fv('order_now_units', 'Order-now quantity', orderQty, 'number'),
        order_value: fv('order_value', 'Order value at cost', orderQty * unitCost, 'currency'),
        sales_at_risk: fv('sales_at_risk', 'Sales at risk before replenishment', salesAtRisk, 'currency'),
      }),
    );
  }

  const total = row(`${spec.id}.total`, `Replenishment plan at ${serviceLevel}% service level`, {
    safety_stock: fv('safety_stock', 'Total safety stock required', tSafety, 'number'),
    order_now_units: fv('order_now_units', 'Total order-now units', tOrder, 'number'),
    order_value: fv('order_value', 'Total order value at cost', tOrderValue, 'currency'),
    stock_on_hand: fv('stock_on_hand', 'Stock on hand in scope', tStock, 'number'),
    sales_at_risk: fv('sales_at_risk', 'Sales at risk before replenishment', tRisk, 'currency'),
    lead_time_days: fv('lead_time_days', 'Supplier lead time used', leadTime, 'days'),
    review_days: fv('review_days', 'Review cycle used', reviewDays, 'days'),
  });

  return {
    id: spec.id,
    kind: 'replenishment',
    module: 'supply-chain',
    title: `Replenishment plan — ${serviceLevel}% service level`,
    method: 'Safety stock = z(service level) × demand σ × √(lead time + review days); reorder point adds lead-time demand, and order-now quantity is the gap to current on-hand stock.',
    entityLabel: spec.entity ?? 'category',
    scope: spec.scope ?? {},
    levers: { serviceLevelPct: `${serviceLevel}%`, reviewDays: `${reviewDays} days`, leadTimeDays: `${leadTime.toFixed(1)} days` },
    assumptions: [
      'Demand is modelled as normally distributed around the trailing weekly average.',
      'Supplier lead time is the master-data average unless a specific lead time was given.',
      'No truck/pallet rounding, minimum order quantities or shelf capacity limits are applied.',
    ],
    window: { from: b.from, to: b.to },
    rowsScanned: b.rowsScanned,
    total,
    rows,
    extra: [],
    tables: ['transactions', 'inventory_levels', 'suppliers', 'products'],
    notes: [],
    chartMetric: 'order_now_units',
  };
}

// --------------------------- markdown / clearance ---------------------------

function entityKeyForLookup(spec: ScenarioSpec, p: Record<string, any> | undefined, st: Record<string, any> | undefined, sku: string, storeId: string) {
  if (spec.entity === 'product') return sku;
  if (spec.entity === 'subcategory') return String(p?.subcategory ?? 'Unmapped');
  if (spec.entity === 'brand') return String(p?.brand ?? 'Unmapped');
  if (spec.entity === 'store') return storeId;
  if (spec.entity === 'region') return String(st?.region ?? 'Unassigned');
  return String(p?.category ?? 'Unmapped');
}

async function buildMarkdown(supabase: SupabaseClient, b: Baseline, spec: ScenarioSpec, lookups: any): Promise<ScenarioSet> {
  const targetSellThrough = Math.min(Math.max(spec.levers?.targetSellThroughPct ?? 85, 40), 100);
  const weeks = Math.min(Math.max(Math.round(spec.levers?.weeks ?? 6), 1), 26);
  const carryingCostPct = Math.min(Math.max(spec.levers?.carryingCostPct ?? 18, 0), 60);
  const maxDepth = Math.min(Math.max(spec.levers?.maxDepthPct ?? 50, 5), 80);

  const aged = await fetchPaged(
    supabase,
    'stock_age_tracking',
    'product_sku,store_id,stock_age_days,stock_age_band,quantity,value_at_cost,value_at_retail,tracking_date',
    40000,
    (q: any) => q.order('tracking_date', { ascending: false }),
  );

  // in-scope snapshot rows first, so the ageing threshold can adapt to the
  // shelf life of what is actually in scope (fresh ages in days, ambient in weeks)
  const inScope: { key: string; age: number; qty: number; retail: number; cost: number }[] = [];
  for (const r of aged) {
    const sku = String(r.product_sku);
    const p = lookups.products.get(sku);
    const st = lookups.stores.get(String(r.store_id));
    if (!scopeMatches(spec, p, st, sku)) continue;
    inScope.push({
      key: entityKeyForLookup(spec, p, st, sku, String(r.store_id)),
      age: num(r.stock_age_days),
      qty: num(r.quantity),
      retail: num(r.value_at_retail),
      cost: num(r.value_at_cost),
    });
  }

  const ages = inScope.map((r) => r.age).sort((x, y) => x - y);
  const p60 = ages.length ? ages[Math.floor(ages.length * 0.6)] : 0;
  const adaptive = Math.max(3, Math.round(p60));
  const ageThreshold = spec.levers?.ageThresholdDays
    ? Math.min(Math.max(Math.round(spec.levers.ageThresholdDays), 1), 365)
    : adaptive;
  const thresholdNote = spec.levers?.ageThresholdDays
    ? []
    : [`Ageing threshold set to ${ageThreshold} days — the 60th percentile of stock age in scope, since grocery shelf life varies by department.`];

  const byEntity = new Map<string, { qty: number; retail: number; cost: number; ageSum: number; ageWeight: number }>();
  for (const r of inScope) {
    if (r.age < ageThreshold) continue;
    const prev = byEntity.get(r.key) ?? { qty: 0, retail: 0, cost: 0, ageSum: 0, ageWeight: 0 };
    byEntity.set(r.key, {
      qty: prev.qty + r.qty,
      retail: prev.retail + r.retail,
      cost: prev.cost + r.cost,
      ageSum: prev.ageSum + r.age * r.qty,
      ageWeight: prev.ageWeight + r.qty,
    });
  }


  const weeksInBase = Math.max(1, b.weekKeys.length - 1);
  const rows: FactRow[] = [];
  let tQty = 0;
  let tRecovered = 0;
  let tMargin = 0;
  let tGiveaway = 0;
  let tCarry = 0;
  let tDepthWeight = 0;
  let tDepth = 0;

  const ranked = b.entities
    .filter((e) => (byEntity.get(e.key)?.qty ?? 0) > 0)
    .slice(0, Math.min(spec.limit ?? 10, 15));

  for (const [i, e] of ranked.entries()) {
    const a = byEntity.get(e.key)!;
    const elasticity = Math.abs(elasticityOf(e));
    const asp = e.units > 0 ? e.sales / e.units : 0;
    const unitCost = e.units > 0 ? (e.sales - e.margin) / e.units : 0;
    const weeklyUnits = e.units / weeksInBase;
    const clearQty = a.qty * (targetSellThrough / 100);
    const requiredWeekly = clearQty / weeks;
    const upliftNeeded = weeklyUnits > 0 ? Math.max(0, requiredWeekly / weeklyUnits - 1) : 1;
    const depthPct = Math.min(maxDepth, elasticity > 0 ? (upliftNeeded / elasticity) * 100 : maxDepth);
    const clearPrice = asp * (1 - depthPct / 100);
    const recovered = clearQty * clearPrice;
    const marginAfter = clearQty * (clearPrice - unitCost);
    const giveaway = clearQty * asp * (depthPct / 100);
    const carryAvoided = a.cost * (carryingCostPct / 100) * (weeks / 52);
    const avgAge = a.ageWeight > 0 ? a.ageSum / a.ageWeight : null;

    tQty += clearQty;
    tRecovered += recovered;
    tMargin += marginAfter;
    tGiveaway += giveaway;
    tCarry += carryAvoided;
    tDepth += depthPct * clearQty;
    tDepthWeight += clearQty;

    rows.push(
      row(`${spec.id}.${i + 1}`, e.label, {
        aged_units: fv('aged_units', `Units aged ${ageThreshold}d+`, a.qty, 'number'),
        avg_stock_age_days: fv('avg_stock_age_days', 'Avg stock age', avgAge, 'days'),
        aged_value_retail: fv('aged_value_retail', 'Aged stock at retail', a.retail, 'currency'),
        recommended_markdown_pct: fv('recommended_markdown_pct', 'Recommended markdown depth', depthPct, 'pct'),
        clearance_units: fv('clearance_units', `Units cleared in ${weeks}w`, clearQty, 'number'),
        recovered_revenue: fv('recovered_revenue', 'Revenue recovered', recovered, 'currency'),
        margin_after_markdown: fv('margin_after_markdown', 'Margin after markdown', marginAfter, 'currency'),
        markdown_giveaway: fv('markdown_giveaway', 'Markdown give-away cost', giveaway, 'currency'),
        carrying_cost_avoided: fv('carrying_cost_avoided', 'Carrying cost avoided', carryAvoided, 'currency'),
      }),
    );
  }

  const total = row(`${spec.id}.total`, `Clearance plan — ${targetSellThrough}% sell-through in ${weeks} weeks`, {
    clearance_units: fv('clearance_units', 'Units cleared', tQty, 'number'),
    recommended_markdown_pct: fv('recommended_markdown_pct', 'Weighted markdown depth', tDepthWeight > 0 ? tDepth / tDepthWeight : null, 'pct'),
    recovered_revenue: fv('recovered_revenue', 'Revenue recovered', tRecovered, 'currency'),
    margin_after_markdown: fv('margin_after_markdown', 'Margin after markdown', tMargin, 'currency'),
    markdown_giveaway: fv('markdown_giveaway', 'Markdown give-away cost', tGiveaway, 'currency'),
    carrying_cost_avoided: fv('carrying_cost_avoided', 'Carrying cost avoided', tCarry, 'currency'),
    net_benefit: fv('net_benefit', 'Net benefit vs holding stock', tMargin + tCarry, 'currency'),
  });

  return {
    id: spec.id,
    kind: 'markdown',
    module: 'pricing',
    title: `Markdown optimisation — clear aged stock in ${weeks} weeks`,
    method: `Required weekly sell-rate to hit the sell-through target is converted into a markdown depth via own-price elasticity (depth = required uplift ÷ |elasticity|, capped at ${maxDepth}%); recovery, give-away and carrying-cost avoidance are then priced off trailing ASP and unit cost.`,
    entityLabel: spec.entity ?? 'category',
    scope: spec.scope ?? {},
    levers: {
      targetSellThroughPct: `${targetSellThrough}%`,
      weeks: `${weeks} weeks`,
      ageThresholdDays: `${ageThreshold} days`,
      carryingCostPct: `${carryingCostPct}% p.a.`,
    },
    assumptions: [
      'Elasticity measured at shelf price is assumed to hold at clearance depths.',
      'No competitor reaction, vendor markdown support or shrink write-off is modelled.',
      'Aged stock uses the latest stock-age snapshot per store/SKU.',
    ],
    window: { from: b.from, to: b.to },
    rowsScanned: b.rowsScanned,
    total,
    rows,
    extra: [],
    tables: ['transactions', 'stock_age_tracking', 'products'],
    notes: [
      ...thresholdNote,
      ...(rows.length === 0 ? [`No stock aged ${ageThreshold} days or more in scope.`] : []),
      ...(tDepthWeight > 0 && tDepth / tDepthWeight >= maxDepth - 0.01
        ? [`Required depth hits the ${maxDepth}% cap — the sell-through target is not reachable on price alone in ${weeks} weeks; extend the window or pair with display/vendor support.`]
        : []),
      ...(tMargin < 0 ? ['Clearance at this depth sells below cost — treat as loss mitigation against carrying cost and shrink, not margin generation.'] : []),
    ],
    chartMetric: 'recommended_markdown_pct',
  };
}

// --------------------------- supplier risk ----------------------------------

async function buildSupplierRisk(supabase: SupabaseClient, b: Baseline, spec: ScenarioSpec, lookups: any): Promise<ScenarioSet> {
  const targetOtd = Math.min(Math.max(spec.levers?.targetOtdPct ?? 97, 80), 100);
  const horizon = Math.min(Math.max(Math.round(spec.levers?.horizonWeeks ?? 13), 1), 52);
  const serviceLevel = Math.min(Math.max(Math.round(spec.levers?.serviceLevelPct ?? 95), 90), 99);
  const z = Z_FOR_SERVICE[serviceLevel] ?? 1.65;

  const orders = await fetchPaged(
    supabase,
    'supplier_orders',
    'supplier_id,product_sku,order_date,expected_delivery_date,actual_delivery_date,quantity,unit_cost,total_cost,status,on_time',
    40000,
    (q: any) => q.order('order_date', { ascending: false }),
  );

  type Agg = {
    label: string;
    orders: number;
    onTime: number;
    delays: number[];
    units: number;
    value: number;
    firstDate: string;
    lastDate: string;
  };
  const byEntity = new Map<string, Agg>();
  let scanned = 0;

  for (const o of orders) {
    const sku = String(o.product_sku);
    const p = lookups.products.get(sku);
    if (!scopeMatches(spec, p, undefined, sku)) continue;
    const sup = lookups.suppliers.get(String(o.supplier_id));
    const key = spec.entity === 'category' || !spec.entity ? String(sup?.supplier_name ?? 'Unknown supplier') : entityKeyForLookup(spec, p, undefined, sku, '');
    const label = spec.entity === 'category' || !spec.entity ? String(sup?.supplier_name ?? 'Unknown supplier') : key;
    if (spec.scope?.supplier && !String(sup?.supplier_name ?? '').toLowerCase().includes(spec.scope.supplier.toLowerCase())) continue;
    scanned++;
    const prev = byEntity.get(key) ?? {
      label,
      orders: 0,
      onTime: 0,
      delays: [],
      units: 0,
      value: 0,
      firstDate: String(o.order_date),
      lastDate: String(o.order_date),
    };
    prev.orders += 1;
    if (o.on_time === true) prev.onTime += 1;
    if (o.actual_delivery_date && o.expected_delivery_date) {
      const delay = (new Date(String(o.actual_delivery_date)).getTime() - new Date(String(o.expected_delivery_date)).getTime()) / DAY;
      if (Number.isFinite(delay)) prev.delays.push(delay);
    }
    prev.units += num(o.quantity);
    prev.value += num(o.total_cost) || num(o.quantity) * num(o.unit_cost);
    const d = String(o.order_date);
    if (d < prev.firstDate) prev.firstDate = d;
    if (d > prev.lastDate) prev.lastDate = d;
    byEntity.set(key, prev);
  }

  const aggs = Array.from(byEntity.values()).sort((a, b2) => b2.value - a.value);
  if (aggs.length === 0) throw new Error('No supplier order history in scope for the supplier risk scenario');

  const rows: FactRow[] = [];
  let tOrders = 0;
  let tOnTime = 0;
  let tLate = 0;
  let tValueRisk = 0;
  let tBufferWeight = 0;
  let tBuffer = 0;

  for (const [i, a] of aggs.slice(0, Math.min(spec.limit ?? 10, 15)).entries()) {
    const otd = a.orders > 0 ? (a.onTime / a.orders) * 100 : null;
    const positive = a.delays.filter((d) => d > 0);
    const avgDelay = positive.length ? positive.reduce((x, y) => x + y, 0) / positive.length : 0;
    const meanDelay = a.delays.length ? a.delays.reduce((x, y) => x + y, 0) / a.delays.length : 0;
    const sd = a.delays.length > 1
      ? Math.sqrt(a.delays.reduce((x, d) => x + (d - meanDelay) ** 2, 0) / (a.delays.length - 1))
      : 0;
    const spanWeeks = Math.max(1, (new Date(a.lastDate).getTime() - new Date(a.firstDate).getTime()) / (7 * DAY));
    const ordersPerWeek = a.orders / spanWeeks;
    const projOrders = ordersPerWeek * horizon;
    const lateRate = otd === null ? 0 : Math.max(0, 1 - otd / 100);
    const projLate = projOrders * lateRate;
    const valuePerOrder = a.orders > 0 ? a.value / a.orders : 0;
    const valueAtRisk = projLate * valuePerOrder;
    const bufferDays = z * sd + Math.max(0, avgDelay) * lateRate;
    const otdGap = otd === null ? null : targetOtd - otd;

    tOrders += projOrders;
    tOnTime += projOrders * (1 - lateRate);
    tLate += projLate;
    tValueRisk += valueAtRisk;
    tBuffer += bufferDays * a.value;
    tBufferWeight += a.value;

    rows.push(
      row(`${spec.id}.${i + 1}`, a.label, {
        orders_observed: fv('orders_observed', 'Orders observed', a.orders, 'number'),
        otd_pct: fv('otd_pct', 'On-time delivery', otd, 'pct'),
        otd_gap_pct: fv('otd_gap_pct', `Gap to ${targetOtd}% target`, otdGap, 'pct'),
        avg_delay_days: fv('avg_delay_days', 'Avg delay when late', avgDelay, 'days'),
        lead_time_volatility_days: fv('lead_time_volatility_days', 'Delivery variability (σ)', sd, 'days'),
        projected_orders: fv('projected_orders', `Projected orders (${horizon}w)`, projOrders, 'number'),
        projected_late_orders: fv('projected_late_orders', 'Projected late orders', projLate, 'number'),
        value_at_risk: fv('value_at_risk', 'Order value at risk', valueAtRisk, 'currency'),
        recommended_buffer_days: fv('recommended_buffer_days', 'Recommended lead-time buffer', bufferDays, 'days'),
      }),
    );
  }

  const total = row(`${spec.id}.total`, `Supplier reliability outlook — next ${horizon} weeks`, {
    projected_orders: fv('projected_orders', 'Projected orders', tOrders, 'number'),
    projected_late_orders: fv('projected_late_orders', 'Projected late orders', tLate, 'number'),
    otd_pct: fv('otd_pct', 'Projected on-time delivery', tOrders > 0 ? (tOnTime / tOrders) * 100 : null, 'pct'),
    otd_gap_pct: fv('otd_gap_pct', `Gap to ${targetOtd}% target`, tOrders > 0 ? targetOtd - (tOnTime / tOrders) * 100 : null, 'pct'),
    value_at_risk: fv('value_at_risk', 'Order value at risk', tValueRisk, 'currency'),
    recommended_buffer_days: fv('recommended_buffer_days', 'Weighted buffer to add', tBufferWeight > 0 ? tBuffer / tBufferWeight : null, 'days'),
  });

  return {
    id: spec.id,
    kind: 'supplier_risk',
    module: 'supply-chain',
    title: `Supplier reliability risk — next ${horizon} weeks`,
    method: `Observed on-time rate and delivery-delay distribution per supplier are projected forward at the historical order cadence; buffer = z(${serviceLevel}%) × delay σ plus the late-weighted average delay.`,
    entityLabel: spec.entity && spec.entity !== 'category' ? spec.entity : 'supplier',
    scope: spec.scope ?? {},
    levers: { targetOtdPct: `${targetOtd}%`, horizonWeeks: `${horizon} weeks`, serviceLevelPct: `${serviceLevel}%` },
    assumptions: [
      'Order cadence and supplier behaviour continue at the observed historical rate.',
      'Delivery delays are treated as normally distributed around the observed mean.',
      'No alternate sourcing, expediting or penalty recovery is modelled.',
    ],
    window: { from: b.from, to: b.to },
    rowsScanned: scanned,
    total,
    rows,
    extra: [],
    tables: ['supplier_orders', 'suppliers', 'products'],
    notes: [],
    chartMetric: 'value_at_risk',
  };
}

// --------------------------- stockout / OSA risk ----------------------------

async function buildStockoutRisk(supabase: SupabaseClient, b: Baseline, spec: ScenarioSpec, lookups: any): Promise<ScenarioSet> {
  const horizonWeeks = Math.min(Math.max(Math.round(spec.levers?.horizonWeeks ?? 4), 1), 26);
  const targetOsa = Math.min(Math.max(spec.levers?.targetOsaPct ?? 98, 80), 100);
  const leadTimeDays = Math.min(Math.max(spec.levers?.leadTimeDays ?? 4, 1), 30);

  const inventory = await fetchPaged(supabase, 'inventory_levels', 'store_id,product_sku,stock_level,reorder_point,stockout_risk,last_restocked', 40000);

  const weeksInBase = Math.max(1, b.weekKeys.length - 1);
  const baseDays = weeksInBase * 7;
  const horizonDays = horizonWeeks * 7;

  // position-level exposure: each store/SKU shelf position is evaluated against
  // its own selling rate, then rolled up to the requested entity grain
  type Agg = {
    stock: number;
    positions: number;
    atRisk: number;
    dailyDemand: number;
    daysOutWeighted: number;
    lostUnits: number;
  };
  const agg = new Map<string, Agg>();
  for (const inv of inventory) {
    const sku = String(inv.product_sku);
    const p = lookups.products.get(sku);
    const st = lookups.stores.get(String(inv.store_id));
    if (!scopeMatches(spec, p, st, sku)) continue;
    const key = entityKeyForLookup(spec, p, st, sku, String(inv.store_id));
    const posUnits = b.positionUnits.get(`${inv.store_id}|${sku}`) ?? 0;
    const dailyDemand = posUnits / baseDays;
    const stock = num(inv.stock_level);
    const cover = dailyDemand > 0 ? stock / dailyDemand : null;
    const riskFlag = String(inv.stockout_risk ?? '').toLowerCase();
    const belowReorder = stock < num(inv.reorder_point);
    // days out = uncovered days once cover runs out, assuming a replenishment
    // cycle of leadTimeDays is needed before stock returns to the shelf
    const daysOut = cover === null ? 0 : Math.max(0, Math.min(horizonDays, horizonDays - cover - (belowReorder || riskFlag === 'high' ? 0 : leadTimeDays)));
    const prev = agg.get(key) ?? { stock: 0, positions: 0, atRisk: 0, dailyDemand: 0, daysOutWeighted: 0, lostUnits: 0 };
    agg.set(key, {
      stock: prev.stock + stock,
      positions: prev.positions + 1,
      atRisk: prev.atRisk + (belowReorder || riskFlag === 'high' ? 1 : 0),
      dailyDemand: prev.dailyDemand + dailyDemand,
      daysOutWeighted: prev.daysOutWeighted + daysOut,
      lostUnits: prev.lostUnits + daysOut * dailyDemand,
    });
  }

  const rows: FactRow[] = [];
  let tLostUnits = 0;
  let tLostSales = 0;
  let tLostMargin = 0;
  let tPositions = 0;
  let tAtRisk = 0;
  let tRecovery = 0;
  let tOsaWeighted = 0;
  let tOsaWeight = 0;

  const ranked = b.entities.slice(0, Math.min(spec.limit ?? 10, 15));
  for (const [i, e] of ranked.entries()) {
    const a = agg.get(e.key) ?? { stock: 0, positions: 0, atRisk: 0, dailyDemand: 0, daysOutWeighted: 0, lostUnits: 0 };
    const asp = e.units > 0 ? e.sales / e.units : 0;
    const marginRate = e.sales > 0 ? e.margin / e.sales : 0;
    const coverDays = a.dailyDemand > 0 ? a.stock / a.dailyDemand : null;
    const avgDaysOut = a.positions > 0 ? a.daysOutWeighted / a.positions : 0;
    const projOsa = a.positions > 0 ? Math.max(0, ((horizonDays - avgDaysOut) / horizonDays) * 100) : null;
    const osaGap = projOsa === null ? null : targetOsa - projOsa;
    const lostUnits = a.lostUnits;
    const lostSales = lostUnits * asp;
    const recoverable = projOsa === null || osaGap === null || osaGap <= 0 ? 0 : lostSales * Math.min(1, osaGap / Math.max(0.01, 100 - projOsa));

    tLostUnits += lostUnits;
    tLostSales += lostSales;
    tLostMargin += lostSales * marginRate;
    tPositions += a.positions;
    tAtRisk += a.atRisk;
    tRecovery += recoverable;
    if (projOsa !== null) {
      tOsaWeighted += projOsa * a.positions;
      tOsaWeight += a.positions;
    }

    rows.push(
      row(`${spec.id}.${i + 1}`, e.label, {
        daily_demand_units: fv('daily_demand_units', 'Avg daily demand', a.dailyDemand, 'number'),
        stock_on_hand: fv('stock_on_hand', 'Stock on hand', a.stock, 'number'),
        cover_days: fv('cover_days', 'Days of cover', coverDays, 'days'),
        positions_reviewed: fv('positions_reviewed', 'Store/SKU positions', a.positions, 'number'),
        positions_at_risk: fv('positions_at_risk', 'Positions at risk', a.atRisk, 'number'),
        projected_days_out: fv('projected_days_out', `Avg days out per position (${horizonWeeks}w)`, avgDaysOut, 'days'),
        projected_osa_pct: fv('projected_osa_pct', 'Projected on-shelf availability', projOsa, 'pct'),
        osa_gap_pct: fv('osa_gap_pct', `Gap to ${targetOsa}% OSA`, osaGap, 'pct'),
        lost_units: fv('lost_units', 'Units lost to stockout', lostUnits, 'number'),
        lost_sales: fv('lost_sales', 'Sales lost to stockout', lostSales, 'currency'),
        lost_margin: fv('lost_margin', 'Margin lost to stockout', lostSales * marginRate, 'currency'),
      }),
    );
  }


  const total = row(`${spec.id}.total`, `Stockout exposure — next ${horizonWeeks} weeks`, {
    lost_units: fv('lost_units', 'Units lost to stockout', tLostUnits, 'number'),
    lost_sales: fv('lost_sales', 'Sales lost to stockout', tLostSales, 'currency'),
    lost_margin: fv('lost_margin', 'Margin lost to stockout', tLostMargin, 'currency'),
    projected_osa_pct: fv('projected_osa_pct', 'Projected on-shelf availability', tOsaWeight > 0 ? tOsaWeighted / tOsaWeight : null, 'pct'),
    osa_gap_pct: fv('osa_gap_pct', `Gap to ${targetOsa}% OSA`, tOsaWeight > 0 ? targetOsa - tOsaWeighted / tOsaWeight : null, 'pct'),
    positions_at_risk: fv('positions_at_risk', 'Positions below reorder point', tAtRisk, 'number'),
    positions_reviewed: fv('positions_reviewed', 'Store/SKU positions reviewed', tPositions, 'number'),
    recoverable_sales: fv('recoverable_sales', `Sales recoverable at ${targetOsa}% OSA`, tRecovery, 'currency'),
  });

  return {
    id: spec.id,
    kind: 'stockout_risk',
    module: 'demand',
    title: `Stockout & availability risk — next ${horizonWeeks} weeks`,
    method: 'Each store/SKU position is evaluated on its own selling rate: on-hand cover is run down against daily demand over the horizon, uncovered days become expected days out (plus a replenishment lead time where stock is above reorder point), then priced at trailing ASP and margin rate.',
    entityLabel: spec.entity ?? 'category',
    scope: spec.scope ?? {},
    levers: { horizonWeeks: `${horizonWeeks} weeks`, targetOsaPct: `${targetOsa}%`, leadTimeDays: `${leadTimeDays} days` },
    assumptions: [
      'Demand continues at the trailing daily average with no promotional spikes.',
      'Only stock currently on hand is counted — in-transit and open purchase orders are excluded.',
      'Substitution to alternative SKUs is not modelled, so lost sales are an upper bound.',
    ],
    window: { from: b.from, to: b.to },
    rowsScanned: b.rowsScanned,
    total,
    rows,
    extra: [],
    tables: ['transactions', 'inventory_levels', 'products'],
    notes: [],
    chartMetric: 'lost_sales',
  };
}

// --------------------------- executive plan ---------------------------------

function buildPlan(b: Baseline, spec: ScenarioSpec): ScenarioSet {
  const horizon = Math.min(Math.max(Math.round(spec.levers?.horizonWeeks ?? 13), 1), 52);
  const targetGrowth = spec.levers?.targetGrowthPct ?? 3;
  const targetMarginPct = spec.levers?.targetMarginPct;

  const weeksInBase = Math.max(1, b.weekKeys.length - 1);
  const rows: FactRow[] = [];
  let tProj = 0;
  let tPlan = 0;
  let tMargin = 0;
  let tRunRate = 0;

  const ranked = b.entities.slice(0, Math.min(spec.limit ?? 10, 15));
  for (const [i, e] of ranked.entries()) {
    const weekly = b.weekKeys.slice(0, weeksInBase).map((k) => e.weeklySales.get(k) ?? 0);
    const { slope, intercept } = linearTrend(weekly);
    let proj = 0;
    for (let h = 1; h <= horizon; h++) proj += Math.max(0, intercept + slope * (weekly.length - 1 + h));
    const runRate = (e.sales / weeksInBase) * horizon;
    const plan = runRate * (1 + targetGrowth / 100);
    const marginRate = e.sales > 0 ? (e.margin / e.sales) * 100 : 0;
    const projMargin = proj * (marginRate / 100);
    const gap = proj - plan;

    tProj += proj;
    tPlan += plan;
    tMargin += projMargin;
    tRunRate += runRate;

    rows.push(
      row(`${spec.id}.${i + 1}`, e.label, {
        projected_net_sales: fv('projected_net_sales', `Projected net sales (${horizon}w)`, proj, 'currency'),
        plan_net_sales: fv('plan_net_sales', `Plan at +${targetGrowth}%`, plan, 'currency'),
        gap_to_plan: fv('gap_to_plan', 'Gap to plan', gap, 'currency'),
        gap_to_plan_pct: fv('gap_to_plan_pct', 'Gap to plan %', plan > 0 ? (gap / plan) * 100 : null, 'pct'),
        projected_margin: fv('projected_margin', 'Projected gross margin', projMargin, 'currency'),
        projected_margin_pct: fv('projected_margin_pct', 'Projected margin rate', marginRate, 'pct'),
        margin_rate_gap_pct: fv('margin_rate_gap_pct', targetMarginPct ? `Gap to ${targetMarginPct}% margin` : 'Margin rate gap', targetMarginPct ? targetMarginPct - marginRate : null, 'pct'),
        weekly_trend_sales: fv('weekly_trend_sales', 'Weekly sales trend', slope, 'currency'),
      }),
    );
  }

  const gapTotal = tProj - tPlan;
  const total = row(`${spec.id}.total`, `Plan outlook — next ${horizon} weeks`, {
    projected_net_sales: fv('projected_net_sales', 'Projected net sales', tProj, 'currency'),
    plan_net_sales: fv('plan_net_sales', `Plan at +${targetGrowth}%`, tPlan, 'currency'),
    gap_to_plan: fv('gap_to_plan', 'Gap to plan', gapTotal, 'currency'),
    gap_to_plan_pct: fv('gap_to_plan_pct', 'Gap to plan %', tPlan > 0 ? (gapTotal / tPlan) * 100 : null, 'pct'),
    projected_margin: fv('projected_margin', 'Projected gross margin', tMargin, 'currency'),
    projected_margin_pct: fv('projected_margin_pct', 'Projected margin rate', tProj > 0 ? (tMargin / tProj) * 100 : null, 'pct'),
    run_rate_net_sales: fv('run_rate_net_sales', 'Flat run-rate net sales', tRunRate, 'currency'),
    weekly_gap_to_close: fv('weekly_gap_to_close', 'Weekly sales gap to close', gapTotal < 0 ? Math.abs(gapTotal) / horizon : 0, 'currency'),
  });

  return {
    id: spec.id,
    kind: 'plan',
    module: 'executive',
    title: `Sales & margin plan outlook — next ${horizon} weeks`,
    method: `OLS trend on weekly net sales projects the landing position, compared with a plan built off the trailing run-rate grown ${targetGrowth}%; margin is applied at the trailing rate.`,
    entityLabel: spec.entity ?? 'category',
    scope: spec.scope ?? {},
    levers: {
      horizonWeeks: `${horizon} weeks`,
      targetGrowthPct: `${targetGrowth}%`,
      ...(targetMarginPct ? { targetMarginPct: `${targetMarginPct}%` } : {}),
    },
    assumptions: [
      'Plan is derived from the trailing run-rate grown at the target rate, not from a loaded finance budget.',
      'Margin rate, price and promotional intensity stay at trailing-period levels.',
      'No new store openings, closures or calendar shifts are modelled.',
    ],
    window: { from: b.from, to: b.to },
    rowsScanned: b.rowsScanned,
    total,
    rows,
    extra: [],
    tables: ['transactions', 'products', 'stores'],
    notes: [],
    chartMetric: 'gap_to_plan',
  };
}

// --------------------------- entry point ------------------------------------

export const SCENARIO_KINDS: ScenarioKind[] = [
  'forecast',
  'price',
  'promotion',
  'planogram',
  'assortment',
  'replenishment',
  'markdown',
  'supplier_risk',
  'stockout_risk',
  'plan',
];

export async function runScenario(
  supabase: SupabaseClient,
  spec: ScenarioSpec,
  lookups: any,
): Promise<ScenarioSet> {
  if (!SCENARIO_KINDS.includes(spec.kind)) throw new Error(`Unknown scenario "${spec.kind}"`);
  if (spec.kind === 'assortment' && !spec.entity) spec.entity = 'product';
  const baseline = await loadBaseline(supabase, spec, lookups);
  if (baseline.entities.length === 0) throw new Error(`No sales history in scope for the ${spec.kind} scenario`);

  switch (spec.kind) {
    case 'forecast':
      return buildForecast(baseline, spec);
    case 'price':
      return buildPrice(baseline, spec);
    case 'promotion':
      return buildPromotion(baseline, spec);
    case 'assortment':
      return buildAssortment(baseline, spec);
    case 'planogram':
      return buildPlanogram(supabase, baseline, spec, lookups);
    case 'replenishment':
      return buildReplenishment(supabase, baseline, spec, lookups);
    case 'markdown':
      return buildMarkdown(supabase, baseline, spec, lookups);
    case 'supplier_risk':
      return buildSupplierRisk(supabase, baseline, spec, lookups);
    case 'stockout_risk':
      return buildStockoutRisk(supabase, baseline, spec, lookups);
    case 'plan':
      return buildPlan(baseline, spec);
  }
}

export function scenarioPromptSpec(): string {
  return `PREDICTIVE / PRESCRIPTIVE SCENARIOS (simulations computed in code, never by you)
Emit these when the question is forward-looking, hypothetical, "what if", "should we", "how much would", "next quarter", "plan", "recommend", "optimise".
Each scenario: {"id":"s1","kind":...,"entity":...,"scope":{},"levers":{},"dateFrom":null,"dateTo":null,"limit":10}
entity: category | subcategory | brand | product | store | region  (grain of the simulation)
scope keys: category, subcategory, brand, product_sku, store, region  (free text, matched loosely)

kind: forecast       — demand/sales projection. levers: horizonWeeks (1-52, default 13)
kind: price          — price change simulation via own-price elasticity. levers: pricePct (e.g. -5 or 3), passThrough (0-1)
kind: promotion      — promo what-if & ROI. levers: discountPct, weeks, displayLiftPct, vendorFundingPct
kind: planogram      — space/facings reallocation. levers: facingsPct, spaceElasticity
kind: assortment     — range rationalisation / delist tail. levers: tailThresholdPct, transferRate, carryingCostPct
kind: replenishment  — safety stock, reorder point, order-now. levers: serviceLevelPct (90-99), reviewDays, leadTimeDays
kind: markdown       — clearance / markdown depth optimisation for aged stock (pricing). levers: targetSellThroughPct, weeks, ageThresholdDays, carryingCostPct, maxDepthPct
kind: supplier_risk  — vendor OTD & lead-time risk outlook, buffer prescription (supply chain). entity defaults to supplier. levers: targetOtdPct, horizonWeeks, serviceLevelPct
kind: stockout_risk  — availability / lost-sales exposure and OSA projection (demand + supply). levers: horizonWeeks, targetOsaPct, leadTimeDays
kind: plan           — executive sales & margin landing vs plan, gap to close. levers: horizonWeeks, targetGrowthPct, targetMarginPct

Module → scenario map (pick the ones matching the question's module):
executive: plan, forecast; promotion: promotion; pricing: price, markdown; assortment: assortment, forecast;
demand: forecast, stockout_risk, replenishment; supply-chain: supplier_risk, replenishment, stockout_risk; space: planogram

Rules:
- Only set levers the user implied; otherwise omit them and defaults are used.
- Pair each scenario with at least one descriptive query so the answer explains the current position before the projection.
- Never put numbers in "interpretation"; the levers are the only numeric fields you may set.`;
}
