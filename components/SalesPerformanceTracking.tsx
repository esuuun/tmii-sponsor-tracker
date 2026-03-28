"use client";

import { useState, useEffect } from "react";
import { Plus, Download, ChevronRight, ChevronLeft, Loader2, Edit2, Trash2, Check, X } from "lucide-react";
import { useSales, useSalesMutations } from "@/hooks/useProjectDetails";
import { useAuth } from "@/hooks/useAuth";
import { formatIDR } from "@/utils/format";
import Link from "next/link";
import { toast } from "sonner";

// ─── Formatted number input cell ─────────────────────────────────────────────

interface SalesAmountCellProps {
  value: number | undefined;
  readOnly: boolean;
  onSave: (rawDigits: string) => void;
}

function SalesAmountCell({ value, readOnly, onSave }: SalesAmountCellProps) {
  const numVal = value !== undefined ? Number(value) : undefined;

  const [display, setDisplay] = useState(() =>
    numVal !== undefined && numVal !== 0 ? numVal.toLocaleString("en-US") : ""
  );

  useEffect(() => {
    setDisplay(numVal !== undefined && numVal !== 0 ? numVal.toLocaleString("en-US") : "");
  }, [numVal]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      readOnly={readOnly}
      onChange={(e) => {
        if (readOnly) return;
        const digits = e.target.value.replace(/[^0-9]/g, "");
        setDisplay(digits ? Number(digits).toLocaleString("en-US") : "");
      }}
      onBlur={() => {
        if (readOnly) return;
        const digits = display.replace(/[^0-9]/g, "");
        const parsed = digits ? parseInt(digits, 10) : 0;
        const original = numVal !== undefined ? numVal : 0;
        if (parsed !== original) onSave(digits);
        setDisplay(parsed > 0 ? parsed.toLocaleString("en-US") : "");
      }}
      placeholder="-"
      className="w-20 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-100 rounded px-2 py-1.5 transition-all text-slate-700 font-medium placeholder:text-slate-300 outline-none read-only:hover:border-transparent read-only:focus:ring-0 read-only:focus:bg-transparent read-only:cursor-default"
    />
  );
}

type PivotRow = {
  itemName: string;
  _saleIds: Record<string, string>;
  [month: string]: any; // either number or undefined
};

function AddItemModal({ isOpen, onClose, onAdd, isPending }: { isOpen: boolean; onClose: () => void; onAdd: (name: string) => void, isPending: boolean }) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-sm flex-col rounded-3xl bg-white shadow-2xl ring-1 ring-slate-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Add New Item</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Track a new product or item.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2.5">
            <label htmlFor="itemName" className="text-sm font-bold tracking-wide text-slate-700">Item Name <span className="text-red-500">*</span></label>
            <input 
              id="itemName"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mizone" 
              required
              autoFocus
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="mt-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded-xl px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100/80 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all hover:shadow-md disabled:bg-blue-400 flex items-center gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SalesPerformanceTracking({ projectId, isFullScreen = false, projectName }: { projectId: string, isFullScreen?: boolean, projectName?: string }) {
  const { data: user } = useAuth();
  const isAdmin = !!user;

  const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editItemValue, setEditItemValue] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { data: sales = [], isLoading } = useSales(projectId, selectedYear);
  const { data: allSales = [] } = useSales(projectId); // All years — for master item list
  const { createSalesItem, updateSalesAmount, renameSalesItem, deleteSalesItem, deleteSingleSale } = useSalesMutations(projectId, selectedYear);

  // Master item list: all items that have EVER existed, sorted
  const allItemNames = Array.from(new Set(allSales.map(s => s.item_name))).sort();

  // Pivot year-specific data into amounts by item + month
  const yearSalesMap: Record<string, PivotRow> = sales.reduce((acc, sale) => {
    if (!acc[sale.item_name]) acc[sale.item_name] = { itemName: sale.item_name, _saleIds: {} };
    acc[sale.item_name][sale.month] = sale.sales_amount;
    acc[sale.item_name]._saleIds[sale.month] = sale.id;
    return acc;
  }, {} as Record<string, PivotRow>);

  // Build displayData: always include every item, fill from yearSalesMap (or empty row if no data this year)
  const displayData: PivotRow[] = allItemNames.map(name =>
    yearSalesMap[name] ?? { itemName: name, _saleIds: {} }
  );

  const items = allItemNames;

  const handleAmountChange = (itemName: string, month: string, val: string, id?: string) => {
    // If user clears the input and there is an existing record (id exists), delete it from DB
    if (val === "" && id) {
      deleteSingleSale.mutate(id);
      return;
    }

    const amount = val === "" ? 0 : Number(val);
    
    // Optimistically UI behavior handled somewhat inherently by React Query, but we will dispatch mutation
    if (id) {
      updateSalesAmount.mutate({ id, item_name: itemName, month, sales_amount: amount });
    } else if (val !== "") {
      // Only create a new record if the value is not empty
      createSalesItem.mutate({ item_name: itemName, month, sales_amount: amount });
    }
  };

  const handleAddItem = (name: string) => {
    // When adding a new item, we create a 0 entry for January so it appears in the DB.
    createSalesItem.mutate(
      { item_name: name, month: "January", sales_amount: 0 },
      { onSuccess: () => setIsModalOpen(false) }
    );
  };

  const handleSaveRename = (oldName: string) => {
    if (!editItemValue.trim() || editItemValue === oldName) {
      setEditingItem(null);
      return;
    }
    renameSalesItem.mutate({ old_item_name: oldName, new_item_name: editItemValue }, {
      onSuccess: () => setEditingItem(null)
    });
  };

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sales/export?year=${selectedYear}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Export failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sales-Matrix-${projectName ?? projectId}-${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  // ---- Compute summary stats ----
  const grandTotal = displayData.reduce((sum, row) => {
    return sum + fullMonths.reduce((s, m) => s + (Number(row[m]) || 0), 0);
  }, 0);
  const bestMonth = fullMonths.reduce((best, m) => {
    const total = displayData.reduce((s, row) => s + (Number(row[m]) || 0), 0);
    const bestTotal = displayData.reduce((s, row) => s + (Number(row[best]) || 0), 0);
    return total > bestTotal ? m : best;
  }, fullMonths[0]);

  if (isFullScreen) {
    return (
      <div className="flex flex-col w-full h-full flex-1 overflow-hidden">
        {/* Full-page Header */}
        <div className="flex items-start justify-between mb-6 shrink-0 gap-6 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {projectName ? `${projectName} Sales Matrix` : 'Sales Matrix'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Monthly sales volume per item across the fiscal year</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Year Picker */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-10">
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                className="px-3 h-full hover:bg-slate-50 text-slate-500 transition-colors border-r border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer px-4 h-full appearance-none text-center"
              >
                {Array.from({ length: 11 }, (_, i) => selectedYear - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={() => setSelectedYear(y => y + 1)}
                className="px-3 h-full hover:bg-slate-50 text-slate-500 transition-colors border-l border-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {isAdmin && (
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-colors border border-slate-200 shadow-sm">
                <Plus className="h-4 w-4" /> Add Item
              </button>
            )}
            <button onClick={exportExcel} disabled={isExporting} className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors border border-blue-100 shadow-sm disabled:opacity-60">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export Excel
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Items</p>
            <p className="text-3xl font-bold text-slate-900">{items.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Monthly Total</p>
            <p className="text-3xl font-bold text-slate-900">{formatIDR(grandTotal)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Best Month</p>
            <p className="text-3xl font-bold text-slate-900">{bestMonth.slice(0, 3)}</p>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm relative min-h-[200px]">
          {isLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-bold text-slate-500 mt-2">Loading performance data...</p>
            </div>
          )}
          <table key={selectedYear} className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-500 uppercase sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-4 sticky left-0 bg-slate-50/95 shadow-[1px_0_0_0_#f1f5f9] z-20 w-48">Item Name</th>
                {fullMonths.map(m => (
                  <th key={m} scope="col" className="px-6 py-4">{m.slice(0, 3)}</th>
                ))}
                <th scope="col" className="px-6 py-4 text-right sticky right-0 bg-slate-50/95 shadow-[-1px_0_0_0_#f1f5f9] z-20">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayData.map((row, idx) => {
                let total = 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50/50 shadow-[1px_0_0_0_#f1f5f9] z-10 w-48">
                      {editingItem === row.itemName ? (
                        <div className="flex items-center gap-1">
                          <input autoFocus type="text"
                            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 outline-none w-full min-w-[100px]"
                            value={editItemValue}
                            onChange={(e) => setEditItemValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(row.itemName)}
                          />
                          <button onClick={() => handleSaveRename(row.itemName)} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-slate-100 text-slate-400 rounded"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="flex-1 truncate block max-w-[120px]" title={row.itemName}>{row.itemName}</span>
                          {isAdmin && (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                              <button onClick={() => { setEditingItem(row.itemName); setEditItemValue(row.itemName); }} className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors" title="Rename"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteSalesItem.mutate(row.itemName)} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    {fullMonths.map(m => {
                      const val = row[m];
                      const amount = Number(val) || 0;
                      total += amount;
                      const saleId = row._saleIds[m];
                      return (
                        <td key={m} className="px-4 py-2">
                          <SalesAmountCell
                            value={val}
                            readOnly={!isAdmin}
                            onSave={(digits) => handleAmountChange(row.itemName, m, digits, saleId)}
                          />
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 font-bold text-slate-900 text-right sticky right-0 bg-white group-hover:bg-slate-50/50 shadow-[-1px_0_0_0_#f1f5f9] z-10 w-24">{formatIDR(total)}</td>
                  </tr>
                );
              })}
              {displayData.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={14} className="px-6 py-16 text-center text-slate-400 font-medium tracking-wide">
                    No sales data yet. Click &quot;Add Item&quot; to start tracking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddItem} isPending={createSalesItem.isPending} />
      </div>
    );
  }

  // ---- Compact card version (embedded in project details) ----
  return (
    <div className="flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden relative h-[500px]">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <Link href={`/tracking/${projectId}`} className="flex items-center gap-2 group/link w-fit">
            <h3 className="text-xl font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors">Project Sales Matrix</h3>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover/link:text-blue-600 group-hover/link:translate-x-1 transition-all" />
          </Link>
          <p className="text-sm font-medium text-slate-500 mt-1.5">Sales volume per item across months in this project</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Compact Year Picker */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8 text-sm">
            <button onClick={() => setSelectedYear(y => y - 1)} className="px-2 h-full hover:bg-slate-100 text-slate-500 transition-colors border-r border-slate-200">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 font-bold text-slate-700 text-xs">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="px-2 h-full hover:bg-slate-100 text-slate-500 transition-colors border-l border-slate-200">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors border border-slate-200">
              <Plus className="h-4 w-4" /> Add Item
            </button>
          )}
          <button onClick={exportExcel} disabled={isExporting} className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50/50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors border border-blue-100 disabled:opacity-60">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export Excel
          </button>
        </div>
      </div>

      <div className="overflow-auto flex-1 pb-4 relative min-h-[150px]">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-bold text-slate-500 mt-2">Loading performance data...</p>
          </div>
        )}
        <table key={selectedYear} className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            <tr>
              <th scope="col" className="px-6 py-4 sticky left-0 bg-slate-50/95 shadow-[1px_0_0_0_#f1f5f9] z-10 w-48">Item Name</th>
              {fullMonths.map(m => (
                <th key={m} scope="col" className="px-6 py-4">{m.slice(0, 3)}</th>
              ))}
              <th scope="col" className="px-6 py-4 text-right sticky right-0 bg-slate-50/95 shadow-[-1px_0_0_0_#f1f5f9] z-10">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {displayData.map((row, idx) => {
              let total = 0;
              return (
                 <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                   <td className="px-6 py-4 font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50/50 shadow-[1px_0_0_0_#f1f5f9] z-10 w-48">
                      {editingItem === row.itemName ? (
                        <div className="flex items-center gap-1">
                          <input 
                            autoFocus
                            type="text" 
                            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 outline-none w-full min-w-[100px]"
                            value={editItemValue}
                            onChange={(e) => setEditItemValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(row.itemName)}
                          />
                          <button onClick={() => handleSaveRename(row.itemName)} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-slate-100 text-slate-400 rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="flex-1 truncate block max-w-[120px]" title={row.itemName}>{row.itemName}</span>
                          {isAdmin && (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                              <button 
                                onClick={() => { setEditingItem(row.itemName); setEditItemValue(row.itemName); }}
                                className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                title="Rename Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteSalesItem.mutate(row.itemName)}
                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                   </td>
                   
                   {fullMonths.map(m => {
                     const val = row[m];
                     const amount = Number(val) || 0;
                     total += amount;
                     const saleId = row._saleIds[m];
                     return (
                       <td key={m} className="px-4 py-2">
                         <SalesAmountCell
                           value={val}
                           readOnly={!isAdmin}
                           onSave={(digits) => handleAmountChange(row.itemName, m, digits, saleId)}
                         />
                       </td>
                     );
                   })}
                   <td className="px-6 py-4 font-bold text-slate-900 text-right sticky right-0 bg-white group-hover:bg-slate-50/50 shadow-[-1px_0_0_0_#f1f5f9] z-10 w-24">
                     {formatIDR(total)}
                   </td>
                 </tr>
              )
            })}
            {displayData.length === 0 && !isLoading && (
              <tr>
                <td colSpan={14} className="px-6 py-8 text-center text-slate-400 font-medium tracking-wide">
                  No sales data available. Click "Add Item" to start tracking your performance.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <AddItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddItem}
        isPending={createSalesItem.isPending}
      />
    </div>
  );
}
