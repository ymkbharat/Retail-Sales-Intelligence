import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  SlidersHorizontal, 
  Database,
  ArrowRight,
  Info
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import Filters from "./components/Filters";
import KpiCards from "./components/KpiCards";
import Charts from "./components/Charts";
import Insights from "./components/Insights";
import DataIntegration from "./components/DataIntegration";

import { StoreMaster, WeeklySales, MergedSalesRow, DashboardFilters } from "./types";
import { DEFAULT_STORE_MASTER, DEFAULT_WEEKLY_SALES, generateMockSalesData } from "./mockData";
import { exportToCsv, compareDDMMYYYY } from "./utils/csvHelper";

const INITIAL_FILTERS: DashboardFilters = {
  weeks: [],
  regions: [],
  stores: [],
  cities: [],
  storeFormats: [],
  productCategories: []
};

export default function App() {
  // Global Data States
  const [salesData, setSalesData] = useState<WeeklySales[]>(() => DEFAULT_WEEKLY_SALES);
  const [storeMaster, setStoreMaster] = useState<StoreMaster[]>(() => DEFAULT_STORE_MASTER);
  
  // Custom upload status tracking
  const [isSalesMocked, setIsSalesMocked] = useState(true);
  const [isStoreMocked, setIsStoreMocked] = useState(true);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "sources" | "insights">("dashboard");

  // Filter State
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);

  // Auto-clock for the header
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Merge Weekly Sales and Store Master by store_id
  const mergedData = useMemo<MergedSalesRow[]>(() => {
    const storeMap = new Map<string, StoreMaster>();
    for (const store of storeMaster) {
      storeMap.set(store.store_id, store);
    }

    const merged: MergedSalesRow[] = [];
    for (const sales of salesData) {
      // First, refine/clean the data: skip if week_start_date is empty, null, or represents "Invalid Date"
      if (
        !sales.week_start_date || 
        sales.week_start_date === "Invalid Date" || 
        sales.week_start_date.toLowerCase() === "invalid date"
      ) {
        continue;
      }

      const store = storeMap.get(sales.store_id);
      merged.push({
        ...sales,
        store_name: sales.store_name || (store ? store.store_name : `Store (${sales.store_id})`),
        region: sales.region || (store ? store.region : "Unknown"),
        city: sales.city || (store ? store.city : "Unknown"),
        store_format: sales.store_format || (store ? store.store_format : "Unknown")
      });
    }
    return merged;
  }, [salesData, storeMaster]);

  // 2. Filter data dynamically based on selection
  const filteredData = useMemo<MergedSalesRow[]>(() => {
    return mergedData.filter((row) => {
      if (filters.weeks.length > 0 && !filters.weeks.includes(row.week_start_date)) return false;
      if (filters.regions.length > 0 && !filters.regions.includes(row.region)) return false;
      if (filters.stores.length > 0 && !filters.stores.includes(row.store_name)) return false;
      if (filters.cities.length > 0 && !filters.cities.includes(row.city)) return false;
      if (filters.storeFormats.length > 0 && !filters.storeFormats.includes(row.store_format)) return false;
      if (filters.productCategories.length > 0 && !filters.productCategories.includes(row.product_category)) return false;
      return true;
    });
  }, [mergedData, filters]);

  // 3. Extract dynamic options for the filters dropdowns based on the full merged dataset
  const allWeeks = useMemo(() => Array.from(new Set(mergedData.map(r => r.week_start_date))).sort(compareDDMMYYYY), [mergedData]);
  const allRegions = useMemo(() => Array.from(new Set(mergedData.map(r => r.region))).sort(), [mergedData]);
  const allStores = useMemo(() => Array.from(new Set(mergedData.map(r => r.store_name))).sort(), [mergedData]);
  const allCities = useMemo(() => Array.from(new Set(mergedData.map(r => r.city))).sort(), [mergedData]);
  const allStoreFormats = useMemo(() => Array.from(new Set(mergedData.map(r => r.store_format))).sort(), [mergedData]);
  const allProductCategories = useMemo(() => Array.from(new Set(mergedData.map(r => r.product_category))).sort(), [mergedData]);

  // Reset to default mock data
  const handleResetToMock = () => {
    setSalesData(generateMockSalesData());
    setStoreMaster(DEFAULT_STORE_MASTER);
    setIsSalesMocked(true);
    setIsStoreMocked(true);
    setFilters(INITIAL_FILTERS);
  };

  // CSV export handler
  const exportFilteredData = () => {
    const dataToExport = filteredData.map(row => ({
      week_start_date: row.week_start_date,
      store_id: row.store_id,
      store_name: row.store_name,
      region: row.region,
      city: row.city,
      store_format: row.store_format,
      product_category: row.product_category,
      footfall: row.footfall,
      transactions: row.transactions,
      units_sold: row.units_sold,
      gross_sales: row.gross_sales,
      discount_amount: row.discount_amount,
      net_sales: row.net_sales,
      sales_target: row.sales_target,
      inventory_on_hand: row.inventory_on_hand,
      stockouts: row.stockouts,
      returns_amount: row.returns_amount,
      customer_rating: row.customer_rating,
      marketing_spend: row.marketing_spend,
      achievement_percent: row.sales_target > 0 ? ((row.net_sales / row.sales_target) * 100).toFixed(2) : "0.00"
    }));
    exportToCsv(dataToExport, "retail_sales_report_export.csv");
  };

  const handleSalesUploaded = (data: WeeklySales[]) => {
    setSalesData(data);
    setIsSalesMocked(false);
  };

  const handleStoreUploaded = (data: StoreMaster[]) => {
    setStoreMaster(data);
    setIsStoreMocked(false);
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="flex bg-slate-50 font-sans h-screen overflow-hidden text-slate-800">
      
      {/* Dynamic Left Sidebar containing navigators and uploads */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSalesMocked={isSalesMocked}
        isStoreMocked={isStoreMocked}
        salesCount={salesData.length}
        storeCount={storeMaster.length}
        onSalesUploaded={handleSalesUploaded}
        onStoreUploaded={handleStoreUploaded}
        onResetToMock={handleResetToMock}
      />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Executive Header Bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4.5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                System Online
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === "dashboard" && "Executive Sales Intelligence"}
              {activeTab === "sources" && "Data Integration Portal"}
              {activeTab === "insights" && "Automated Business Advisories"}
            </h1>
          </div>

          {/* User Profile and Dynamic Clock */}
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-2.5 text-slate-500 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-xs font-mono font-semibold text-slate-600 truncate max-w-[210px]">
                {currentTime || "Loading Calendar..."}
              </span>
            </div>

            <div className="flex items-center space-x-3 bg-indigo-50/50 border border-indigo-100 rounded-xl px-3.5 py-1.5">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
                MY
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] text-indigo-600 uppercase font-extrabold tracking-wider leading-none">Tiger Analytics</p>
                <p className="text-xs font-semibold text-slate-800 leading-tight mt-0.5">manikanta.yellap</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Pane with transitions */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-6"
            >
              
              {/* VIEW 1: EXECUTIVE DASHBOARD */}
              {activeTab === "dashboard" && (
                <>
                  {/* Filters block */}
                  <Filters
                    filters={filters}
                    setFilters={setFilters}
                    allWeeks={allWeeks}
                    allRegions={allRegions}
                    allStores={allStores}
                    allCities={allCities}
                    allStoreFormats={allStoreFormats}
                    allProductCategories={allProductCategories}
                    onClearFilters={handleClearFilters}
                  />

                  {/* Informational Notification on File Upload and Quick Switch */}
                  <div className="bg-indigo-50 border border-indigo-100/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <Info className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-indigo-950">Customize this Dashboard with Your Own Data</h4>
                        <p className="text-[11px] text-indigo-800/80 mt-0.5">
                          Drag and drop your `retail_weekly_sales` or `store_master` Excel/CSV sheets into the sidebar to see charts reload instantly!
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab("sources")}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 shrink-0 self-start sm:self-auto"
                    >
                      <span>Open File Integration Center</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* KPI summary metrics cards */}
                  <KpiCards data={filteredData} />

                  {/* Dynamic visualizations container */}
                  <Charts data={filteredData} />
                </>
              )}

              {/* VIEW 2: DATA INTEGRATION & PREVIEWS */}
              {activeTab === "sources" && (
                <DataIntegration
                  salesData={salesData}
                  storeMaster={storeMaster}
                  isSalesMocked={isSalesMocked}
                  isStoreMocked={isStoreMocked}
                  onSalesUploaded={handleSalesUploaded}
                  onStoreUploaded={handleStoreUploaded}
                  onReset={handleResetToMock}
                  exportFilteredData={exportFilteredData}
                  filteredCount={filteredData.length}
                />
              )}

              {/* VIEW 3: AUTOMATED BUSINESS INSIGHTS */}
              {activeTab === "insights" && (
                <Insights data={filteredData} />
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}
