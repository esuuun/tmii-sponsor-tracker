"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DevelopmentTimeline } from "@/components/DevelopmentTimeline";
import { ToDoList } from "@/components/ToDoList";
import { SalesPerformanceTracking } from "@/components/SalesPerformanceTracking";
import { useProjectDetails } from "@/hooks/useProjectDetails";

import { use } from "react";
import { useTodos } from "@/hooks/useProjectDetails";

export default function ProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, isLoading, error } = useProjectDetails(id);
  const { data: tasks = [] } = useTodos(id);

  // Todo progress dynamically calculated here via data layer hooks
  const completionPercentage = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.is_completed).length / tasks.length) * 100) 
    : 0; 

  const getProgressColorClass = (percentage: number) => {
    if (percentage < 30) return 'stroke-red-500';
    if (percentage < 70) return 'stroke-amber-400';
    if (percentage < 100) return 'stroke-blue-600';
    return 'stroke-emerald-500';
  };

  const progressStrokeClass = getProgressColorClass(completionPercentage);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen p-10 max-w-7xl mx-auto justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col gap-8 p-10 max-w-7xl mx-auto">
        <p className="text-red-500 font-medium h-40 flex items-center justify-center">Failed to load project details.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-10 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
            {project.status.toUpperCase()} PHASE
          </span>
        </div>

        <div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 mb-4 text-[11px] font-bold tracking-wide text-slate-500 hover:text-slate-900 uppercase transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>

          <div className="flex items-start justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                {project.name}
              </h1>
              <p className="text-lg leading-relaxed text-slate-500 font-medium max-w-2xl">
                {project.description}
              </p>
            </div>

            {/* Circular Progress Big */}
            <div className="flex items-center justify-center rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 shrink-0">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full rotate-[120deg]" viewBox="0 0 36 36">
                  <path
                    className="stroke-slate-100"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`transition-colors duration-1000 ${progressStrokeClass}`}
                    strokeWidth="3"
                    strokeDasharray={`${completionPercentage}, 100`}
                    fill="none"
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
                    {completionPercentage}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                    Complete
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex flex-col gap-6 mt-4">
        <div className="flex gap-6 items-stretch">
          <div className="flex-1 flex min-w-0">
            <DevelopmentTimeline projectId={project.id} projectName={project.name} />
          </div>
          <ToDoList projectId={project.id} />
        </div>
        
        <SalesPerformanceTracking projectId={project.id} />
      </div>
    </div>
  );
}
