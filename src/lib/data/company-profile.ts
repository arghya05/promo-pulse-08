// Demo tenant profile — modeled on a large US grocery/supercenter chain
// (Walmart-class scale). Used for realistic framing across the app shell.

export const companyProfile = {
  tenant: 'Everline Retail Group',
  banner: 'Everline Supercenters',
  format: 'Grocery & Supercenter',
  fiscalYear: 'FY2026',
  fiscalPeriod: 'P07 · Week 28',
  regions: ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'Pacific'],
  scale: {
    stores: 1_486,
    distributionCenters: 42,
    activeSkus: 118_400,
    weeklyTransactions: 74_200_000,
    netSalesFy: 168_400_000_000,
    grossMarginPct: 24.6,
    ecomMixPct: 17.3,
    privateLabelMixPct: 31.8,
  },
  dataFreshness: {
    posThroughDate: 'POS through yesterday 23:59 local',
    latencyMinutes: 42,
    sources: [
      'POS transactions',
      'Loyalty & basket',
      'Vendor cost files',
      'DC inventory snapshots',
      'Competitor price feed',
      'Weather & traffic signals',
    ],
  },
} as const;

export const headlineKpis = [
  {
    id: 'net-sales',
    label: 'Net sales · WTD',
    value: '$3.24B',
    delta: '+2.8%',
    trend: 'up' as const,
    note: 'vs LY comp basis',
  },
  {
    id: 'comp-sales',
    label: 'Comp store sales',
    value: '+1.9%',
    delta: '+40 bps',
    trend: 'up' as const,
    note: '1,412 comp stores',
  },
  {
    id: 'gross-margin',
    label: 'Gross margin rate',
    value: '24.6%',
    delta: '-22 bps',
    trend: 'down' as const,
    note: 'Markdown pressure in Fresh',
  },
  {
    id: 'promo-roi',
    label: 'Promo ROI',
    value: '2.41x',
    delta: '+0.18x',
    trend: 'up' as const,
    note: '412 active events',
  },
  {
    id: 'in-stock',
    label: 'On-shelf availability',
    value: '96.2%',
    delta: '-0.6 pts',
    trend: 'down' as const,
    note: 'Dairy & Frozen lagging',
  },
  {
    id: 'forecast',
    label: 'Forecast MAPE',
    value: '11.4%',
    delta: '-1.3 pts',
    trend: 'up' as const,
    note: 'Store/SKU/week level',
  },
];

export const formatBillions = (value: number) =>
  `$${(value / 1_000_000_000).toFixed(1)}B`;

export const formatCount = (value: number) =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(1)}M`
    : value >= 1_000
      ? `${(value / 1_000).toFixed(1)}K`
      : String(value);
