import React, { useState, useRef, useEffect } from "react";
import { Filter, X, Check, ChevronDown } from "lucide-react";
import { DashboardFilters } from "../types";

interface FiltersProps {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  allWeeks: string[];
  allRegions: string[];
  allStores: string[];
  allCities: string[];
  allStoreFormats: string[];
  allProductCategories: string[];
  onClearFilters: () => void;
}

export default function Filters({
  filters,
  setFilters,
  allWeeks,
  allRegions,
  allStores,
  allCities,
  allStoreFormats,
  allProductCategories,
  onClearFilters
}: FiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");

  // Close dropdown on click outside
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setFilterSearch("");
    if (openDropdown === name) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(name);
    }
  };

  const handleToggleOption = (key: keyof DashboardFilters, option: string) => {
    setFilters(prev => {
      const current = prev[key];
      const next = current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option];
      return { ...prev, [key]: next };
    });
  };

  const isFilterActive = (key: keyof DashboardFilters) => {
    return filters[key].length > 0;
  };

  const renderDropdown = (
    label: string,
    filterKey: keyof DashboardFilters,
    options: string[]
  ) => {
    const activeOptions = filters[filterKey];
    const isActive = activeOptions.length > 0;
    const isOpen = openDropdown === filterKey;
    const alignRight = ["cities", "storeFormats", "productCategories"].includes(filterKey);

    // Filter options based on local search term
    const filteredOptions = options.filter(opt =>
      opt.toLowerCase().includes(filterSearch.toLowerCase())
    );

    return (
      <div className="relative shrink-0" key={filterKey}>
        <button
          onClick={() => toggleDropdown(filterKey)}
          className={`flex items-center space-x-2 px-4 py-2.5 border rounded-xl text-xs font-semibold transition-all ${
            isActive
              ? "border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <span>{label}</span>
          {isActive && (
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {activeOptions.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className={`absolute ${alignRight ? "right-0" : "left-0"} mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-1.5 max-h-80 flex flex-col`}>
            <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Select {label}
              </span>
              {isActive && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, [filterKey]: [] }))}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Clear
                </button>
              )}
            </div>

            {options.length > 5 && (
              <div className="px-2.5 py-2 border-b border-gray-50 bg-slate-50/50 shrink-0">
                <input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            <div className="p-1 space-y-0.5 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400">No results found</div>
              ) : (
                filteredOptions.map(option => {
                  const isChecked = activeOptions.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => handleToggleOption(filterKey, option)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                        isChecked
                          ? "bg-indigo-50 text-indigo-900 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center shrink-0 transition-all ${
                          isChecked
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{option}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const hasAnyFilter = Object.values(filters).some(arr => arr.length > 0);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4" ref={dropdownRef}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Filter Dropdowns with Wrap Layout */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 text-gray-500 mr-2 shrink-0">
            <Filter className="w-4 h-4 shrink-0 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500">Filter By:</span>
          </div>

          {renderDropdown("Week", "weeks", allWeeks)}
          {renderDropdown("Region", "regions", allRegions)}
          {renderDropdown("Store", "stores", allStores)}
          {renderDropdown("City", "cities", allCities)}
          {renderDropdown("Format", "storeFormats", allStoreFormats)}
          {renderDropdown("Category", "productCategories", allProductCategories)}
        </div>

        {/* Right Side: Quick Action (Clear All) */}
        {hasAnyFilter && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg transition-all self-end md:self-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasAnyFilter && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider self-center mr-1">
            Active:
          </span>
          {Object.entries(filters).map(([key, list]) => {
            if (list.length === 0) return null;
            const filterKey = key as keyof DashboardFilters;
            return list.map(val => (
              <span
                key={`${key}-${val}`}
                className="inline-flex items-center space-x-1 bg-gray-100 text-gray-800 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
              >
                <span className="text-gray-400 font-semibold uppercase text-[9px] mr-0.5">
                  {key.replace("stores", "store").replace("Weeks", "week").replace("Regions", "region").replace("Cities", "city").replace("storeFormats", "format").replace("productCategories", "category")}:
                </span>
                <span>{val}</span>
                <button
                  onClick={() => handleToggleOption(filterKey, val)}
                  className="hover:text-red-500 transition-all text-gray-400 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ));
          })}
        </div>
      )}
    </div>
  );
}
