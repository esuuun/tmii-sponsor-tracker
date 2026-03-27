"use client";

import Link from "next/link";
import { Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { EditProjectModal } from "./EditProjectModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  progress_percentage: number;
  status?: string;
  isAdmin?: boolean;
}

export function ProjectCard({ id, name, description, progress_percentage, status = "ACTIVE", isAdmin = false }: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = (data: { name: string; description: string; status: string }) => {
    updateProject({ id, ...data }, {
      onSuccess: () => setIsEditModalOpen(false)
    });
  };

  const handleDelete = () => {
    deleteProject(id, {
      onSuccess: () => setIsDeleteModalOpen(false)
    });
  };

  const completionPercentage = progress_percentage;

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return { bg: 'bg-red-50/50', outline: 'outline-red-100', text: 'text-red-600', strokeHex: '#ef4444' };
    if (percentage < 70) return { bg: 'bg-amber-50/50', outline: 'outline-amber-100', text: 'text-amber-600', strokeHex: '#f59e0b' };
    if (percentage < 100) return { bg: 'bg-blue-50/50', outline: 'outline-blue-100', text: 'text-blue-600', strokeHex: '#3b82f6' };
    return { bg: 'bg-emerald-50/50', outline: 'outline-emerald-100', text: 'text-emerald-500', strokeHex: '#10b981' };
  };

  const pColor = getProgressColor(completionPercentage);

  return (
    <>
      <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 h-80 transition-shadow hover:shadow-md relative group">

        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-slate-900 leading-tight w-[60%] pr-2">
            {name}
          </h3>
          
          <div className="flex items-start gap-3 relative">
          <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${pColor.bg} outline outline-1 ${pColor.outline} shadow-inner transition-colors`}>
            <span className={`text-xl font-bold tracking-tight ${pColor.text}`}>{completionPercentage}%</span>
            <svg className="absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="50" cy="50" r="46" fill="none" stroke={pColor.strokeHex} strokeWidth="8" strokeDasharray="289" strokeDashoffset={289 - (289 * completionPercentage) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
          </div>
          
          {isAdmin && (
            <div className="relative z-10" ref={dropdownRef}>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
                aria-label="More options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              
              {isMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden divide-y divide-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); setIsEditModalOpen(true); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="h-4 w-4 text-blue-500" /> Edit
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); setIsDeleteModalOpen(true); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
        
        <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-500 line-clamp-4">
          {description}
        </p>

        <Link
          href={`/projects/${id}`}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-blue-100/50 py-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100"
        >
          View Details
        </Link>
      </div>

      <EditProjectModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleEdit} 
        initialData={{ name, description, status }} 
        isPending={isUpdating} 
      />

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDelete} 
        isPending={isDeleting} 
        projectName={name} 
      />
    </>
  );
}

interface NewProjectCardProps {
  onClick?: () => void;
}

export function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 h-80 transition-colors hover:bg-slate-50 hover:border-blue-300 group">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200/60 mb-4 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
        <Plus className="h-6 w-6" />
      </div>
      <span className="text-lg font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">Initialize New Project</span>
    </button>
  );
}
