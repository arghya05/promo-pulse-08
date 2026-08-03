import { 
  Tag, 
  DollarSign, 
  LayoutGrid, 
  TrendingUp, 
  Truck, 
  Grid3X3,
  Briefcase,
  LucideIcon
} from 'lucide-react';

export interface Module {
  id: string;
  name: string;
  shortName: string;
  description: string;
  /** Short operator-facing framing of what the module answers */
  focus: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  path: string;
}

export const modules: Module[] = [
  {
    id: 'executive',
    name: 'Executive Insights',
    shortName: 'Executive',
    description: 'Strategic C-suite analytics across pricing, promotion, demand, supply chain & space planning',
    focus: 'Comp sales, margin rate and cross-function trade-offs',
    icon: Briefcase,
    color: 'text-chart-1',
    gradient: 'from-chart-1/20 via-chart-1/5 to-transparent',
    path: '/executive'
  },
  {
    id: 'promotion',
    name: 'Promotion Intelligence',
    shortName: 'Promotion',
    description: 'Analyze promotion ROI, effectiveness, and customer response',
    focus: 'Event ROI, incrementality and mechanic mix',
    icon: Tag,
    color: 'text-chart-4',
    gradient: 'from-chart-4/20 via-chart-4/5 to-transparent',
    path: '/promotion'
  },
  {
    id: 'pricing',
    name: 'Pricing Optimization',
    shortName: 'Pricing',
    description: 'Optimize pricing strategies, elasticity analysis, and competitive positioning',
    focus: 'Elasticity, KVI gaps and margin recovery',
    icon: DollarSign,
    color: 'text-chart-3',
    gradient: 'from-chart-3/20 via-chart-3/5 to-transparent',
    path: '/pricing'
  },
  {
    id: 'assortment',
    name: 'Assortment Planning',
    shortName: 'Assortment',
    description: 'Plan product mix, category management, and SKU rationalization',
    focus: 'SKU velocity, private label mix and range gaps',
    icon: LayoutGrid,
    color: 'text-chart-2',
    gradient: 'from-chart-2/20 via-chart-2/5 to-transparent',
    path: '/assortment'
  },
  {
    id: 'demand',
    name: 'Demand Forecasting',
    shortName: 'Demand',
    description: 'Forecast demand, plan replenishment, and optimize inventory levels',
    focus: 'Store/SKU/week accuracy, bias and replenishment',
    icon: TrendingUp,
    color: 'text-chart-5',
    gradient: 'from-chart-5/20 via-chart-5/5 to-transparent',
    path: '/demand'
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    shortName: 'Supply Chain',
    description: 'Optimize logistics, supplier management, and distribution',
    focus: 'Vendor fill rate, lead time and DC reliability',
    icon: Truck,
    color: 'text-chart-2',
    gradient: 'from-chart-2/20 via-chart-2/5 to-transparent',
    path: '/supply-chain'
  },
  {
    id: 'space',
    name: 'Space Planning',
    shortName: 'Space',
    description: 'Design planograms, optimize shelf space, and maximize sales per square foot',
    focus: 'Sales per linear foot and planogram compliance',
    icon: Grid3X3,
    color: 'text-chart-1',
    gradient: 'from-chart-1/20 via-chart-1/5 to-transparent',
    path: '/space'
  }
];

export const getModuleById = (id: string): Module | undefined => {
  return modules.find(m => m.id === id);
};
