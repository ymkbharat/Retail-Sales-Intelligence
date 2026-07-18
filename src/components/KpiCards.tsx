import React from "react";
import { 
  DollarSign, 
  Target, 
  ShoppingBag, 
  RotateCcw, 
  Tag, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle 
} from "lucide-react";
import { MergedSalesRow, KpiMetrics } from "../types";

interface KpiCardsProps {
  data: MergedSalesRow[];
}

export default function KpiCards({ data }: KpiCardsProps) {
  // Compute metrics
  const metrics = React.useMemo<KpiMetrics>(() => {
    if (data.length === 0) {
      return {
        netSales: 0,
        targetSales: 0,
        targetAchievement: 0,
        atv: 0,
        returnRate: 0,
        discountRate: 0,
      };
    }

    let totalActualSales = 0;
    let totalTargetSales = 0;
    let totalTransactions = 0;
    let totalReturnAmount = 0;
    let totalDiscounts = 0;
    let totalGrossSales = 0;

    for (const row of data) {
      totalActualSales += row.net_sales;
      totalTargetSales += row.sales_target;
      totalTransactions += row.transactions;
      totalReturnAmount += row.returns_amount;
      totalDiscounts += row.discount_amount;
      totalGrossSales += row.gross_sales;
    }

    const netSales = totalActualSales;
    const targetSales = totalTargetSales;
    const targetAchievement = targetSales > 0 ? (netSales / targetSales) * 100 : 0;
    const atv = totalTransactions > 0 ? netSales / totalTransactions : 0;
    const returnRate = netSales > 0 ? (totalReturnAmount / netSales) * 100 : 0;
    const discountRate = totalGrossSales > 0 ? (totalDiscounts / totalGrossSales) * 100 : 0;

    return {
      netSales,
      targetSales,
      targetAchievement,
      atv,
      returnRate,
      discountRate
    };
  }, [data]);

  // Formatting utilities
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatPercentage = (val: number) => {
    return `${val.toFixed(1)}%`;
  };

  const formatCurrencyValue = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
      {/* 1. Net Sales */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Sales</span>
          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(metrics.netSales)}
          </span>
          <div className="flex items-center mt-1.5 space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-500">Actual Revenue</span>
          </div>
        </div>
      </div>

      {/* 2. Target Achievement */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Achievement</span>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${metrics.targetAchievement >= 100 ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"}`}>
            <Target className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatPercentage(metrics.targetAchievement)}
          </span>
          <div className="flex items-center mt-1.5">
            {metrics.targetAchievement >= 100 ? (
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Target Met
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                Missed by {(100 - metrics.targetAchievement).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Average Transaction Value (ATV) */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Transaction Value</span>
          <div className="w-9 h-9 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatCurrencyValue(metrics.atv)}
          </span>
          <div className="flex items-center mt-1.5 space-x-1">
            <span className="text-[11px] text-gray-500">Average ticket size</span>
          </div>
        </div>
      </div>

      {/* 4. Return Rate */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Return Rate</span>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${metrics.returnRate > 7 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatPercentage(metrics.returnRate)}
          </span>
          <div className="flex items-center mt-1.5">
            {metrics.returnRate > 7 ? (
              <span className="inline-flex items-center text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3 mr-0.5 shrink-0" /> High Returns
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Healthy Returns
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Discount Rate */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount Rate</span>
          <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
            <Tag className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatPercentage(metrics.discountRate)}
          </span>
          <div className="flex items-center mt-1.5 space-x-1">
            <span className="text-[11px] text-gray-500">Of gross sales value</span>
          </div>
        </div>
      </div>
    </div>
  );
}
