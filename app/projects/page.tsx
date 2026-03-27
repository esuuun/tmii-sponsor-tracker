"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectCard, NewProjectCard } from "@/components/ProjectCard";
import { NewProjectModal } from "@/components/NewProjectModal";
import { useProjects, useCreateProject } from "@/hooks/useProjects";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";

export default function ProjectsOverview() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: projects = [], isLoading, isError, refetch } = useProjects();
  const { mutate: createProject, isPending } = useCreateProject();

  const handleCreateProject = (newProjData: { name: string; description: string; status: string }) => {
    createProject(newProjData, {
      onSuccess: () => setIsModalOpen(false)
    });
  };

  // Calculate progress derived from the nested `project_todos` array attached to the DB objects
  const getProgress = (project: any) => {
    const todos = project.project_todos || [];
    if (todos.length === 0) return 0;
    
    const completed = todos.filter((t: any) => t.is_completed).length;
    return Math.round((completed / todos.length) * 100);
  };

  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() ?? "";
  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query)));

  return (
    <div className="flex flex-col gap-8 p-10 max-w-7xl mx-auto relative">
      <div className="space-y-3">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Projects Overview
        </h1>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center rounded bg-slate-200/70 px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-600">
            ACTIVE PORTFOLIOS
          </span>
        </div>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="h-screen p-10 max-w-7xl mx-auto justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project: any) => (
            <ProjectCard key={project.id} {...project} description={project.description || ""} progress_percentage={getProgress(project)} />
          ))}
          {filteredProjects.length === 0 && query && (
            <div className="col-span-full h-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200">
               <span className="text-slate-500 font-medium">No projects found matching "{query}"</span>
            </div>
          )}
          <NewProjectCard onClick={() => setIsModalOpen(true)} />
        </div>
      )}

      <NewProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleCreateProject}
      />
    </div>
  );
}
