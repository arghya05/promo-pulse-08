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
  description: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  path: string;
}

export const modules: Module[] = [
  {
    id: 'executive',
    name: 'Executive Insights',
    description: 'Strategic C-suite analytics across pricing, promotion, demand, supply chain & space planning',
    icon: Briefcase,
    color: 'text-indigo-600',
    gradient: 'from-indigo-500/20 to-indigo-600/10',
    path: '/executive'
  },
  {
    id: 'promotion',
    name: 'Promotion Intelligence',
    description: 'Analyze promotion ROI, effectiveness, and customer response',
    icon: Tag,
    color: 'text-orange-500',
    gradient: 'from-orange-500/20 to-orange-600/10',
    path: '/promotion'
  },
  {
    id: 'pricing',
    name: 'Pricing Optimization',
    description: 'Optimize pricing strategies, elasticity analysis, and competitive positioning',
    icon: DollarSign,
    color: 'text-green-500',
    gradient: 'from-green-500/20 to-green-600/10',
    path: '/pricing'
  },
  {
    id: 'assortment',
    name: 'Assortment Planning',
    description: 'Plan product mix, category management, and SKU rationalization',
    icon: LayoutGrid,
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-blue-600/10',
    path: '/assortment'
  },
  {
    id: 'demand',
    name: 'Demand Forecasting',
    description: 'Forecast demand, plan replenishment, and optimize inventory levels',
    icon: TrendingUp,
    color: 'text-purple-500',
    gradient: 'from-purple-500/20 to-purple-600/10',
    path: '/demand'
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    description: 'Optimize logistics, supplier management, and distribution',
    icon: Truck,
    color: 'text-cyan-500',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    path: '/supply-chain'
  },
  {
    id: 'space',
    name: 'Space Planning',
    description: 'Design planograms, optimize shelf space, and maximize sales per square foot',
    icon: Grid3X3,
    color: 'text-pink-500',
    gradient: 'from-pink-500/20 to-pink-600/10',
    path: '/space'
  }
];

export const getModuleById = (id: string): Module | undefined => {
  return modules.find(m => m.id === id);
};
