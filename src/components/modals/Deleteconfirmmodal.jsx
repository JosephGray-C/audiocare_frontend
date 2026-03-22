import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import LoadingButton from "../ui/LoadingButton";

export default function DeleteConfirmModal({ open, onClose, onConfirm, loading = false, title = "Confirmar eliminación", message }) {
    // Close on Escape
    useEffect(() => {
        function handleKey(e) {
            if (e.key === "Escape" && !loading) onClose();
        }
        if (open) {
            document.addEventListener("keydown", handleKey);
            return () => document.removeEventListener("keydown", handleKey);
        }
    }, [open, onClose, loading]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={loading ? undefined : onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <AlertTriangle size={18} className="text-red-500" />
                        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {message || "¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer."}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl border border-slate-300 bg-white px-6 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <LoadingButton
                        onClick={onConfirm}
                        loading={loading}
                        className="!bg-red-500 hover:!bg-red-600"
                    >
                        Eliminar
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}