// 타입 정의

export interface Stock {
  symbol: string;
  shortName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  industry: string;
  compositeScore: number;
  rank: number;
  selectedAt: string;
}

export interface Briefing {
  briefingId: string;
  symbol: string;
  shortName: string;
  date: string;
  status: 'completed' | 'processing' | 'failed';
  textSummary: {
    title: string;
    summary: string;
    keyPoints: string[];
    investmentInsight: string;
    generatedAt: string;
  };
  imageBriefing: {
    imageUrl: string;
    thumbnailUrl: string;
    format: string;
    dimensions: {
      width: number;
      height: number;
    };
    fileSize: number;
    generatedAt: string;
  };
  createdAt: string;
}

export interface SelectionCriteria {
  type: 'volume' | 'gain' | 'composite';
  rank: number;
  description: string;
}

export interface PriceData {
  date: string;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface StockChartData {
  symbol: string;
  historicalData: PriceData[];
}

export type ConditionType = 'price' | 'changePercent' | 'volume';
export type ComparisonOperator = '>=' | '<=' | '>' | '<';
export type LogicalOperator = 'AND' | 'OR';
export type TimeUnit = '1min' | '5min' | '1hour' | '1day';

export interface AlertCondition {
  id: string;
  type: ConditionType;
  operator: ComparisonOperator;
  value: number;
  logicalOperator?: LogicalOperator; // 첫 번째 조건에는 없음
}

export interface AlertSettings {
  id: string;
  symbol: string;
  symbolName: string;
  conditions: AlertCondition[];
  timeUnit: TimeUnit;
  enabled: boolean;
  browserPush: boolean;
  sound: boolean;
  vibration: boolean;
  createdAt: string;
  lastTriggered?: string;
}

export interface AlertHistory {
  id: string;
  alertId: string;
  symbol: string;
  message: string;
  triggeredAt: string;
  conditionMet: AlertCondition;
}

export type CalendarViewMode = 'month' | 'week' | 'list';
export type WeekStartDay = 'sunday' | 'monday';

export interface CalendarSettings {
  viewMode: CalendarViewMode;
  weekStartDay: WeekStartDay;
  lastViewedDate?: string;
  filters?: {
    categories?: string[];
    keyword?: string;
  };
}

export interface BriefingByDate {
  date: string;
  briefings: Briefing[];
  count: number;
}

export type FavoriteSortBy = 'order' | 'name' | 'changePercent' | 'volume';
export type FavoriteGroup = string;

export interface FavoriteStock {
  id: string; // symbol
  name: string; // shortName
  addedAt: string; // ISO date string
  order: number;
  group: string; // 기본값: "기본"
}

export interface FavoriteSettings {
  sortBy: FavoriteSortBy;
  maxItems: number;
}

export interface FavoriteData {
  favorites: FavoriteStock[];
  settings: FavoriteSettings;
}
