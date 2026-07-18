import React, { useRef, useState } from "react";
import { 
  LayoutDashboard, 
  Database, 
  Sparkles, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { StoreMaster, WeeklySales } from "../types";
import { parseFile, exportToCsv, normalizeSalesRow, normalizeStoreMaster } from "../utils/csvHelper";
import { DEFAULT_STORE_MASTER, DEFAULT_WEEKLY_SALES } from "../mockData";

interface SidebarProps {
  activeTab: "dashboard" | "sources" | "insights";
  setActiveTab: (tab: "dashboard" | "sources" | "insights") => void;
  isSalesMocked: boolean;
  isStoreMocked: boolean;
  salesCount: number;
  storeCount: number;
  onSalesUploaded: (data: WeeklySales[]) => void;
  onStoreUploaded: (data: StoreMaster[]) => void;
  onResetToMock: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isSalesMocked,
  isStoreMocked,
  salesCount,
  storeCount,
  onSalesUploaded,
  onStoreUploaded,
  onResetToMock
}: SidebarProps) {
  const salesInputRef = useRef<HTMLInputElement>(null);
  const storeInputRef = useRef<HTMLInputElement>(null);

  const [salesDragOver, setSalesDragOver] = useState(false);
  const [storeDragOver, setStoreDragOver] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  // File Upload Handlers
  const handleSalesFile = async (file: File) => {
    setSalesError(null);
    try {
      const data = await parseFile(file);
      if (data.length === 0) throw new Error("File is empty.");
      
      const formatted: WeeklySales[] = data.map((row: any) => normalizeSalesRow(row));
      
      // Verify key field mappings
      const hasWeek = formatted.some(r => r.week_start_date);
      const hasStore = formatted.some(r => r.store_id);
      if (!hasWeek || !hasStore) {
        throw new Error("Could not map 'week_start_date' (or 'Week') and 'store_id' (or 'StoreID') columns. Please check your sheet headers.");
      }

      onSalesUploaded(formatted);
    } catch (err: any) {
      setSalesError(err.message || "Invalid file format");
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
      setStoreError(err.message || "Invalid file format");
    }
  };

  // Download templates
  const downloadSalesTemplate = () => {
    const sampleData = DEFAULT_WEEKLY_SALES.slice(0, 10);
    exportToCsv(sampleData, "retail_weekly_sales_template.csv");
  };

  const downloadStoreTemplate = () => {
    exportToCsv(DEFAULT_STORE_MASTER, "store_master_template.csv");
  };

  return (
    <aside className="w-80 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shrink-0 h-screen overflow-y-auto">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
          <FileSpreadsheet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Sales Intelligence
          </h1>
          <p className="text-xs font-mono text-indigo-400">v1.2.0 • Enterprise</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-4 space-y-1.5 flex-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "dashboard"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span>Executive Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("sources")}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "sources"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          }`}
        >
          <Database className="w-5 h-5 shrink-0" />
          <span>Data Integration</span>
          <span className="ml-auto bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-mono">
            2 Source
          </span>
        </button>

        <button
          onClick={() => setActiveTab("insights")}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "insights"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
          <span>Business Insights</span>
        </button>

        {/* File Integration widgets inside sidebar */}
        <div className="pt-6 border-t border-slate-800 mt-6 space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">
            Source File Manager
          </div>

          {/* Dataset 1: Weekly Sales */}
          <div className="px-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">retail_weekly_sales</span>
              <div className="flex items-center space-x-1">
                {isSalesMocked ? (
                  <span className="inline-flex items-center text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    <AlertCircle className="w-3 h-3 mr-0.5" /> Mock
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" /> Uploaded
                  </span>
                )}
              </div>
            </div>

            {/* Drag Drop Box */}
            <div
              onDragOver={(e) => { e.preventDefault(); setSalesDragOver(true); }}
              onDragLeave={() => setSalesDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setSalesDragOver(false);
                if (e.dataTransfer.files?.[0]) handleSalesFile(e.dataTransfer.files[0]);
              }}
              onClick={() => salesInputRef.current?.click()}
              className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                salesDragOver 
                  ? "border-indigo-500 bg-indigo-500/5 text-slate-100" 
                  : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:bg-slate-950/70"
              }`}
            >
              <input 
                type="file" 
                ref={salesInputRef} 
                onChange={(e) => e.target.files?.[0] && handleSalesFile(e.target.files[0])}
                accept=".xlsx,.xls,.csv" 
                className="hidden" 
              />
              <UploadCloud className="w-5 h-5 mx-auto text-slate-500 mb-1" />
              <p className="text-[11px] font-medium">Click or Drag Excel/CSV</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{salesCount} rows loaded</p>
            </div>
            {salesError && (
              <p className="text-[10px] text-red-400 bg-red-400/10 p-1.5 rounded border border-red-400/20">
                {salesError}
              </p>
            )}
            <button 
              onClick={downloadSalesTemplate}
              className="flex items-center space-x-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get weekly_sales template</span>
            </button>
          </div>

          {/* Dataset 2: Store Master */}
          <div className="px-3 space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">store_master</span>
              <div className="flex items-center space-x-1">
                {isStoreMocked ? (
                  <span className="inline-flex items-center text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    <AlertCircle className="w-3 h-3 mr-0.5" /> Mock
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" /> Uploaded
                  </span>
                )}
              </div>
            </div>

            {/* Drag Drop Box */}
            <div
              onDragOver={(e) => { e.preventDefault(); setStoreDragOver(true); }}
              onDragLeave={() => setStoreDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setStoreDragOver(false);
                if (e.dataTransfer.files?.[0]) handleStoreFile(e.dataTransfer.files[0]);
              }}
              onClick={() => storeInputRef.current?.click()}
              className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                storeDragOver 
                  ? "border-indigo-500 bg-indigo-500/5 text-slate-100" 
                  : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:bg-slate-950/70"
              }`}
            >
              <input 
                type="file" 
                ref={storeInputRef} 
                onChange={(e) => e.target.files?.[0] && handleStoreFile(e.target.files[0])}
                accept=".xlsx,.xls,.csv" 
                className="hidden" 
              />
              <UploadCloud className="w-5 h-5 mx-auto text-slate-500 mb-1" />
              <p className="text-[11px] font-medium">Click or Drag Excel/CSV</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{storeCount} stores loaded</p>
            </div>
            {storeError && (
              <p className="text-[10px] text-red-400 bg-red-400/10 p-1.5 rounded border border-red-400/20">
                {storeError}
              </p>
            )}
            <button 
              onClick={downloadStoreTemplate}
              className="flex items-center space-x-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get store_master template</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer controls */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={onResetToMock}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restore Default Mock Data</span>
        </button>
      </div>
    </aside>
  );
}
