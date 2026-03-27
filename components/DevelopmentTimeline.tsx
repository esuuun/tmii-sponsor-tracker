import { useState } from "react";
import { useTimelines, useTimelineMutations } from "@/hooks/useProjectDetails";
import {
  Loader2,
  Plus,
  Trash2,
  X,
  Edit2,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export function DevelopmentTimeline({
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

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [newPhase, setNewPhase] = useState({
    task_detail: "",
    start_date: "",
    end_date: "",
    category: "Approaching",
  });

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

  // Use current year for visualization bounds
  const currentYear = new Date().getFullYear();
  const startYear = new Date(`${currentYear}-01-01`);
  const endYear = new Date(`${currentYear}-12-31`);
  const totalDuration = endYear.getTime() - startYear.getTime();

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

  // Determine current day line position
  const today = new Date();
  const todayProgress = Math.max(
    0,
    Math.min(
      100,
      ((today.getTime() - startYear.getTime()) / totalDuration) * 100,
    ),
  );

  if (isLoading) {
    return (
      <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-2" />
        <p className="text-slate-500 font-medium">Loading timeline...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 flex flex-col overflow-hidden relative group h-[500px]">
      <div className="flex flex-col mb-8 relative z-20">
        <div className="flex items-start justify-between gap-6">
          <div className="shrink-0">
            <Link
              href={`/timeline/${projectId}`}
              className="flex items-center gap-2 group/link w-fit"
            >
              <h3 className="text-xl font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors">
                {projectName
                  ? `${projectName} Timeline`
                  : "Project Flow Timeline"}
              </h3>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover/link:text-blue-600 group-hover/link:translate-x-1 transition-all" />
            </Link>
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
          <div className="flex flex-wrap gap-x-4 gap-y-2.5 justify-end max-w-lg mt-1">
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

      {isAdding && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
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

      <div className="relative flex-1 mt-8">
        {/* Month markers background */}
        <div className="absolute top-0 bottom-0 left-0 right-0 flex pointer-events-none">
          {[
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
          ].map((month, i) => (
            <div
              key={month}
              className={`flex-1 border-slate-100 relative z-0 ${i !== 11 ? "border-r" : ""}`}
            >
              <span className="absolute -top-7 text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-widest">
                {month}
              </span>
            </div>
          ))}
        </div>

        {/* Current Date Line Indicator */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-400 z-10 transition-colors opacity-100 pointer-events-none"
          style={{ left: `${todayProgress}%` }}
        >
          <div className="absolute -top-3 -translate-x-1/2 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wider">
            TODAY
          </div>
        </div>

        {/* Timeline phases */}
        <div className="absolute top-2 bottom-0 left-0 right-0 pt-2 pb-6 flex flex-col gap-6 overflow-y-auto pr-2">
          {elements.length === 0 ? (
            <p className="text-center text-sm font-medium text-slate-400 mt-10">
              No timeline phases constructed.
            </p>
          ) : (
            elements.map((element, idx) => {
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
                  className={`relative h-7 w-full group/bar cursor-pointer ${!isInYear ? "opacity-40" : ""}`}
                >
                  {isInYear ? (
                    <div
                      className={`absolute h-full rounded-r-md rounded-l-sm transition-all hover:brightness-105 hover:shadow-md flex items-center px-2.5 border-l-[3px] ${style.bg} ${style.border} ${style.text}`}
                      style={{
                        left: `${startPos}%`,
                        width: `${elementWidth}%`,
                      }}
                    >
                      <span className="flex-1 min-w-0 text-[10px] sm:text-[11px] font-bold truncate pointer-events-none">
                        {element.task_detail}
                      </span>

                      {isAdmin && (
                        <div
                          className={`absolute right-1 z-30 transition-opacity pointer-events-auto ${activeDropdown === element.id ? "opacity-100" : "opacity-0 group-hover/bar:opacity-100"}`}
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveDropdown(
                                activeDropdown === element.id
                                  ? null
                                  : element.id,
                              );
                            }}
                            className="p-1 px-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-slate-600 transition-all shadow-sm"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {activeDropdown === element.id && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setActiveDropdown(null)}
                              ></div>
                              <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden py-1 z-30">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openEditModal(element);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Edit Phase
                                </button>
                                <div className="h-px w-full bg-slate-100" />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    deleteTimeline.mutate(element.id);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                  Phase
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center px-2">
                      <span className="text-[10px] font-semibold text-slate-400 truncate">
                        {element.task_detail}
                        <span className="ml-1.5 text-[9px] bg-slate-100 px-1 py-0.5 rounded">
                          {new Date(element.start_date).getFullYear()}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
