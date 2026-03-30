"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Loader2,
  Download,
} from "lucide-react";
import { useRevenueData, useUpsertRevenue } from "@/hooks/useRevenue";
import { toast } from "sonner";
import { RevenueMonthly } from "@/types/database";
import { ErrorState } from "@/components/ErrorState";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const QUARTERS = [
  { label: "Q1", months: [1, 2, 3] },
  { label: "Q2", months: [4, 5, 6] },
  { label: "Q3", months: [7, 8, 9] },
  { label: "Q4", months: [10, 11, 12] },
];

type Tab = "rkap" | "carry_over";
type SaveableField =
  | "rkap_target"
  | "carry_over_target"
  | "confirmed_amount"
  | "carry_over_confirmed_amount"
  | "best_estimate"
  | "carry_over_best_estimate";

// Abbreviated display for summary blocks (read-only)
function formatShort(value: number): string {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return (
      sign +
      (Number.isInteger(v) ? v.toFixed(0) : parseFloat(v.toFixed(2))) +
      "M"
    );
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return (
      sign +
      (Number.isInteger(v) ? v.toFixed(0) : parseFloat(v.toFixed(1))) +
      "Jt"
    );
  }
  return sign + abs.toLocaleString("en-US");
}

function emptyMonth(year: number, month: number): RevenueMonthly {
  return {
    id: "",
    year,
    month,
    rkap_target: 0,
    carry_over_target: 0,
    confirmed_amount: 0,
    carry_over_confirmed_amount: 0,
    best_estimate: 0,
    carry_over_best_estimate: 0,
    created_at: "",
    updated_at: "",
  };
}

// ─── Editable Cell — always-visible inline input with live comma formatting ──

interface EditableCellProps {
  value: number;
  onSave: (newValue: number) => void;
}

function EditableCell({ value, onSave }: EditableCellProps) {
  const [display, setDisplay] = useState(() =>
    value > 0 ? value.toLocaleString("en-US") : "",
  );

  return (
    <td className="px-2 py-1">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "");
          setDisplay(digits ? Number(digits).toLocaleString("en-US") : "");
        }}
        onBlur={() => {
          const digits = display.replace(/[^0-9]/g, "");
          const newVal = digits ? parseInt(digits, 10) : 0;
          if (newVal !== value) onSave(newVal);
          setDisplay(newVal > 0 ? newVal.toLocaleString("en-US") : "");
        }}
        placeholder="-"
        className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-100 rounded-lg px-2 py-1.5 text-right text-xs font-medium text-slate-700 placeholder:text-slate-300 outline-none transition-all"
      />
    </td>
  );
}

// ─── Month Block ─────────────────────────────────────────────────────────────

interface MonthBlockProps {
  month: number;
  data: RevenueMonthly;
  tab: Tab;
  onSave: (month: number, field: SaveableField, newValue: number) => void;
}

function MonthBlock({ month, data, tab, onSave }: MonthBlockProps) {
  const target = tab === "rkap" ? data.rkap_target : data.carry_over_target;
  const confirm =
    tab === "rkap" ? data.confirmed_amount : data.carry_over_confirmed_amount;
  const gap = confirm - target;
  const pct = target > 0 ? parseFloat(((target - confirm) / target * 100).toFixed(2)) : null;

  const gapColor =
    gap > 0 ? "text-emerald-600" : gap < 0 ? "text-red-500" : "text-slate-400";
  const pctColor =
    pct === null
      ? "text-slate-400"
      : pct <= 0
        ? "text-emerald-600"
        : pct <= 25
          ? "text-amber-500"
          : "text-red-500";

  const targetField: SaveableField =
    tab === "rkap" ? "rkap_target" : "carry_over_target";
  const confirmField: SaveableField =
    tab === "rkap" ? "confirmed_amount" : "carry_over_confirmed_amount";
  const beField: SaveableField =
    tab === "rkap" ? "best_estimate" : "carry_over_best_estimate";
  const be =
    tab === "rkap" ? data.best_estimate : data.carry_over_best_estimate;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      {/* Month header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 px-4 py-3 text-center">
        <span className="text-sm font-bold uppercase tracking-widest text-white">
          {MONTH_NAMES[month - 1]}
        </span>
      </div>

      {/* Sub-headers */}
      <div className="grid grid-cols-5 border-b border-slate-100 bg-blue-50/60">
        {["Target", "Confirm", "%", "Gap", "Best Est."].map((h) => (
          <div
            key={h}
            className="px-2 py-1.5 text-center text-[9px] font-bold uppercase tracking-widest text-blue-600"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Data row */}
      <table className="w-full">
        <tbody>
          <tr>
            <EditableCell
              key={`target-${target}`}
              value={target}
              onSave={(v) => onSave(month, targetField, v)}
            />
            <EditableCell
              key={`confirm-${confirm}`}
              value={confirm}
              onSave={(v) => onSave(month, confirmField, v)}
            />
            <td
              className={`px-2 py-2 text-center text-xs font-bold ${pctColor}`}
            >
              {pct !== null ? (
                `${pct.toFixed(2)}%`
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </td>
            <td
              className={`px-2 py-2 text-right text-xs font-bold ${gapColor}`}
            >
              {target > 0 ? (
                formatShort(gap)
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </td>
            <EditableCell
              key={`be-${be}`}
              value={be}
              onSave={(v) => onSave(month, beField, v)}
            />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Summary Block ────────────────────────────────────────────────────────────

interface SummaryBlockProps {
  label: string;
  months: number[];
  dataMap: Record<number, RevenueMonthly>;
  tab: Tab;
  size?: "sm" | "lg";
}

function SummaryBlock({
  label,
  months,
  dataMap,
  tab,
  size = "sm",
}: SummaryBlockProps) {
  const totals = months.reduce(
    (acc, m) => {
      const d = dataMap[m];
      if (!d) return acc;
      acc.target += tab === "rkap" ? d.rkap_target : d.carry_over_target;
      acc.confirm +=
        tab === "rkap" ? d.confirmed_amount : d.carry_over_confirmed_amount;
      acc.be += tab === "rkap" ? d.best_estimate : d.carry_over_best_estimate;
      return acc;
    },
    { target: 0, confirm: 0, be: 0 },
  );

  const gap = totals.confirm - totals.target;
  const pct =
    totals.target > 0
      ? parseFloat(((totals.target - totals.confirm) / totals.target * 100).toFixed(2))
      : null;
  const gapColor =
    gap > 0 ? "text-emerald-600" : gap < 0 ? "text-red-500" : "text-slate-400";
  const pctColor =
    pct === null
      ? "text-slate-400"
      : pct <= 0
        ? "text-emerald-600"
        : pct <= 25
          ? "text-amber-500"
          : "text-red-500";

  const headerBg =
    size === "lg"
      ? "bg-gradient-to-br from-slate-800 to-slate-700"
      : "bg-gradient-to-br from-slate-600 to-slate-500";

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${size === "lg" ? "shadow-md" : ""}`}
    >
      <div className={`${headerBg} px-4 py-3 text-center`}>
        <span
          className={`font-bold uppercase tracking-widest text-white ${size === "lg" ? "text-sm" : "text-xs"}`}
        >
          {label}
        </span>
      </div>
      <div className="grid grid-cols-5 border-b border-slate-100 bg-slate-50/60">
        {["Target", "Confirm", "%", "Gap", "Best Est."].map((h) => (
          <div
            key={h}
            className="px-2 py-1.5 text-center text-[9px] font-bold uppercase tracking-widest text-slate-400"
          >
            {h}
          </div>
        ))}
      </div>
      <table className="w-full">
        <tbody>
          <tr>
            <td className="px-2 py-2 text-right text-xs font-bold text-slate-700">
              {formatShort(totals.target)}
            </td>
            <td className="px-2 py-2 text-right text-xs font-bold text-slate-700">
              {formatShort(totals.confirm)}
            </td>
            <td
              className={`px-2 py-2 text-center text-xs font-bold ${pctColor}`}
            >
              {pct !== null ? (
                `${pct.toFixed(2)}%`
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </td>
            <td
              className={`px-2 py-2 text-right text-xs font-bold ${gapColor}`}
            >
              {totals.target > 0 ? (
                formatShort(gap)
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </td>
            <td className="px-2 py-2 text-right text-xs font-bold text-slate-700">
              {formatShort(totals.be)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TargetRevenuePage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [tab, setTab] = useState<Tab>("rkap");
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: revenueList,
    isLoading,
    isError,
    refetch,
  } = useRevenueData(year);
  const upsert = useUpsertRevenue(year);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/revenue/export?year=${year}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Export failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Target-Revenue-${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  const dataMap = useMemo<Record<number, RevenueMonthly>>(() => {
    const map: Record<number, RevenueMonthly> = {};
    revenueList?.forEach((r) => {
      map[r.month] = r;
    });
    return map;
  }, [revenueList]);

  function getMonthData(month: number): RevenueMonthly {
    return dataMap[month] || emptyMonth(year, month);
  }

  function handleSave(month: number, field: SaveableField, newValue: number) {
    const existing = getMonthData(month);
    upsert.mutate({
      year,
      month,
      rkap_target: existing.rkap_target,
      carry_over_target: existing.carry_over_target,
      confirmed_amount: existing.confirmed_amount,
      carry_over_confirmed_amount: existing.carry_over_confirmed_amount,
      best_estimate: existing.best_estimate,
      carry_over_best_estimate: existing.carry_over_best_estimate,
      [field]: newValue,
    });
  }

  return (
    <div className="min-h-screen p-8 sm:p-12 flex flex-col">
      <div className="max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-xl transform -rotate-3 hover:rotate-0 transition-transform">
            <CircleDollarSign className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-2">
              Target Revenue
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Sponsorship — Monthly Revenue Achievement
            </p>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
          {/* Tab switcher */}
          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setTab("rkap")}
              className={`rounded-xl px-5 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                tab === "rkap"
                  ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              RKAP
            </button>
            <button
              onClick={() => setTab("carry_over")}
              className={`rounded-xl px-5 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                tab === "carry_over"
                  ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Carry Over
            </button>
          </div>

          {/* Year picker */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-10">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="px-3 h-full hover:bg-slate-50 text-slate-500 transition-colors border-r border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer px-4 h-full appearance-none text-center"
            >
              {Array.from({ length: 11 }, (_, i) => year - 5 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="px-3 h-full hover:bg-slate-50 text-slate-500 transition-colors border-l border-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="ml-auto flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Excel
          </button>
        </div>

        {/* Loading / Error */}
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-60 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Loading Revenue Data
            </span>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Monthly grid by quarter */}
            {QUARTERS.map((q) => (
              <div key={q.label}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    {q.label}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {q.months.map((m) => (
                    <MonthBlock
                      key={m}
                      month={m}
                      data={getMonthData(m)}
                      tab={tab}
                      onSave={handleSave}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Summary */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Summary
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Q summaries */}
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 mb-5">
                {QUARTERS.map((q) => (
                  <SummaryBlock
                    key={q.label}
                    label={q.label}
                    months={q.months}
                    dataMap={dataMap}
                    tab={tab}
                    size="sm"
                  />
                ))}
              </div>

              {/* Semester + Grand Total */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <SummaryBlock
                  label="Semester 1"
                  months={[1, 2, 3, 4, 5, 6]}
                  dataMap={dataMap}
                  tab={tab}
                  size="lg"
                />
                <SummaryBlock
                  label="Semester 2"
                  months={[7, 8, 9, 10, 11, 12]}
                  dataMap={dataMap}
                  tab={tab}
                  size="lg"
                />
                <SummaryBlock
                  label="Grand Total"
                  months={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                  dataMap={dataMap}
                  tab={tab}
                  size="lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
