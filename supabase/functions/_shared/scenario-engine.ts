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
  | 'replenishment';

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
  const has = (v: unknown, needle: string) => String(v ?? '').toLowerCase().includes(needle.toLowerCase());
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
  }

  const spanWeeks = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / (7 * DAY)));
  return {
    entities: Array.from(map.values()).sort((a, b) => b.sales - a.sales),
    rowsScanned: scanned,
    from,
    to,
    weeks: spanWeeks,
    weekKeys: Array.from(weekKeys).sort(),
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

// --------------------------- entry point ------------------------------------

export const SCENARIO_KINDS: ScenarioKind[] = ['forecast', 'price', 'promotion', 'planogram', 'assortment', 'replenishment'];

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

Rules:
- Only set levers the user implied; otherwise omit them and defaults are used.
- Pair each scenario with at least one descriptive query so the answer explains the current position before the projection.
- Never put numbers in "interpretation"; the levers are the only numeric fields you may set.`;
}
