import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { AlertOctagon, Package, ArrowRight, ShieldCheck } from "lucide-react";
import { MergedSalesRow } from "../types";
import { compareDDMMYYYY } from "../utils/csvHelper";

interface ChartsProps {
  data: MergedSalesRow[];
}

const COLORS = ["#4f46e5", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"];

export default function Charts({ data }: ChartsProps) {
  // 1. Weekly Trend Data
  const weeklyTrendData = useMemo(() => {
    const weeklyMap: Record<string, { week_start_date: string; Actual: number; Target: number }> = {};
    for (const row of data) {
      if (!weeklyMap[row.week_start_date]) {
        weeklyMap[row.week_start_date] = { week_start_date: row.week_start_date, Actual: 0, Target: 0 };
      }
      weeklyMap[row.week_start_date].Actual += row.net_sales;
      weeklyMap[row.week_start_date].Target += row.sales_target;
    }
    return Object.values(weeklyMap).sort((a, b) => compareDDMMYYYY(a.week_start_date, b.week_start_date));
  }, [data]);

  // 2. Sales by Region Data
  const salesByRegionData = useMemo(() => {
    const regionMap: Record<string, number> = {};
    for (const row of data) {
      regionMap[row.region] = (regionMap[row.region] || 0) + row.net_sales;
    }
    return Object.entries(regionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // 3. Category Performance Data
  const categoryData = useMemo(() => {
    const catMap: Record<string, { name: string; Sales: number; Returns: number }> = {};
    for (const row of data) {
      if (!catMap[row.product_category]) {
        catMap[row.product_category] = { name: row.product_category, Sales: 0, Returns: 0 };
      }
      catMap[row.product_category].Sales += row.net_sales;
      catMap[row.product_category].Returns += row.returns_amount;
    }
    return Object.values(catMap).sort((a, b) => b.Sales - a.Sales);
  }, [data]);

  // 4. Store Leaderboard Data (Top 10 Stores by Net Sales)
  const storeLeaderboard = useMemo(() => {
    const storeMap: Record<string, { StoreName: string; Sales: number; Target: number }> = {};
    for (const row of data) {
      if (!storeMap[row.store_name]) {
        storeMap[row.store_name] = { StoreName: row.store_name, Sales: 0, Target: 0 };
      }
      storeMap[row.store_name].Sales += row.net_sales;
      storeMap[row.store_name].Target += row.sales_target;
    }
    return Object.values(storeMap)
      .sort((a, b) => b.Sales - a.Sales)
      .slice(0, 10);
  }, [data]);

  // 5. Stockout Risk Indicator (Products with low inventory metrics)
  // Low inventory is defined as inventory_on_hand <= 15 or stockouts > 0
  const stockoutRiskProducts = useMemo(() => {
    const riskItems: Array<{
      key: string;
      StoreName: string;
      ProductCategory: string;
      InventoryCount: number;
      ReorderPoint: number;
      Deficit: number;
    }> = [];

    for (const row of data) {
      const isRisk = (row.stockouts && row.stockouts > 0) || row.inventory_on_hand <= 15;
      if (isRisk) {
        const threshold = row.stockouts > 0 ? 20 : 15;
        const deficit = Math.max(1, threshold - row.inventory_on_hand);
        riskItems.push({
          key: `${row.week_start_date}-${row.store_id}-${row.product_category}`,
          StoreName: row.store_name,
          ProductCategory: row.product_category,
          InventoryCount: row.inventory_on_hand,
          ReorderPoint: threshold,
          Deficit: deficit
        });
      }
    }

    // Sort by deficit descending (highest risk first)
    return riskItems.sort((a, b) => b.Deficit - a.Deficit);
  }, [data]);

  // Format currency for Y-axis and Tooltips
  const formatYAxis = (tick: number) => {
    if (tick >= 1000000) return `$${(tick / 1000000).toFixed(1)}M`;
    if (tick >= 1000) return `$${(tick / 1000).toFixed(0)}k`;
    return `$${tick}`;
  };

  const customTooltipFormatter = (value: number) => {
    return [new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)];
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
        <AlertOctagon className="w-12 h-12 text-slate-400 mb-3" />
        <h3 className="text-base font-bold text-gray-700">No Filtered Data Available</h3>
        <p className="text-xs text-gray-400 mt-1">Try resetting your active filters to display visual charts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Section Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Weekly Sales Trend */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Weekly Revenue Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Weekly net actual sales vs target projections</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week_start_date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatYAxis} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={customTooltipFormatter}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                  labelStyle={{ fontWeight: "bold", color: "#6366f1" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="Actual" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 6 }} name="Actual Sales" />
                <Line type="monotone" dataKey="Target" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" name="Target Sales" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Sales by Region */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Sales by Region</h3>
              <p className="text-xs text-gray-500 mt-0.5">Regional revenue distribution</p>
            </div>
          </div>
          <div className="h-80 w-full flex flex-col justify-between items-center">
            <div className="h-60 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByRegionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {salesByRegionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={customTooltipFormatter}
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Net Sales</span>
                <span className="text-lg font-extrabold text-gray-800">
                  {formatYAxis(salesByRegionData.reduce((acc, curr) => acc + curr.value, 0))}
                </span>
              </div>
            </div>

            {/* Labels custom display */}
            <div className="w-full grid grid-cols-2 gap-2 px-2 pb-2">
              {salesByRegionData.map((item, index) => {
                const total = salesByRegionData.reduce((acc, curr) => acc + curr.value, 0);
                const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={item.name} className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-xs font-semibold text-gray-700 truncate">{item.name}</span>
                    <span className="text-xs font-bold text-gray-500 font-mono ml-auto">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Category Performance */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Category Performance</h3>
              <p className="text-xs text-gray-500 mt-0.5">Sales contribution by division</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={formatYAxis} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={75} tickLine={false} />
                <Tooltip
                  formatter={customTooltipFormatter}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="Sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Sales" barSize={14}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Store Leaderboard */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Store Leaderboard</h3>
              <p className="text-xs text-gray-500 mt-0.5">Top 10 Stores by absolute actual net sales</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeLeaderboard} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="StoreName" stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(name) => name.length > 12 ? `${name.substring(0, 10)}...` : name} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={formatYAxis} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={customTooltipFormatter}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="Sales" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Actual Sales" barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. Stockout Risk Indicator Section */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Package className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Stockout Risk Indicator</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Highlighting products where current inventory count is below or equal to the designated safety reorder point.
              </p>
            </div>
          </div>
          <div className="flex items-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
            <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mr-2.5 animate-pulse" />
            <span className="text-xs font-bold text-amber-800">
              {stockoutRiskProducts.length} high-alert stock configurations detected
            </span>
          </div>
        </div>

        {stockoutRiskProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-gray-700">All Products Safely Stocked</p>
            <p className="text-xs text-gray-400 mt-0.5">No products fall below their specified reorder thresholds.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Store Location</th>
                  <th className="py-3 px-4">Product Category</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Reorder Threshold</th>
                  <th className="py-3 px-4 text-center">Unit Deficit</th>
                  <th className="py-3 px-4 text-right">Risk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {stockoutRiskProducts.slice(0, 5).map((prod, index) => {
                  const severity = prod.InventoryCount === 0 
                    ? "Critical (Out of Stock)" 
                    : prod.InventoryCount < prod.ReorderPoint * 0.4 
                      ? "High Risk" 
                      : "Moderate Alert";
                  
                  const badgeColor = prod.InventoryCount === 0 
                    ? "bg-red-100 text-red-800 border border-red-200" 
                    : prod.InventoryCount < prod.ReorderPoint * 0.4 
                      ? "bg-orange-100 text-orange-800 border border-orange-200" 
                      : "bg-amber-100 text-amber-800 border border-amber-200";

                  return (
                    <tr key={`${prod.key}-${index}`} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">{prod.StoreName}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                          {prod.ProductCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono text-rose-600">
                        {prod.InventoryCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-gray-500">{prod.ReorderPoint}</td>
                      <td className="py-3 px-4 text-center font-mono text-amber-700 font-semibold">
                        -{prod.Deficit}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                          {severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {stockoutRiskProducts.length > 5 && (
              <div className="bg-slate-50 p-2.5 text-center text-xs font-semibold text-indigo-600 border-t border-gray-100">
                And {stockoutRiskProducts.length - 5} other stockout alarms are active. Filter store or category to view specific locations.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
