import { AlertTriangle, Loader2, X } from "lucide-react";

export function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isPending,
  projectName
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  isPending: boolean;
  projectName: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-md flex-col rounded-3xl bg-white shadow-2xl ring-1 ring-slate-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Delete Project</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-600 text-[15px] leading-relaxed">
            Are you absolutely sure you want to delete <span className="font-bold text-slate-900">"{projectName}"</span>? This action cannot be undone and will permanently erase all associated timelines, to-do lists, and sales matrices within this project.
          </p>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded-xl px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100/80 transition-colors">
              Cancel
            </button>
            <button 
              type="button" 
              onClick={onConfirm} 
              disabled={isPending} 
              className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-sm shadow-red-600/20 transition-all hover:shadow-md disabled:bg-red-400 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
