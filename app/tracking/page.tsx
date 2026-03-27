"use client";

import { useProjects } from "@/hooks/useProjects";
import { Loader2, Folders, ChevronRight, Activity } from "lucide-react";
import Link from "next/link";
import { Project } from "@/types/database";
import { ErrorState } from "@/components/ErrorState";

export default function TrackingIndexPage() {
  const { data: projects = [], isLoading, isError, refetch } = useProjects();

  return (
    <div className="min-h-screen  p-8 sm:p-12 flex flex-col">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-xl transform -rotate-3 hover:rotate-0 transition-transform">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-2">
              Sales Tracking
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Project Sales Matrix
            </p>
          </div>
        </div>

        <p className="text-slate-500 font-medium text-lg max-w-2xl mb-12">
          Select a project below to view and manage its monthly sales
          performance data across all tracked items.
        </p>

        {/* Project Grid */}
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-60 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Loading Portfolios
            </span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center bg-white rounded-3xl border border-slate-100 shadow-sm py-32 px-10">
            <Folders className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              No Projects Found
            </h3>
            <p className="text-slate-500 font-medium">
              There are no active projects to display.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: Project) => (
              <Link
                key={project.id}
                href={`/tracking/${project.id}`}
                className="group flex flex-col justify-between bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-widest ${
                        project.status?.toUpperCase() === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 outline outline-1 outline-emerald-200/50"
                          : "bg-slate-100 text-slate-500 outline outline-1 outline-slate-200"
                      }`}
                    >
                      {project.status || "LOGGED"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium line-clamp-2">
                    {project.description ||
                      "No description available for this project."}
                  </p>
                </div>

                <div className="mt-8 flex items-center text-sm font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                  Open Sales Matrix{" "}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
