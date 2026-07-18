# Retail Sales Analytics Dashboard - KPI & Insights Guide

This document outlines the formulas, data refinement rules, and business logic used to compute Key Performance Indicators (KPIs) and trigger dynamic insights in the Retail Sales Analytics Dashboard.

---

## 1. Key Performance Indicators (KPIs) & Formulas

The dashboard calculates five core retail metrics in real-time based on the active user-filtered dataset.

### A. Net Sales
*   **Business Definition**: The total actual revenue captured after accounting for discounts and returns.
*   **Formula**:
    $$\text{Net Sales} = \sum (\text{net\_sales})$$
*   **CSV Mapping**: Derived directly from the `net_sales` field. In our data cleaning pipeline, this represents the net realized sales.

### B. Target Achievement Rate
*   **Business Definition**: The percentage of planned revenue targets that were successfully met.
*   **Formula**:
    $$\text{Target Achievement (\%)} = \left( \frac{\sum \text{net\_sales}}{\sum \text{sales\_target}} \right) \times 100$$
*   **CSV Mapping**: 
    *   $\text{net\_sales}$ (actual realized revenue)
    *   $\text{sales\_target}$ (planned target budget; handles cases where target is 0 to avoid division by zero errors).

### C. Average Transaction Value (ATV)
*   **Business Definition**: The average dollar amount spent by a customer per transaction. Also known as Average Basket Value.
*   **Formula**:
    $$\text{ATV} = \frac{\sum \text{net\_sales}}{\sum \text{transactions}}$$
*   **CSV Mapping**: Calculated by dividing the sum of `net_sales` by the sum of `transactions`.

### D. Return Rate
*   **Business Definition**: The percentage of generated revenue that was lost due to product returns.
*   **Formula**:
    $$\text{Return Rate (\%)} = \left( \frac{\sum \text{returns\_amount}}{\sum \text{net\_sales}} \right) \times 100$$
*   **CSV Mapping**: Compares the sum of `returns_amount` against the sum of `net_sales`.

### E. Discount Rate
*   **Business Definition**: The proportion of gross sales represented by promotional markdowns/discounts.
*   **Formula**:
    $$\text{Discount Rate (\%)} = \left( \frac{\sum \text{discount\_amount}}{\sum \text{gross\_sales}} \right) \times 100$$
*   **CSV Mapping**: Calculated by dividing the sum of `discount_amount` by `gross_sales`.

---

## 2. Data Refinement & Normalization Rules

To ensure calculations are robust and free from crashing or skewed trends, the application passes all imported file rows through a strict refinement pipeline.

### A. Cleaning "Invalid Date" Entries
*   Any row where the `week_start_date` is missing, null, empty, or literally represents `"Invalid Date"` is **completely skipped** prior to metric aggregation. This ensures that calculations of sums, averages, and trend charts are not contaminated with incomplete dates.

### B. Date Standardization (`DD-MM-YYYY`)
All incoming dates are normalized using a dedicated date decoder:
*   **Excel Serial Dates**: Converts numeric Excel timestamps (e.g. `46112` corresponding to dates in 2026) back to real JavaScript dates.
*   **Relative Week Notation**: Matches strings such as `"W01"`, `"W1"`, or `"Week 1"` and translates them sequentially starting from April 1st, 2026.
*   **Standard Separators**: Matches common string templates (`DD-MM-YYYY` or `DD/MM/YYYY`) and normalizes separator characters to hyphens (`-`).
*   **Validation**: Any date failing this decoding maps to `"Invalid Date"`, which is then safely filtered out during dataset merging.

### C. Chronological Chart Sorting
*   To prevent trend charts from rendering dates out of order (due to alphabetical string comparisons), the dashboard parses all `DD-MM-YYYY` dates back to timestamps and sorts them in ascending order chronologically before passing them to the **Weekly Revenue Trend** line chart.

---

## 3. Dynamic Insight & Advisory Rules

The **Business Intel Report** generates real-time, context-aware operational recommendations based on the active dataset:

### A. Regional Performance Analysis
*   The application groups all active rows by `region` and calculates each region's sales share:
    $$\text{Regional Share (\%)} = \left( \frac{\text{Regional Sales}}{\text{Total Sales}} \right) \times 100$$
*   **Insight Rules**:
    *   **Top Performer**: The region with the highest share is highlighted as the primary revenue generator.
    *   **Underperformer**: The region with the lowest share is flagged, accompanied by an calculated revenue gap figure ($\text{Top Region Sales} - \text{Bottom Region Sales}$).

### B. Outlets At Risk (Target Deficits)
*   The system aggregates sales and targets for each store individually.
*   **Insight Rules**:
    *   Any store with a total target achievement rate $< 100\%$ is dynamically flagged in the "Target Deficits" report.
    *   Stores are sorted and displayed worst-first (lowest target achievement rate) to focus leadership's attention on high-risk outlets.

### C. Abnormal Return Rates
*   To avoid arbitrary return rate benchmarks, the system computes the dynamic **Overall Average Return Rate** for the selected scope.
*   **Insight Rules**:
    *   Any product category with an individual return rate exceeding this average rate is flagged as an **"Abnormal Return Rate"**.
    *   The report calculates the exact delta above the index average to help prioritize quality assurance audits.
