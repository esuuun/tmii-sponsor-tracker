"use client";

import { useState, use } from "react";
import { useProjects } from "@/hooks/useProjects";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Edit2,
  MoreHorizontal,
  ArrowLeft,
  AlignLeft,
} from "lucide-react";
import { useTimelines, useTimelineMutations } from "@/hooks/useProjectDetails";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function ProjectGanttPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const { data: projects = [] } = useProjects();
  const currentProject = projects.find((p) => p.id === projectId);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50/50">
      {/* Top Nav Back Link */}
      <div className="px-8 py-4 flex items-center shrink-0 z-20">
        <Link
          href="/timeline"
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Timelines
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">
            {currentProject?.name || "Loading..."}
          </span>
        </div>
      </div>

      {/* Main Canvas Injection */}
      <div className="flex-1 p-6 sm:p-10 overflow-hidden flex flex-col w-full h-full max-w-[1500px] mx-auto animate-in fade-in duration-300">
        <YearlyGanttViewer
          projectId={projectId}
          projectName={currentProject?.name}
        />
      </div>
    </div>
  );
}

function YearlyGanttViewer({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName?: string;
}) {
  const { data: user } = useAuth();
  const isAdmin = !!user;

  const { data: elements = [], isLoading } = useTimelines(projectId);
  const { createTimeline, updateTimeline, deleteTimeline } =
    useTimelineMutations(projectId);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [newPhase, setNewPhase] = useState({
    task_detail: "",
    start_date: "",
    end_date: "",
    category: "Approaching",
  });

  if (isLoading) {
    return (
      <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-2" />
        <p className="text-slate-500 font-medium">Loading timeline...</p>
      </div>
    );
  }

  const openAddModal = () => {
    setEditingId(null);
    setNewPhase({
      task_detail: "",
      start_date: "",
      end_date: "",
      category: "Approaching",
    });
    setIsAdding(true);
  };

  const openEditModal = (element: any) => {
    setEditingId(element.id);
    setNewPhase({
      task_detail: element.task_detail,
      start_date: element.start_date,
      end_date: element.end_date,
      category: element.category,
    });
    setIsAdding(true);
    setActiveDropdown(null);
    setDropdownPos(null);
  };

  const handleAddPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateTimeline.mutate(
        { id: editingId, ...newPhase },
        {
          onSuccess: () => {
            setIsAdding(false);
            setEditingId(null);
          },
        },
      );
    } else {
      createTimeline.mutate(newPhase, {
        onSuccess: () => {
          setIsAdding(false);
          setNewPhase({
            task_detail: "",
            start_date: "",
            end_date: "",
            category: "Approaching",
          });
        },
      });
    }
  };

  const handlePrevYear = () => setSelectedYear((y) => y - 1);
  const handleNextYear = () => setSelectedYear((y) => y + 1);

  const startYear = new Date(`${selectedYear}-01-01T00:00:00`);
  const endYear = new Date(`${selectedYear}-12-31T23:59:59.999`);
  const totalDuration = endYear.getTime() - startYear.getTime();

  // Show ALL phases sorted by start date; filter Gantt bar visibility per element
  const yearEvents = [...elements].sort(
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );

  type CategoryStyle = {
    bg: string;
    border: string;
    text: string;
    fill: string;
  };
  const categoryStyles: Record<string, CategoryStyle> = {
    Approaching: {
      bg: "bg-indigo-100",
      border: "border-indigo-500",
      text: "text-indigo-700",
      fill: "bg-indigo-500",
    },
    Present: {
      bg: "bg-blue-100",
      border: "border-blue-500",
      text: "text-blue-700",
      fill: "bg-blue-500",
    },
    Negotiations: {
      bg: "bg-amber-100",
      border: "border-amber-500",
      text: "text-amber-700",
      fill: "bg-amber-500",
    },
    Signing: {
      bg: "bg-emerald-100",
      border: "border-emerald-500",
      text: "text-emerald-700",
      fill: "bg-emerald-500",
    },
    "Kontraprestasi Deployment": {
      bg: "bg-violet-100",
      border: "border-violet-500",
      text: "text-violet-700",
      fill: "bg-violet-500",
    },
    Reporting: {
      bg: "bg-orange-100",
      border: "border-orange-500",
      text: "text-orange-700",
      fill: "bg-orange-500",
    },
    Invoicing: {
      bg: "bg-rose-100",
      border: "border-rose-500",
      text: "text-rose-700",
      fill: "bg-rose-500",
    },
  };

  const getStyle = (cat: string) => {
    const defaultStyle = {
      bg: "bg-slate-100",
      border: "border-slate-400",
      text: "text-slate-700",
      fill: "bg-slate-400",
    };
    if (!cat) return defaultStyle;
    const match = Object.keys(categoryStyles).find(
      (k) => k.toLowerCase() === cat.toLowerCase(),
    );
    return match ? categoryStyles[match] : defaultStyle;
  };

  // TODAY line tracking spanning exactly scaled against the entire year length
  const today = new Date();
  let todayProgress = -1;
  let isTodayInYear = false;
  if (today >= startYear && today <= endYear) {
    isTodayInYear = true;
    todayProgress = Math.max(
      0,
      Math.min(
        100,
        ((today.getTime() - startYear.getTime()) / totalDuration) * 100,
      ),
    );
  }

  return (
    <div className="flex-1 rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-100 flex flex-col overflow-hidden relative group min-h-[600px]">
      {/* Refactored Header Layout to fit 7 categories and buttons cleanly */}
      <div className="flex flex-col mb-8 sm:mb-12 relative z-20">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="shrink-0">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              {projectName
                ? `${projectName} Timeline`
                : "Project Flow Timeline"}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Gantt roadmap mapped against fiscal year milestones.
            </p>
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl transition-all border border-slate-200 shadow-sm"
              >
                <Plus className="h-4 w-4 text-slate-400" /> Add Phase
              </button>
            )}
          </div>

          <div className="flex flex-col items-end gap-5">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-10 w-fit">
              <button
                onClick={handlePrevYear}
                className="px-3 h-full hover:bg-slate-50 text-slate-500 transition-colors border-r border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer px-4 h-full appearance-none text-center"
              >
                {Array.from({ length: 11 }, (_, i) => selectedYear - 5 + i).map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ),
                )}
              </select>
              <button
                onClick={handleNextYear}
                className="px-3 h-full hover:bg-slate-50 text-slate-500 transition-colors border-l border-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden lg:flex flex-wrap justify-end gap-x-4 gap-y-2.5 max-w-[600px]">
              {Object.entries(categoryStyles).map(([cat, style]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${style.fill}`}
                  />
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    {cat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isAdding && isAdmin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleAddPhase}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Phase" : "Add New Phase"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Task Detail
                </label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={newPhase.task_detail}
                  onChange={(e) =>
                    setNewPhase({ ...newPhase, task_detail: e.target.value })
                  }
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  placeholder="e.g. Initial Design Development"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Start Date
                  </label>
                  <input
                    required
                    type="date"
                    value={newPhase.start_date}
                    onChange={(e) =>
                      setNewPhase({ ...newPhase, start_date: e.target.value })
                    }
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    End Date
                  </label>
                  <input
                    required
                    type="date"
                    value={newPhase.end_date}
                    onChange={(e) =>
                      setNewPhase({ ...newPhase, end_date: e.target.value })
                    }
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Category
                </label>
                <select
                  value={newPhase.category}
                  onChange={(e) =>
                    setNewPhase({ ...newPhase, category: e.target.value })
                  }
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                >
                  {Object.keys(categoryStyles).map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTimeline.isPending || updateTimeline.isPending}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-[0_4px_14px_0_rgb(37,99,235,0.2)] hover:shadow-lg transition-all"
              >
                {createTimeline.isPending || updateTimeline.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingId ? (
                  <Edit2 className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editingId ? "Save Changes" : "Save Phase"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Canvas Chart Area with Left List Panel */}
      <div className="flex-1 overflow-auto custom-scrollbar relative pr-2">
        {/* Using min-width 800px to ensure it stays a Gantt layout instead of squishing */}
        <div className="min-w-[800px] h-full flex flex-col relative">
          {/* Table Header Row */}
          <div className="flex border-b border-slate-100 pb-2 mb-4 sticky top-0 bg-white z-[80]">
            {/* Left detail column block */}
            <div className="w-[20rem] shrink-0 pl-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-end">
              Task Details & Dates
            </div>

            {/* Monthly 12 Columns Grid Tracker */}
            <div className="flex-1 flex relative">
              {MONTH_SHORT.map((month, i) => (
                <div
                  key={month}
                  className="flex-1 flex justify-start items-end border-l border-slate-100/50 pl-2"
                >
                  <span className="text-[10px] font-bold text-slate-400">
                    {month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* List Tracking Area */}
          <div className="flex-1 flex flex-col relative pb-8">
            {/* Red Thin TODAY line */}
            {isTodayInYear && (
              <div
                className="absolute top-0 bottom-0 w-px bg-red-400 z-10 transition-colors opacity-100 pointer-events-none"
                style={{
                  left: `calc(20rem + ${todayProgress} * (100% - 20rem) / 100)`,
                }}
              >
                <div className="absolute -top-3 -translate-x-1/2 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wider">
                  TODAY
                </div>
              </div>
            )}

            {yearEvents.length === 0 ? (
              <p className="text-sm font-medium text-slate-400 mt-10 text-center">
                No timeline phases added yet.
              </p>
            ) : (
              yearEvents.map((element, idx) => {
                const start = new Date(element.start_date);
                const end = new Date(element.end_date);
                end.setHours(23, 59, 59, 999);

                const isInYear = start <= endYear && end >= startYear;

                const effStart = start < startYear ? startYear : start;
                const effEnd = end > endYear ? endYear : end;

                const startPos = Math.max(
                  0,
                  ((effStart.getTime() - startYear.getTime()) / totalDuration) *
                    100,
                );
                const elementWidth = Math.max(
                  1,
                  Math.min(
                    100 - startPos,
                    ((effEnd.getTime() - effStart.getTime()) / totalDuration) *
                      100,
                  ),
                );

                const style = getStyle(element.category);

                return (
                  <div
                    key={element.id || idx}
                    className={`flex items-center group/row mb-4 min-h-[40px] relative ${!isInYear ? "opacity-40" : ""}`}
                    style={{ zIndex: 60 - idx }}
                  >
                    {/* 1. Left Panel List View */}
                    <div className="w-[20rem] shrink-0 pr-4 pl-2 flex items-center justify-between group-hover/row:bg-slate-50 transition-colors py-2 rounded-lg relative z-20">
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${style.fill}`}
                          ></span>
                          <span
                            className="text-[13px] font-bold text-slate-800 truncate"
                            title={element.task_detail}
                          >
                            {element.task_detail}
                          </span>
                          {!isInYear && (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              {new Date(element.start_date).getFullYear()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 pl-4 opacity-70">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            {element.category || "Phase"}
                          </span>
                          <span className="text-[9px] text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                            {start.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            -{" "}
                            {end.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div
                          className={`relative isolate text-right transition-opacity whitespace-nowrap ${activeDropdown === element.id ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"}`}
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (activeDropdown === element.id) {
                                setActiveDropdown(null);
                                setDropdownPos(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                                setActiveDropdown(element.id);
                              }
                            }}
                            className={`p-1 px-1.5 border rounded-md transition-all shadow-sm ${activeDropdown === element.id ? "bg-slate-100 border-slate-300 text-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {activeDropdown === element.id && dropdownPos && (
                            <>
                              <div
                                className="fixed inset-0 z-[200]"
                                onClick={() => { setActiveDropdown(null); setDropdownPos(null); }}
                              ></div>
                              <div
                                className="fixed w-32 bg-white rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden py-1 z-[201]"
                                style={{ top: dropdownPos.top, left: dropdownPos.left }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openEditModal(element);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <div className="h-px w-full bg-slate-100" />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    deleteTimeline.mutate(element.id);
                                    setActiveDropdown(null);
                                    setDropdownPos(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Interactive Bar Tracker (Gantt Section spanning 12 Months) */}
                    <div className="flex-1 relative h-7 shrink-0 cursor-pointer pointer-events-none group-hover/row:pointer-events-auto">
                      {/* Background vertical division grid lines */}
                      <div className="absolute inset-0 flex">
                        {MONTH_SHORT.map((month) => (
                          <div
                            key={month}
                            className="flex-1 border-l border-slate-100/50 first:border-transparent"
                          ></div>
                        ))}
                      </div>

                      {/* Only render the bar if this phase overlaps the selected year */}
                      {isInYear && (
                        <div
                          className={`absolute h-full transition-all hover:brightness-105 shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex items-center px-1.5 border-l-[3px] ${style.bg} ${style.border} ${style.text} ${start < startYear ? "rounded-l-none border-l-0" : "rounded-l-sm"} ${end > endYear ? "rounded-r-none" : "rounded-r-md"}`}
                          style={{
                            left: `${startPos}%`,
                            width: `${elementWidth}%`,
                          }}
                          title={`${element.task_detail} (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`}
                        >
                          <span className="invisible">_</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `,
        }}
      />
    </div>
  );
}
