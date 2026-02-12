import { ReactNode, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
  icon?: ReactNode;
  variant?: 'destructive' | 'warning';
}

const ConfirmDialog = ({
  open, onClose, onConfirm,
  title, description,
  confirmLabel = 'Supprimer',
  loadingLabel,
  loading = false,
  icon,
  variant = 'destructive',
}: ConfirmDialogProps) => {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            variant === 'warning' ? 'bg-amber-500/15 border border-amber-500/20' : 'bg-red-500/15 border border-red-500/20'
          }`}>
            {icon || <AlertTriangle className={`w-6 h-6 ${variant === 'warning' ? 'text-amber-400' : 'text-red-400'}`} />}
          </div>
          <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
          {description && (
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">{description}</p>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 text-xs font-semibold rounded-xl hover:bg-gray-700 transition-all border border-gray-700 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 ${
              variant === 'warning'
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
            }`}
          >
            {loading ? (loadingLabel || 'Suppression...') : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
