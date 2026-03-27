"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: { name: string; description: string; status: string }) => void;
}

export function NewProjectModal({ isOpen, onClose, onSave }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description, status });
    setName("");
    setDescription("");
    setStatus("ACTIVE");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div 
        className="flex w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl ring-1 ring-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Initialize New Project</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Create a new workspace track for sponsorships.</p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2.5">
            <label htmlFor="name" className="text-sm font-bold tracking-wide text-slate-700">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input 
              id="name"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Danone" 
              required
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-2.5">
            <label htmlFor="description" className="text-sm font-bold tracking-wide text-slate-700">Description</label>
            <textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of the project scope and goals..." 
              rows={4}
              className="resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all leading-relaxed"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="status" className="text-sm font-bold tracking-wide text-slate-700">Initial Status</label>
            <div className="relative">
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="REVIEW">REVIEW</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="rounded-xl px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100/80 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              Initialize Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
