import React, { useState, useRef, useMemo } from "react";
import { 
  FileSpreadsheet, 
  Database, 
  Download, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Table, 
  ArrowRight,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { StoreMaster, WeeklySales } from "../types";
import { parseFile, exportToCsv, normalizeSalesRow, normalizeStoreMaster } from "../utils/csvHelper";
import { DEFAULT_STORE_MASTER, DEFAULT_WEEKLY_SALES } from "../mockData";

interface DataIntegrationProps {
  salesData: WeeklySales[];
  storeMaster: StoreMaster[];
  isSalesMocked: boolean;
  isStoreMocked: boolean;
  onSalesUploaded: (data: WeeklySales[]) => void;
  onStoreUploaded: (data: StoreMaster[]) => void;
  onReset: () => void;
  exportFilteredData: () => void;
  filteredCount: number;
}

export default function DataIntegration({
  salesData,
  storeMaster,
  isSalesMocked,
  isStoreMocked,
  onSalesUploaded,
  onStoreUploaded,
  onReset,
  exportFilteredData,
  filteredCount
}: DataIntegrationProps) {
  const [activePreviewTab, setActivePreviewTab] = useState<"sales" | "stores">("sales");
  const [salesSearch, setSalesSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [salesError, setSalesError] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  const salesInputRef = useRef<HTMLInputElement>(null);
  const storeInputRef = useRef<HTMLInputElement>(null);

  // Parse handlers
  const handleSalesFile = async (file: File) => {
    setSalesError(null);
    try {
      const data = await parseFile(file);
      if (data.length === 0) throw new Error("File is empty.");
      
      const formatted: WeeklySales[] = data.map((row: any) => normalizeSalesRow(row));
      
      // Verify that we successfully mapped key fields
      const hasWeek = formatted.some(r => r.week_start_date);
      const hasStore = formatted.some(r => r.store_id);
      if (!hasWeek || !hasStore) {
        throw new Error("Could not map 'week_start_date' (or 'Week') and 'store_id' (or 'StoreID') columns. Please check your sheet headers.");
      }

      onSalesUploaded(formatted);
    } catch (err: any) {
      setSalesError(err.message || "Invalid file structure.");
    }
  };

  const handleStoreFile = async (file: File) => {
    setStoreError(null);
    try {
      const data = await parseFile(file);
      if (data.length === 0) throw new Error("File is empty.");

      const formatted: StoreMaster[] = data.map((row: any) => normalizeStoreMaster(row));

      // Verify key field mapping
      const hasStore = formatted.some(r => r.store_id);
      if (!hasStore) {
        throw new Error("Could not map 'store_id' (or 'StoreID') column. Please check your store master headers.");
      }

      onStoreUploaded(formatted);
    } catch (err: any) {
      setStoreError(err.message || "Invalid file structure.");
    }
  };

  // Templates download
  const downloadSalesTemplate = () => {
    exportToCsv(DEFAULT_WEEKLY_SALES.slice(0, 50), "retail_weekly_sales_template.csv");
  };

  const downloadStoreTemplate = () => {
    exportToCsv(DEFAULT_STORE_MASTER, "store_master_template.csv");
  };

  // Previews filtering
  const filteredSalesPreview = useMemo(() => {
    let result = salesData;
    if (salesSearch) {
      const search = salesSearch.toLowerCase();
      result = result.filter(
        row => 
          row.week_start_date.toLowerCase().includes(search) ||
          row.store_id.toLowerCase().includes(search) ||
          row.product_category.toLowerCase().includes(search)
      );
    }
    return result.slice(0, 15); // Show first 15 records
  }, [salesData, salesSearch]);

  const filteredStorePreview = useMemo(() => {
    let result = storeMaster;
    if (storeSearch) {
      const search = storeSearch.toLowerCase();
      result = result.filter(
        row => 
          row.store_id.toLowerCase().includes(search) ||
          row.store_name.toLowerCase().includes(search) ||
          row.region.toLowerCase().includes(search) ||
          row.city.toLowerCase().includes(search) ||
          row.store_format.toLowerCase().includes(search)
      );
    }
    return result.slice(0, 15);
  }, [storeMaster, storeSearch]);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Title */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Data Integration Center</h1>
        <p className="text-xs text-gray-500 mt-1">
          Upload custom dataset spreadsheets or download template sheets. The system automatically merges your 
          weekly sales figures and store configurations together by `StoreID` to populate the dashboards.
        </p>
      </div>

      {/* Grid of File Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. retail_weekly_sales */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <FileSpreadsheet className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">retail_weekly_sales.xlsx</h3>
                <p className="text-[11px] text-gray-400">Main dataset tracking weekly metrics</p>
              </div>
            </div>
            {isSalesMocked ? (
              <span className="inline-flex items-center text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Mock Loaded
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Dynamic Data
              </span>
            )}
          </div>

          <div className="text-xs space-y-1 bg-slate-50 rounded-xl p-3 text-gray-600 border border-slate-100/50">
            <p className="font-semibold text-slate-800">Flexible Header Matching (Case-Insensitive):</p>
            <p className="font-mono text-[10px] text-slate-500">
              week_start_date (or Week), region, store_id (or StoreID), store_name, city, store_format, product_category, footfall, transactions, units_sold, gross_sales, discount_amount, net_sales (or ActualSales), sales_target (or TargetSales), inventory_on_hand, stockouts, returns_amount, customer_rating, marketing_spend
            </p>
          </div>

          {/* Upload Zone */}
          <div 
            onClick={() => salesInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/10 rounded-2xl p-6 text-center cursor-pointer transition-all"
          >
            <input 
              type="file" 
              ref={salesInputRef}
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && handleSalesFile(e.target.files[0])}
            />
            <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <span className="text-xs font-bold text-gray-800">Drag & Drop or Choose File</span>
            <p className="text-[10px] text-gray-400 mt-0.5">Supports Microsoft Excel (.xlsx) and standard CSV</p>
          </div>

          {salesError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{salesError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-400">Total Loaded records: <span className="font-bold text-gray-800 font-mono">{salesData.length}</span></span>
            <button 
              onClick={downloadSalesTemplate}
              className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Weekly Sales Template</span>
            </button>
          </div>
        </div>

        {/* 2. store_master */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Database className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">store_master.xlsx</h3>
                <p className="text-[11px] text-gray-400">Store properties and regional metadata</p>
              </div>
            </div>
            {isStoreMocked ? (
              <span className="inline-flex items-center text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Mock Loaded
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Dynamic Data
              </span>
            )}
          </div>

          <div className="text-xs space-y-1 bg-slate-50 rounded-xl p-3 text-gray-600 border border-slate-100/50">
            <p className="font-semibold text-slate-800">Flexible Header Matching (Case-Insensitive):</p>
            <p className="font-mono text-[10px] text-slate-500">
              store_id (or StoreID), store_name, region, city, store_format
            </p>
          </div>

          {/* Upload Zone */}
          <div 
            onClick={() => storeInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/10 rounded-2xl p-6 text-center cursor-pointer transition-all"
          >
            <input 
              type="file" 
              ref={storeInputRef}
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && handleStoreFile(e.target.files[0])}
            />
            <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <span className="text-xs font-bold text-gray-800">Drag & Drop or Choose File</span>
            <p className="text-[10px] text-gray-400 mt-0.5">Supports Microsoft Excel (.xlsx) and standard CSV</p>
          </div>

          {storeError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{storeError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-400">Total Stores loaded: <span className="font-bold text-gray-800 font-mono">{storeMaster.length}</span></span>
            <button 
              onClick={downloadStoreTemplate}
              className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Store Master Template</span>
            </button>
          </div>
        </div>

      </div>

      {/* Global Controls & Merged Status */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-900 uppercase">Live Integration Pipeline</span>
          </div>
          <p className="text-xs text-indigo-950 font-medium">
            Currently integrating <span className="font-bold">{salesData.length} weekly metrics</span> with <span className="font-bold">{storeMaster.length} stores</span>.
          </p>
          <p className="text-[11px] text-indigo-800/80">
            Active filters yield <span className="font-semibold text-indigo-950">{filteredCount} merged row configurations</span>.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 rounded-xl transition-all"
          >
            Reset to Default Dataset
          </button>
          <button
            onClick={exportFilteredData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/15 flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Merged Filtered Dataset</span>
          </button>
        </div>
      </div>

      {/* Raw Data Preview Tables */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Selector Header */}
        <div className="border-b border-gray-100 bg-slate-50/50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-1 border border-gray-200 bg-white rounded-xl p-1 shrink-0">
            <button
              onClick={() => setActivePreviewTab("sales")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePreviewTab === "sales" 
                  ? "bg-slate-900 text-white" 
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Weekly Sales Data ({salesData.length})</span>
            </button>
            <button
              onClick={() => setActivePreviewTab("stores")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePreviewTab === "stores" 
                  ? "bg-slate-900 text-white" 
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Store Master Reference ({storeMaster.length})</span>
            </button>
          </div>

          {/* Search Inputs */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            {activePreviewTab === "sales" ? (
              <input
                type="text"
                placeholder="Search by Week, ID, Category..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl py-1.5 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <input
                type="text"
                placeholder="Search by Name, City, Region..."
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl py-1.5 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>
        </div>

        {/* Previews Table Display */}
        <div className="overflow-x-auto">
          {activePreviewTab === "sales" ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-100">
                  <th className="py-3 px-5">Week</th>
                  <th className="py-3 px-5">Store ID</th>
                  <th className="py-3 px-5">Product Category</th>
                  <th className="py-3 px-5 text-right">Actual Sales</th>
                  <th className="py-3 px-5 text-right">Target Sales</th>
                  <th className="py-3 px-5 text-center">Transactions</th>
                  <th className="py-3 px-5 text-right">Return Amt</th>
                  <th className="py-3 px-5 text-center">Discounts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {filteredSalesPreview.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredSalesPreview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 font-mono text-[11px]">
                      <td className="py-2.5 px-5 font-bold font-sans text-xs text-gray-900">{row.week_start_date}</td>
                      <td className="py-2.5 px-5 font-bold text-indigo-600">{row.store_id}</td>
                      <td className="py-2.5 px-5 font-sans text-xs text-gray-800">{row.product_category}</td>
                      <td className="py-2.5 px-5 text-right font-semibold text-slate-900">${row.net_sales.toLocaleString()}</td>
                      <td className="py-2.5 px-5 text-right text-gray-500">${row.sales_target.toLocaleString()}</td>
                      <td className="py-2.5 px-5 text-center font-sans">{row.transactions}</td>
                      <td className="py-2.5 px-5 text-right text-red-500">${row.returns_amount.toLocaleString()}</td>
                      <td className="py-2.5 px-5 text-center text-purple-600">${row.discount_amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-100">
                  <th className="py-3 px-5">store_id</th>
                  <th className="py-3 px-5">Store Name</th>
                  <th className="py-3 px-5">Region</th>
                  <th className="py-3 px-5">City</th>
                  <th className="py-3 px-5">Store Format</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/5 text-gray-700">
                {filteredStorePreview.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      No matching stores found.
                    </td>
                  </tr>
                ) : (
                  filteredStorePreview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="py-2.5 px-5 font-mono text-xs font-bold text-indigo-600">{row.store_id}</td>
                      <td className="py-2.5 px-5 font-semibold text-gray-900">{row.store_name}</td>
                      <td className="py-2.5 px-5 font-medium">{row.region}</td>
                      <td className="py-2.5 px-5 text-gray-600">{row.city}</td>
                      <td className="py-2.5 px-5">
                        <span className="inline-flex bg-slate-100 text-slate-800 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                          {row.store_format}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Table footer paging note */}
        <div className="bg-slate-50 px-5 py-3 border-t border-gray-100 text-gray-400 text-[11px] font-medium flex justify-between items-center">
          <span>Showing top 15 results for performance. Download templates or export files for complete files.</span>
          <div className="flex items-center space-x-1 text-indigo-600 font-semibold">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

    </div>
  );
}
