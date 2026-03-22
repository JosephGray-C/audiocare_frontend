import { useState, useEffect } from "react";
import { X, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import { changePassword } from "../../services/adminService";
import LoadingButton from "../ui/LoadingButton";

const INITIAL_FORM = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

export default function ChangePasswordModal({ open, onClose }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { auth } = useAuth();
    const { showAlert } = useAlert();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!open) {
            setFormData(INITIAL_FORM);
            setErrors({});
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
        }
    }, [open]);

    // Close on Escape
    useEffect(() => {
        function handleKey(e) {
            if (e.key === "Escape") onClose();
        }
        if (open) {
            document.addEventListener("keydown", handleKey);
            return () => document.removeEventListener("keydown", handleKey);
        }
    }, [open, onClose]);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function validate() {
        const newErrors = {};

        if (!formData.currentPassword.trim()) {
            newErrors.currentPassword = "La contraseña actual es obligatoria";
        }

        if (!formData.newPassword.trim()) {
            newErrors.newPassword = "La nueva contraseña es obligatoria";
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = "Debe tener al menos 8 caracteres";
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = "Confirme la nueva contraseña";
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden";
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);
            await changePassword(auth.adminId, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });
            showAlert("Contraseña actualizada correctamente", "success");
            onClose();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <ShieldCheck size={18} className="text-[#ef7d2d]" />
                        <h3 className="text-lg font-semibold text-slate-800">
                            Cambiar contraseña
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Current password */}
                    <PasswordField
                        name="currentPassword"
                        label="Contraseña actual"
                        placeholder="Ingrese su contraseña actual"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        error={errors.currentPassword}
                        show={showCurrent}
                        onToggle={() => setShowCurrent(prev => !prev)}
                    />

                    <div className="border-t border-slate-100" />

                    {/* New password */}
                    <PasswordField
                        name="newPassword"
                        label="Nueva contraseña"
                        placeholder="Mínimo 8 caracteres"
                        value={formData.newPassword}
                        onChange={handleChange}
                        error={errors.newPassword}
                        show={showNew}
                        onToggle={() => setShowNew(prev => !prev)}
                    />

                    {/* Confirm password */}
                    <PasswordField
                        name="confirmPassword"
                        label="Confirmar contraseña"
                        placeholder="Repita la nueva contraseña"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        show={showConfirm}
                        onToggle={() => setShowConfirm(prev => !prev)}
                    />
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-300 bg-white px-6 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <LoadingButton
                        type="submit"
                        onClick={handleSubmit}
                        loading={loading}
                    >
                        Guardar
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}

// ── Reusable password input ──────────────────────────────────────────────

function PasswordField({ name, label, placeholder, value, onChange, error, show, onToggle }) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={name} className="block text-sm font-medium text-slate-600">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={15} className={error ? "text-red-400" : "text-slate-400"} />
                </div>
                <input
                    id={name}
                    name={name}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`
                        w-full pl-10 pr-11 py-2.5 rounded-xl
                        border text-sm text-slate-700
                        placeholder:text-slate-300
                        outline-none transition-colors
                        ${error
                        ? "border-red-300 focus:border-red-400 bg-red-50/40"
                        : "border-slate-200 focus:border-[#34c3d6] bg-white"
                    }
                    `}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}