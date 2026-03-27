import { useState } from "react";
import { X, Loader2 } from "lucide-react";

export function EditProjectModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  isPending 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: { name: string; description: string; status: string }) => void;
  initialData: { name: string; description: string; status: string };
  isPending: boolean;
}) {
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [status, setStatus] = useState(initialData.status);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description, status });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl ring-1 ring-slate-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Project</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Update the details of your project below.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2.5">
            <label htmlFor="editName" className="text-sm font-bold tracking-wide text-slate-700">Project Name <span className="text-red-500">*</span></label>
            <input 
              id="editName"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="editDesc" className="text-sm font-bold tracking-wide text-slate-700">Description</label>
            <textarea 
              id="editDesc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="editStatus" className="text-sm font-bold tracking-wide text-slate-700">Phase Status</label>
            <select 
              id="editStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="IDLE">IDLE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div className="mt-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded-xl px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100/80 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all hover:shadow-md disabled:bg-blue-400 flex items-center gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
