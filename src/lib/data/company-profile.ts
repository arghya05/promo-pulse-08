// Demo tenant profile — modeled on a large US grocery/supercenter chain
// (Walmart-class scale). Used for realistic framing across the app shell.

export const companyProfile = {
  tenant: 'Everline Retail Group',
  banner: 'Everline Supercenters',
  format: 'Grocery & Supercenter',
  fiscalYear: 'FY2026',
  fiscalPeriod: 'P07 · Week 27',
  regions: ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'],
  scale: {
    stores: 1_486,
    distributionCenters: 42,
    activeSkus: 118_400,
    weeklyTransactions: 74_200_000,
    netSalesFy: 168_400_000_000,
    grossMarginPct: 28.3,
    ecomMixPct: 14.6,
    privateLabelMixPct: 24.1,
  },
  dataFreshness: {
    posThroughDate: 'POS through yesterday 23:59 local',
    latencyMinutes: 42,
    sources: [
      'POS transactions & scan data',
      'Loyalty households & basket',
      'Vendor cost & trade funding files',
      'DC + store perpetual inventory',
      'Competitor price feed (10 banners)',
      'Weather, events & traffic signals',
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
    value: '28.3%',
    delta: '-24 bps',
    trend: 'down' as const,
    note: 'Fresh shrink & markdown pressure',
  },
  {
    id: 'promo-roi',
    label: 'Promo ROI',
    value: '2.41x',
    delta: '+0.18x',
    trend: 'up' as const,
    note: 'Trade spend 9.8% of promoted sales',
  },
  {
    id: 'in-stock',
    label: 'On-shelf availability',
    value: '92.8%',
    delta: '-0.9 pts',
    trend: 'down' as const,
    note: 'Fresh & Dairy thin cover',
  },
  {
    id: 'forecast',
    label: 'Forecast MAPE',
    value: '12.9%',
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
