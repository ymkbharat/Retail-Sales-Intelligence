export interface StoreMaster {
  store_id: string;
  store_name: string;
  region: string;
  city: string;
  store_format: string;
}

export interface WeeklySales {
  week_start_date: string;
  region: string;
  store_id: string;
  store_name: string;
  city: string;
  store_format: string;
  product_category: string;
  footfall: number;
  transactions: number;
  units_sold: number;
  gross_sales: number;
  discount_amount: number;
  net_sales: number;
  sales_target: number;
  inventory_on_hand: number;
  stockouts: number;
  returns_amount: number;
  customer_rating: number;
  marketing_spend: number;
}

export interface MergedSalesRow extends WeeklySales {
  // All fields are already contained in WeeklySales, but we extend for flexibility
}

export interface DashboardFilters {
  weeks: string[];
  regions: string[];
  stores: string[];
  cities: string[];
  storeFormats: string[];
  productCategories: string[];
}

export interface KpiMetrics {
  netSales: number;
  targetSales: number;
  targetAchievement: number;
  atv: number; // Average Transaction Value
  returnRate: number;
  discountRate: number;
}
