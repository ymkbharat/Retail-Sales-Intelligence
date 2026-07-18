import * as XLSX from "xlsx";
import { StoreMaster, WeeklySales } from "../types";

/**
 * Parses an uploaded Excel (.xlsx) or CSV (.csv) file into an array of objects
 */
export function parseFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("Failed to read file.");
        }
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Safely exports an array of objects to a downloadable CSV file using a Blob
 */
export function exportToCsv(data: any[], filename: string) {
  if (data.length === 0) {
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          const value = row[fieldName];
          if (typeof value === "string") {
            const escaped = value.replace(/"/g, '""');
            return `"${escaped}"`;
          }
          return value === undefined || value === null ? "" : String(value);
        })
        .join(",")
    )
  ];

  const blob = new Blob([csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Maps a generic object to WeeklySales with case-insensitive, fuzzy key matching
 */
export function normalizeSalesRow(row: any): WeeklySales {
  const getVal = (keys: string[], defaultVal: any = "") => {
    for (const k of keys) {
      const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const rowKey of Object.keys(row)) {
        const lowerRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (lowerRowKey === lowerK) {
          return row[rowKey];
        }
      }
    }
    return defaultVal;
  };

  const rawDate = getVal(["week_start_date", "week", "weekstartdate"]);
  const formattedDate = normalizeDateToDDMMYYYY(rawDate);

  return {
    week_start_date: formattedDate,
    region: String(getVal(["region"]) || ""),
    store_id: String(getVal(["store_id", "storeid"]) || ""),
    store_name: String(getVal(["store_name", "storename"]) || ""),
    city: String(getVal(["city"]) || ""),
    store_format: String(getVal(["store_format", "storeformat"]) || ""),
    product_category: String(getVal(["product_category", "productcategory"]) || ""),
    footfall: Number(getVal(["footfall"]) || 0),
    transactions: Number(getVal(["transactions"]) || 0),
    units_sold: Number(getVal(["units_sold", "unitssold"]) || 0),
    gross_sales: Number(getVal(["gross_sales", "grosssales"]) || 0),
    discount_amount: Number(getVal(["discount_amount", "discountamount", "totaldiscounts", "discounts"]) || 0),
    net_sales: Number(getVal(["net_sales", "netsales", "actualsales", "actual_sales"]) || 0),
    sales_target: Number(getVal(["sales_target", "salestarget", "targetsales", "target_sales"]) || 0),
    inventory_on_hand: Number(getVal(["inventory_on_hand", "inventoryonhand", "inventorycount", "inventory_count"]) || 50),
    stockouts: Number(getVal(["stockouts", "reorderpoint", "reorder_point"]) || 0),
    returns_amount: Number(getVal(["returns_amount", "returnsamount", "returnamount", "return_amount"]) || 0),
    customer_rating: Number(getVal(["customer_rating", "customerrating"]) || 0),
    marketing_spend: Number(getVal(["marketing_spend", "marketingspend"]) || 0),
  };
}

/**
 * Maps a generic object to StoreMaster with case-insensitive, fuzzy key matching
 */
export function normalizeStoreMaster(row: any): StoreMaster {
  const getVal = (keys: string[], defaultVal: any = "") => {
    for (const k of keys) {
      const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const rowKey of Object.keys(row)) {
        const lowerRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (lowerRowKey === lowerK) {
          return row[rowKey];
        }
      }
    }
    return defaultVal;
  };

  return {
    store_id: String(getVal(["store_id", "storeid"]) || ""),
    store_name: String(getVal(["store_name", "storename"]) || ""),
    region: String(getVal(["region"]) || ""),
    city: String(getVal(["city"]) || ""),
    store_format: String(getVal(["store_format", "storeformat"]) || ""),
  };
}

/**
 * Convert Excel date serial number or any value to Date object
 */
export function anyToDate(val: any): Date | null {
  if (val === undefined || val === null) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  
  if (typeof val === "number") {
    // Check if it's an Excel serial date (typically > 30000 and < 60000 for recent dates)
    if (val > 30000 && val < 60000) {
      const d = new Date((val - 25569) * 86400 * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  const str = String(val).trim();
  if (!str) return null;
  const lower = str.toLowerCase();
  if (
    lower.includes("invalid") || 
    lower === "null" || 
    lower === "undefined" || 
    lower === "na" || 
    lower === "n/a" || 
    lower === "-"
  ) {
    return null;
  }

  // Check if string matches "W01" or "W1", "W12", etc.
  const matchWeek = str.match(/^w(\d+)$/i);
  if (matchWeek) {
    const weekNum = parseInt(matchWeek[1], 10);
    // Base date: April 1st, 2026
    const baseDate = new Date(2026, 3, 1);
    return new Date(baseDate.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
  }

  // Check if string matches "Week 1", "Week 12"
  const matchWeek2 = str.match(/^week\s*(\d+)$/i);
  if (matchWeek2) {
    const weekNum = parseInt(matchWeek2[1], 10);
    const baseDate = new Date(2026, 3, 1);
    return new Date(baseDate.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
  }

  // Check if string is already DD-MM-YYYY or DD/MM/YYYY
  const ddmmMatches = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmMatches) {
    const day = parseInt(ddmmMatches[1], 10);
    const month = parseInt(ddmmMatches[2], 10) - 1;
    const year = parseInt(ddmmMatches[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback to standard Date parsing
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Normalizes any date value to "DD-MM-YYYY" or returns "Invalid Date"
 */
export function normalizeDateToDDMMYYYY(val: any): string {
  const d = anyToDate(val);
  if (!d) return "Invalid Date";
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Parses "DD-MM-YYYY" string back to Date object
 */
export function parseDDMMYYYY(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return new Date(dateStr);
}

/**
 * Compares two "DD-MM-YYYY" date strings chronologically
 */
export function compareDDMMYYYY(a: string, b: string): number {
  const timeA = parseDDMMYYYY(a).getTime();
  const timeB = parseDDMMYYYY(b).getTime();
  if (isNaN(timeA) || timeA === 0) return 1;
  if (isNaN(timeB) || timeB === 0) return -1;
  return timeA - timeB;
}
