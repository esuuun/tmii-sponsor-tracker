import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-5 bg-red-50 rounded-3xl border border-red-100">
      <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <div className="text-center">
        <h3 className="text-base font-bold text-red-700 mb-1">Gagal Memuat Data</h3>
        <p className="text-sm text-red-500 font-medium max-w-xs">
          {message ?? "Tidak dapat terhubung ke server. Periksa koneksi atau coba lagi."}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}
