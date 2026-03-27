"use client";

import { use, useState } from "react";
import { createPortal } from "react-dom";
import { useProjects } from "@/hooks/useProjects";
import {
  useCostRatioData,
  useCreateCostRatioItem,
  useUpdateCostRatioItem,
  useDeleteCostRatioItem,
} from "@/hooks/useCostRatio";
import { CostRatioItem } from "@/types/database";
import {
  ArrowLeft,
  Coins,
  Plus,
  Trash2,
  Loader2,
  TrendingDown,
  TrendingUp,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/components/ErrorState";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShort(value: number): string {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return (
      sign +
      (Number.isInteger(v) ? v.toFixed(0) : parseFloat(v.toFixed(2))) +
      "B"
    );
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return (
      sign +
      (Number.isInteger(v) ? v.toFixed(0) : parseFloat(v.toFixed(1))) +
      "M"
    );
  }
  return sign + abs.toLocaleString("en-US");
}

function formatFull(value: number): string {
  return value > 0 ? value.toLocaleString("en-US") : "";
}

// ─── Editable text cell ───────────────────────────────────────────────────────

function TextCell({
  value,
  onSave,
  placeholder,
  wide,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  wide?: boolean;
}) {
  const [text, setText] = useState(value);

  return (
    <td className={`px-2 py-1 ${wide ? "min-w-[180px]" : "min-w-[100px]"}`}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== value) onSave(text);
        }}
        placeholder={placeholder || "—"}
        className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-100 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 placeholder:text-slate-300 outline-none transition-all"
      />
    </td>
  );
}

// ─── Detail cell — truncated preview + modal editor ──────────────────────────

function DetailCell({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleOpen() {
    setDraft(value);
    setOpen(true);
  }

  function handleSave() {
    if (draft !== value) onSave(draft);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <>
      <td className="px-2 py-1 min-w-[160px] max-w-[220px]">
        <button
          onClick={handleOpen}
          className="w-full text-left px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all group"
        >
          {value ? (
            <span className="text-xs font-medium text-slate-700 line-clamp-2 block">
              {value}
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-300">
              Add description...
            </span>
          )}
        </button>
      </td>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
            onKeyDown={handleKeyDown}
          >
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-blue-600 to-blue-500 px-6 py-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                  Detail / Description
                </h3>
              </div>
              <div className="p-6">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={6}
                  placeholder="Enter a detailed description..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none resize-none transition-all"
                />
              </div>
              <div className="flex items-center justify-end gap-3 px-6 pb-6">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:shadow-md transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// ─── Editable number cell ─────────────────────────────────────────────────────

function NumberCell({
  value,
  onSave,
  noCostLabel,
}: {
  value: number;
  onSave: (v: number) => void;
  noCostLabel?: boolean;
}) {
  const [display, setDisplay] = useState(formatFull(value));

  return (
    <td className="px-2 py-1 min-w-[110px]">
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
          setDisplay(formatFull(newVal));
        }}
        placeholder={noCostLabel ? "No Cost" : "—"}
        className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-100 rounded-lg px-2 py-1.5 text-right text-xs font-medium text-slate-700 placeholder:text-slate-300 outline-none transition-all"
      />
    </td>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CostRatioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: projects = [] } = useProjects();
  const project = projects.find((p) => p.id === projectId);

  const { data, isLoading, isError, refetch } = useCostRatioData(projectId, year);
  const items: CostRatioItem[] = data?.items ?? [];

  const [isExporting, setIsExporting] = useState(false);

  const createItem = useCreateCostRatioItem(projectId, year);
  const updateItem = useUpdateCostRatioItem(projectId, year);
  const deleteItem = useDeleteCostRatioItem(projectId, year);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch(
        `/api/cost-ratio/${projectId}/export?year=${year}`,
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cost-Ratio-${project?.name ?? projectId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  const totalCostTmii = items.reduce((s, i) => s + (i.cost_tmii ?? 0), 0);
  const totalValue = items.reduce((s, i) => s + (i.value ?? 0), 0);
  const ratio =
    totalValue > 0
      ? Math.round((totalCostTmii / totalValue) * 10000) / 100
      : null;

  function handleAddRow() {
    createItem.mutate({
      category: "",
      item_name: "",
      detail: "",
      cost_tmii: 0,
      value: 0,
      order_index: items.length,
    });
  }

  function handleUpdate(
    itemId: string,
    field: keyof CostRatioItem,
    val: string | number,
  ) {
    updateItem.mutate({ itemId, [field]: val });
  }

  const ratioColor =
    ratio === null
      ? "text-slate-400"
      : ratio <= 20
        ? "text-emerald-600"
        : ratio <= 40
          ? "text-amber-500"
          : "text-red-500";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Top Nav */}
      <div className="px-8 py-4 flex items-center shrink-0 z-20">
        <Link
          href="/cost-ratio"
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cost Ratio
        </Link>
        <div className="ml-auto">
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">
            {project?.name || "Loading..."}
          </span>
        </div>
      </div>

      <div className="flex-1 p-8 sm:p-12 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center gap-5 mb-10">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-xl transform -rotate-3 hover:rotate-0 transition-transform">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-2">
                Cost Ratio
              </h1>
              <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                {project?.name || "—"} — Breakdown Cost vs Value
              </p>
            </div>
          </div>

          {/* Controls row — compact, matching tracking page style */}
          <div className="flex items-center justify-end gap-3 mb-10">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-10">
              <button
                onClick={() => setYear(y => y - 1)}
                className="px-3 h-full hover:bg-slate-50 text-slate-500 transition-colors border-r border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer px-4 h-full appearance-none text-center"
              >
                {Array.from({ length: 11 }, (_, i) => year - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={() => setYear(y => y + 1)}
                className="px-3 h-full hover:bg-slate-50 text-slate-500 transition-colors border-l border-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddRow}
              disabled={createItem.isPending}
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-colors border border-slate-200 shadow-sm"
            >
              {createItem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Item
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors border border-blue-100 shadow-sm disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export Excel
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {/* Sponsorship Amount — auto-calculated from Value column */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-blue-600 to-blue-500 px-4 py-3 text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  Sponsorship Amount
                </span>
              </div>
              <div className="px-4 py-4 flex flex-col items-end justify-center gap-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Rp
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {totalValue > 0 ? (
                    totalValue.toLocaleString("en-US")
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </p>
                <p className="text-[9px] font-medium text-slate-400">
                  auto-calculated from table
                </p>
              </div>
            </div>

            {/* Total Cost TMII — auto-calculated */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-slate-600 to-slate-500 px-4 py-3 text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  Total Cost TMII
                </span>
              </div>
              <div className="px-4 py-4 flex flex-col items-end justify-center gap-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Rp
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {totalCostTmii > 0 ? (
                    totalCostTmii.toLocaleString("en-US")
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </p>
                <p className="text-[9px] font-medium text-slate-400">
                  auto-calculated from table
                </p>
              </div>
            </div>

            {/* Ratio */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-4 py-3 text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  Cost Ratio
                </span>
              </div>
              <div className="px-4 py-4 flex flex-col items-center justify-center gap-2">
                {ratio !== null ? (
                  <>
                    <p className={`text-4xl font-bold ${ratioColor}`}>
                      {ratio.toFixed(2)}%
                    </p>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold ${ratioColor}`}
                    >
                      {ratio <= 30 ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5" />
                      )}
                      Cost / Sponsorship
                    </div>
                  </>
                ) : (
                  <p className="text-slate-300 text-2xl font-bold">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-60 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Loading Data
              </span>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {/* Table header label */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-widest text-white">
                  Breakdown Items
                </span>
                <span className="text-blue-200 text-xs font-medium">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-blue-50/60">
                      {[
                        "Category",
                        "Item / Benefit",
                        "Detail / Description",
                        "Cost TMII (Rp)",
                        "Value (Rp)",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-blue-600 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-16 text-center text-slate-400 text-sm font-medium"
                        >
                          No items yet. Click &quot;Add Item&quot; to get
                          started.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/60 transition-colors group"
                        >
                          <TextCell
                            value={item.category}
                            onSave={(v) => handleUpdate(item.id, "category", v)}
                            placeholder="Category"
                          />
                          <TextCell
                            value={item.item_name}
                            onSave={(v) =>
                              handleUpdate(item.id, "item_name", v)
                            }
                            placeholder="Item name"
                            wide
                          />
                          <DetailCell
                            value={item.detail}
                            onSave={(v) => handleUpdate(item.id, "detail", v)}
                          />
                          <NumberCell
                            key={`cost-${item.id}-${item.cost_tmii}`}
                            value={item.cost_tmii}
                            onSave={(v) =>
                              handleUpdate(item.id, "cost_tmii", v)
                            }
                            noCostLabel
                          />
                          <NumberCell
                            key={`val-${item.id}-${item.value}`}
                            value={item.value}
                            onSave={(v) => handleUpdate(item.id, "value", v)}
                          />
                          <td className="px-2 py-1 w-10">
                            <button
                              onClick={() => deleteItem.mutate(item.id)}
                              disabled={deleteItem.isPending}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {/* Footer totals */}
                  {items.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td
                          colSpan={3}
                          className="px-3 py-3 text-right text-xs font-bold uppercase tracking-widest text-slate-500"
                        >
                          Total
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-bold text-slate-800">
                          {totalCostTmii > 0 ? (
                            <span>
                              <span className="text-slate-400 text-[9px] mr-1">
                                Rp
                              </span>
                              {totalCostTmii.toLocaleString("en-US")}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-bold text-slate-800">
                          {totalValue > 0 ? (
                            <span>
                              <span className="text-slate-400 text-[9px] mr-1">
                                Rp
                              </span>
                              {totalValue.toLocaleString("en-US")}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td />
                      </tr>
                      <tr className="bg-amber-50/60 border-t border-amber-100">
                        <td
                          colSpan={3}
                          className="px-3 py-3 text-right text-xs font-bold uppercase tracking-widest text-amber-700"
                        >
                          Sponsorship Amount
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-bold text-amber-700">
                          {totalValue > 0 ? (
                            <span>
                              <span className="text-amber-400 text-[9px] mr-1">
                                Rp
                              </span>
                              {totalValue.toLocaleString("en-US")}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td />
                        <td />
                      </tr>
                      <tr className="bg-blue-50/60 border-t border-blue-100">
                        <td
                          colSpan={3}
                          className="px-3 py-3 text-right text-xs font-bold uppercase tracking-widest text-blue-700"
                        >
                          Cost Ratio (Cost TMII / Sponsorship)
                        </td>
                        <td
                          colSpan={2}
                          className={`px-3 py-3 text-right text-sm font-bold ${ratioColor}`}
                        >
                          {ratio !== null ? `${ratio.toFixed(2)}%` : "—"}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
