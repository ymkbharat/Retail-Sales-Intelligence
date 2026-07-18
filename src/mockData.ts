import { StoreMaster, WeeklySales } from "./types";

export const DEFAULT_STORE_MASTER: StoreMaster[] = [
  { store_id: "S001", store_name: "Metropolitan Hub", region: "East", city: "New York", store_format: "Hypermarket" },
  { store_id: "S002", store_name: "Bayside Express", region: "East", city: "Boston", store_format: "Express" },
  { store_id: "S003", store_name: "Windy City Plaza", region: "North", city: "Chicago", store_format: "Supermarket" },
  { store_id: "S004", store_name: "Midwest Galleria", region: "North", city: "Chicago", store_format: "Department Store" },
  { store_id: "S005", store_name: "Coastal Terminal", region: "West", city: "Los Angeles", store_format: "Hypermarket" },
  { store_id: "S006", store_name: "Silicon Valley Depot", region: "West", city: "San Francisco", store_format: "Express" },
  { store_id: "S007", store_name: "Pacific Center", region: "West", city: "Seattle", store_format: "Supermarket" },
  { store_id: "S008", store_name: "Lone Star Flagship", region: "South", city: "Houston", store_format: "Hypermarket" },
  { store_id: "S009", store_name: "Everglades Mart", region: "South", city: "Miami", store_format: "Express" },
  { store_id: "S010", store_name: "Peach State Galleria", region: "South", city: "Atlanta", store_format: "Department Store" }
];

export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Apparel",
  "Home & Kitchen",
  "Groceries",
  "Beauty & Personal Care"
];

// Generate comprehensive sales data
// 10 stores x 5 categories x 12 weeks = 600 rows
export function generateMockSalesData(): WeeklySales[] {
  const sales: WeeklySales[] = [];
  
  // Create 12 weeks of dates starting from April 1st, 2026 in DD-MM-YYYY format
  const startDay = new Date(2026, 3, 1); // April 1st, 2026
  const weeks: { dateStr: string; weekNum: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(startDay.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    weeks.push({
      dateStr: `${day}-${month}-${year}`,
      weekNum: i + 1
    });
  }

  // Base parameters per category to make the trends look realistic
  const categoryConfigs: Record<string, { baseSales: number; atv: number; baseReturnRate: number; baseDiscountRate: number }> = {
    "Electronics": { baseSales: 15000, atv: 250, baseReturnRate: 0.05, baseDiscountRate: 0.04 },
    "Apparel": { baseSales: 8000, atv: 75, baseReturnRate: 0.14, baseDiscountRate: 0.12 },
    "Home & Kitchen": { baseSales: 6000, atv: 110, baseReturnRate: 0.06, baseDiscountRate: 0.06 },
    "Groceries": { baseSales: 18000, atv: 45, baseReturnRate: 0.01, baseDiscountRate: 0.02 },
    "Beauty & Personal Care": { baseSales: 4500, atv: 35, baseReturnRate: 0.03, baseDiscountRate: 0.08 }
  };

  // Base parameters per store format
  const formatMultiplier: Record<string, number> = {
    "Hypermarket": 1.5,
    "Supermarket": 1.1,
    "Department Store": 0.9,
    "Express": 0.5
  };

  for (const { dateStr, weekNum } of weeks) {
    // Introduce an overall weekly trend
    const trendFactor = 0.95 + Math.sin((weekNum / 12) * Math.PI) * 0.15 + (weekNum * 0.01);

    for (const store of DEFAULT_STORE_MASTER) {
      const storeMult = formatMultiplier[store.store_format] || 1.0;
      
      for (const category of PRODUCT_CATEGORIES) {
        const config = categoryConfigs[category];
        
        // Random variance between -15% and +15%
        const randomVariance = 0.85 + Math.random() * 0.3;
        
        // Calculate net sales
        const net_sales = Math.round(config.baseSales * storeMult * trendFactor * randomVariance);
        
        // Target is sometimes met, sometimes missed
        const targetMultiplier = (store.region === "South" && category === "Electronics") ? 1.12 : 0.98;
        const sales_target = Math.round(net_sales * targetMultiplier * (0.9 + Math.random() * 0.2));
        
        // Calculate Transactions based on sales and typical ATV
        const transactions = Math.max(1, Math.round(net_sales / (config.atv * (0.9 + Math.random() * 0.2))));
        
        // Footfall
        const footfall = Math.round(transactions / (0.2 + Math.random() * 0.2));
        
        // Units sold
        const units_sold = Math.round(transactions * (1.5 + Math.random() * 2.5));

        // Calculate discounts and return amounts
        const returnRate = config.baseReturnRate * (0.8 + Math.random() * 0.4);
        const returns_amount = Math.round(net_sales * returnRate);
        
        const discountRate = config.baseDiscountRate * (0.7 + Math.random() * 0.6);
        const discount_amount = Math.round(net_sales * discountRate);
        
        const gross_sales = net_sales + discount_amount;

        // Inventory metrics
        const maxInv = store.store_format === "Hypermarket" ? 200 : store.store_format === "Express" ? 40 : 100;
        const inventory_on_hand = Math.floor(Math.random() * maxInv);
        const threshold = store.store_format === "Hypermarket" ? 30 : store.store_format === "Express" ? 10 : 20;
        
        // Stockout count
        const stockouts = inventory_on_hand <= threshold ? Math.floor(1 + Math.random() * 3) : 0;

        // Customer rating
        const customer_rating = Number((3.8 + Math.random() * 1.2).toFixed(1));

        // Marketing spend
        const marketing_spend = Math.round(net_sales * (0.02 + Math.random() * 0.03));

        sales.push({
          week_start_date: dateStr,
          region: store.region,
          store_id: store.store_id,
          store_name: store.store_name,
          city: store.city,
          store_format: store.store_format,
          product_category: category,
          footfall,
          transactions,
          units_sold,
          gross_sales,
          discount_amount,
          net_sales,
          sales_target,
          inventory_on_hand,
          stockouts,
          returns_amount,
          customer_rating,
          marketing_spend
        });
      }
    }
  }

  return sales;
}

export const DEFAULT_WEEKLY_SALES: WeeklySales[] = generateMockSalesData();
