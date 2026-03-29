import { useState, useEffect } from "react";
import { X, ShieldCheck, User, IdCard, Mail, Lock, Eye, EyeOff } from "lucide-react";
import LoadingButton from "../ui/LoadingButton";

const INITIAL_FORM = {
    identityNumber: "",
    name: "",
    lastName1: "",
    lastName2: "",
    email: "",
    password: "",
    isMaster: false,
};

export default function AdminModal({ open, onClose, onSubmit, loading = false, admin = null }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [originalData, setOriginalData] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const isEdit = !!admin;

    useEffect(() => {
        if (open && admin) {
            const populated = {
                identityNumber: admin.identityNumber || "",
                name: admin.name || "",
                lastName1: admin.lastName1 || "",
                lastName2: admin.lastName2 || "",
                email: admin.email || "",
                password: "",
                isMaster: admin.isMaster || false,
            };
            setFormData(populated);
            setOriginalData(populated);
        } else if (open) {
            setFormData(INITIAL_FORM);
            setOriginalData(INITIAL_FORM);
        }
        setErrors({});
        setShowPassword(false);
    }, [open, admin]);

    const hasChanges = !isEdit || JSON.stringify(formData) !== JSON.stringify(originalData);

    useEffect(() => {
        function handleKey(e) {
            if (e.key === "Escape" && !loading) onClose();
        }
        if (open) {
            document.addEventListener("keydown", handleKey);
            return () => document.removeEventListener("keydown", handleKey);
        }
    }, [open, onClose, loading]);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function validate() {
        const newErrors = {};
        if (!formData.identityNumber.trim()) newErrors.identityNumber = "Obligatorio";
        if (!formData.name.trim()) newErrors.name = "Obligatorio";
        if (!formData.lastName1.trim()) newErrors.lastName1 = "Obligatorio";
        if (!formData.lastName2.trim()) newErrors.lastName2 = "Obligatorio";
        if (!formData.email.trim()) {
            newErrors.email = "Obligatorio";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Formato inválido";
        }
        if (!isEdit && !formData.password.trim()) {
            newErrors.password = "Obligatoria al crear";
        } else if (formData.password && formData.password.length < 8) {
            newErrors.password = "Mínimo 8 caracteres";
        }
        return newErrors;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        const payload = { ...formData };
        if (isEdit && !payload.password) delete payload.password;
        onSubmit(payload);
    }

    function renderField({ name, label, icon: Icon, type = "text", placeholder }) {
        const isPass = type === "password";
        const inputType = isPass ? (showPassword ? "text" : "password") : type;

        return (
            <div className="space-y-1.5">
                <label htmlFor={name} className="block text-sm font-medium text-slate-600">{label}</label>
                <div className={`flex items-center w-full rounded-xl border px-3.5 py-2.5 transition-colors ${errors[name] ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white focus-within:border-[#34c3d6]"}`}>
                    {Icon && <Icon size={15} className={`mr-2.5 shrink-0 ${errors[name] ? "text-red-400" : "text-slate-400"}`} />}
                    <input
                        id={name} name={name} type={inputType}
                        value={formData[name]} onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-300 outline-none"
                    />
                    {isPass && (
                        <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1} className="ml-2 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    )}
                </div>
                {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
            </div>
        );
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
            <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <ShieldCheck size={18} className="text-[#ef7d2d]" />
                        <h3 className="text-lg font-semibold text-slate-800">{isEdit ? "Editar Admin" : "Nuevo Admin"}</h3>
                    </div>
                    <button onClick={onClose} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50">
                        <X size={16} />
                    </button>
                </div>

                <form id="adminForm" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
                    {renderField({ name: "identityNumber", label: "Número de identidad", icon: IdCard, placeholder: "Ej: 123456789" })}
                    {renderField({ name: "name", label: "Nombre", icon: User, placeholder: "Nombre" })}
                    <div className="grid grid-cols-2 gap-3">
                        {renderField({ name: "lastName1", label: "Primer apellido", placeholder: "Apellido 1" })}
                        {renderField({ name: "lastName2", label: "Segundo apellido", placeholder: "Apellido 2" })}
                    </div>
                    {renderField({ name: "email", label: "Correo electrónico", icon: Mail, type: "email", placeholder: "admin@audiocare.com" })}
                    {renderField({
                        name: "password",
                        label: isEdit ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña",
                        icon: Lock, type: "password",
                        placeholder: isEdit ? "••••••••" : "Mínimo 8 caracteres"
                    })}
                </form>

                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
                    <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-300 bg-white px-6 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50">
                        Cancelar
                    </button>
                    <LoadingButton type="submit" form="adminForm" loading={loading} disabled={!hasChanges}>
                        {isEdit ? "Actualizar" : "Crear Admin"}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}