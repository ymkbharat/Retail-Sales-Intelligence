import React, { useMemo } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle2, 
  Store, 
  Lightbulb 
} from "lucide-react";
import { MergedSalesRow } from "../types";

interface InsightsProps {
  data: MergedSalesRow[];
}

export default function Insights({ data }: InsightsProps) {
  const insights = useMemo(() => {
    if (data.length === 0) return null;

    // 1. Regional Performance
    const regionSales: Record<string, number> = {};
    let totalSales = 0;
    for (const row of data) {
      regionSales[row.region] = (regionSales[row.region] || 0) + row.net_sales;
      totalSales += row.net_sales;
    }

    const sortedRegions = Object.entries(regionSales)
      .map(([name, sales]) => ({ name, sales, share: (sales / totalSales) * 100 }))
      .sort((a, b) => b.sales - a.sales);

    const bestRegion = sortedRegions[0];
    const worstRegion = sortedRegions[sortedRegions.length - 1];

    // 2. Stores missing targets (<100%)
    const storeMap: Record<string, { StoreName: string; Region: string; Actual: number; Target: number }> = {};
    for (const row of data) {
      if (!storeMap[row.store_name]) {
        storeMap[row.store_name] = { StoreName: row.store_name, Region: row.region, Actual: 0, Target: 0 };
      }
      storeMap[row.store_name].Actual += row.net_sales;
      storeMap[row.store_name].Target += row.sales_target;
    }

    const missedStores = Object.values(storeMap)
      .map(store => {
        const ach = store.Target > 0 ? (store.Actual / store.Target) * 100 : 0;
        const deficit = store.Target - store.Actual;
        return { ...store, achievement: ach, deficit };
      })
      .filter(store => store.achievement < 100)
      .sort((a, b) => a.achievement - b.achievement); // Worst first

    // 3. Product Categories with High Return Rates
    const categoryMetrics: Record<string, { Sales: number; Returns: number }> = {};
    let grandReturns = 0;
    let grandSales = 0;

    for (const row of data) {
      if (!categoryMetrics[row.product_category]) {
        categoryMetrics[row.product_category] = { Sales: 0, Returns: 0 };
      }
      categoryMetrics[row.product_category].Sales += row.net_sales;
      categoryMetrics[row.product_category].Returns += row.returns_amount;
      grandReturns += row.returns_amount;
      grandSales += row.net_sales;
    }

    const averageReturnRate = grandSales > 0 ? (grandReturns / grandSales) * 100 : 0;

    const highReturnCategories = Object.entries(categoryMetrics)
      .map(([name, metrics]) => {
        const rate = metrics.Sales > 0 ? (metrics.Returns / metrics.Sales) * 100 : 0;
        return { name, rate, ...metrics };
      })
      // Categorize as "abnormally high" if return rate exceeds overall average plus a small buffer
      .filter(cat => cat.rate > averageReturnRate)
      .sort((a, b) => b.rate - a.rate);

    return {
      bestRegion,
      worstRegion,
      missedStores,
      highReturnCategories,
      averageReturnRate,
      sortedRegions
    };
  }, [data]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (data.length === 0 || !insights) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
        <HelpCircle className="w-12 h-12 text-slate-400 mb-3" />
        <h3 className="text-base font-bold text-gray-700">Insights Unavailable</h3>
        <p className="text-xs text-gray-400 mt-1">Please select a valid dataset filter combination to calculate insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Title Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-indigo-200">Business Intel Report</h2>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Executive Summary & Advisory</h1>
          <p className="text-xs text-slate-300">
            Real-time diagnostic analysis derived from {data.length} active multi-dimensional records.
          </p>
        </div>
        <div className="hidden md:flex flex-col text-right">
          <span className="text-[10px] text-indigo-300 font-mono uppercase font-bold">Auto-Calculated Engine</span>
          <span className="text-xs font-semibold text-slate-200">Health Status: Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INSIGHT 1: Regional Sales dynamics */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">
                Geographic Shares
              </span>
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">Regional Dynamics</h3>
              <p className="text-xs text-gray-400 mt-1">Dynamic analysis of territorial sales leadership and soft spots.</p>
            </div>

            {/* Region Details */}
            <div className="space-y-3 pt-2">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-emerald-800">Top Performing Region</p>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-sm font-black text-emerald-900">{insights.bestRegion.name}</span>
                  <span className="text-sm font-bold text-emerald-800 font-mono">
                    {formatCurrency(insights.bestRegion.sales)}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Commands <span className="font-bold">{insights.bestRegion.share.toFixed(1)}%</span> of overall retail revenue in this filter scope.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-slate-700">Lowest Performing Region</p>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-sm font-black text-slate-900">{insights.worstRegion.name}</span>
                  <span className="text-sm font-bold text-slate-700 font-mono">
                    {formatCurrency(insights.worstRegion.sales)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Represents <span className="font-bold">{insights.worstRegion.share.toFixed(1)}%</span> of total sales. Performance gap of {formatCurrency(insights.bestRegion.sales - insights.worstRegion.sales)} exists.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 bg-gray-50/30 p-3 rounded-xl flex items-start space-x-2">
            <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-600">
              <span className="font-bold">Advisory:</span> Cross-pollinate the visual merchandising and inventory allocation strategies from <span className="font-semibold text-indigo-900">{insights.bestRegion.name}</span> to boost momentum in <span className="font-semibold text-indigo-900">{insights.worstRegion.name}</span>.
            </p>
          </div>
        </div>

        {/* INSIGHT 2: Stores missing targets (<100%) */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded uppercase tracking-wider">
                Target Deficits
              </span>
              <Store className="w-5 h-5 text-rose-500" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">Stores Missing Targets</h3>
              <p className="text-xs text-gray-400 mt-1">Outlets performing below 100% of planned Target Achievement.</p>
            </div>

            {/* List of at risk stores */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {insights.missedStores.length === 0 ? (
                <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">100% Target compliance met! All stores matched goals.</span>
                </div>
              ) : (
                insights.missedStores.slice(0, 4).map((store, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-2.5 flex items-center justify-between hover:bg-slate-50/40">
                    <div>
                      <p className="text-xs font-bold text-gray-900 truncate max-w-[160px]">{store.StoreName}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{store.Region} Region</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-rose-600 font-mono">{store.achievement.toFixed(1)}% Ach.</p>
                      <p className="text-[10px] text-gray-500 font-mono">-{formatCurrency(store.deficit)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            {insights.missedStores.length > 4 && (
              <p className="text-[10px] text-center text-slate-400 font-semibold mb-2">
                And {insights.missedStores.length - 4} other store deficits exist. See integration table for full details.
              </p>
            )}
            <div className="pt-4 border-t border-gray-50 bg-gray-50/30 p-3 rounded-xl flex items-start space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-600">
                <span className="font-bold">Advisory:</span> Top priority is stores below 90% achievement. Establish daily sales huddles, local marketing support, and re-evaluate pricing incentives.
              </p>
            </div>
          </div>
        </div>

        {/* INSIGHT 3: High return rates categories */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase tracking-wider">
                Returns Analysis
              </span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">Abnormal Return Rates</h3>
              <p className="text-xs text-gray-400 mt-1">Product lines where return rate exceeds the index average of <span className="font-bold font-mono">{insights.averageReturnRate.toFixed(1)}%</span>.</p>
            </div>

            {/* Return details list */}
            <div className="space-y-2">
              {insights.highReturnCategories.length === 0 ? (
                <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">Return rates are low and fully balanced.</span>
                </div>
              ) : (
                insights.highReturnCategories.map((cat, idx) => (
                  <div key={idx} className="bg-amber-50/40 border border-amber-100 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{cat.name}</p>
                      <p className="text-[10px] text-amber-700 font-medium">Above average by +{(cat.rate - insights.averageReturnRate).toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-amber-800 font-mono">{cat.rate.toFixed(1)}%</p>
                      <p className="text-[10px] text-gray-500 font-mono">Val: {formatCurrency(cat.Returns)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 bg-gray-50/30 p-3 rounded-xl flex items-start space-x-2">
            <Lightbulb className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-600">
              <span className="font-bold">Advisory:</span> High return rates impact profitability heavily. Review product descriptions, check shipping damage reports, and run vendor quality assessments.
            </p>
          </div>
        </div>

      </div>

      {/* Dynamic Summary Advisory Block */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Diagnostic Memo</h3>
        <p className="text-xs leading-relaxed text-gray-600">
          The cumulative sales performance within the filtered segment has achieved an overall target capture score. 
          Regionally, <span className="font-bold text-indigo-900">{insights.bestRegion.name}</span> is the dominant revenue engine, while <span className="font-bold text-indigo-900">{insights.worstRegion.name}</span> indicates soft consumer demand. 
          {insights.missedStores.length > 0 ? (
            <span> 
              Additionally, attention is required for the <span className="font-bold text-rose-600">{insights.missedStores.length} outlets</span> under-delivering relative to their operating models. 
            </span>
          ) : (
            <span> Target targets are fully satisfied across all operational stores in this filter. </span>
          )}
          Regarding product returns, 
          {insights.highReturnCategories.length > 0 ? (
            <span>
              {" "}
              the <span className="font-semibold text-amber-700">{insights.highReturnCategories.map(c => c.name).join(", ")}</span> category return volume is abnormally elevated and warrants product specifications audit.
            </span>
          ) : (
            " return rates are outstanding and stay strictly below safety benchmarks."
          )}
        </p>
      </div>
    </div>
  );
}
