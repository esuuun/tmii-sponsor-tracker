"use client";

import { use } from "react";
import { useProjects } from "@/hooks/useProjects";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SalesPerformanceTracking } from "@/components/SalesPerformanceTracking";

export default function ProjectTrackingPage({
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
      {/* Top Nav */}
      <div className="px-8 py-4 flex items-center shrink-0 z-20">
        <Link
          href="/tracking"
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tracking
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">
            {currentProject?.name || "Loading..."}
          </span>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 p-6 sm:p-10 overflow-hidden flex flex-col w-full h-full animate-in fade-in duration-300">
        <SalesPerformanceTracking
          projectId={projectId}
          isFullScreen={true}
          projectName={currentProject?.name}
        />
      </div>
    </div>
  );
}
