import { useState, useEffect } from "react";
import { X, Users, IdCard, Mail, Phone, User } from "lucide-react";
import LoadingButton from "../ui/LoadingButton";

const INITIAL_FORM = {
    identityNumber: "",
    name: "",
    lastName1: "",
    lastName2: "",
    type: "PRIVATE",
    email: "",
    phone: "",
};

export default function ClientModal({ open, onClose, onSubmit, loading = false, client = null }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [originalData, setOriginalData] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});

    const isEdit = !!client;

    // Populate form
    useEffect(() => {
        if (open && client) {
            const populated = {
                identityNumber: client.identityNumber || "",
                name: client.name || "",
                lastName1: client.lastName1 || "",
                lastName2: client.lastName2 || "",
                type: client.type || "PRIVATE",
                email: client.email || "",
                phone: client.phone || "",
            };
            setFormData(populated);
            setOriginalData(populated);
        } else if (open) {
            setFormData(INITIAL_FORM);
            setOriginalData(INITIAL_FORM);
        }
        setErrors({});
    }, [open, client]);

    // Detect changes
    const hasChanges = !isEdit || JSON.stringify(formData) !== JSON.stringify(originalData);

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

    // ── Handlers ─────────────────────────────────────────────────────────

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function validate() {
        const newErrors = {};

        if (!formData.identityNumber.trim()) {
            newErrors.identityNumber = "El número de identidad es obligatorio";
        }

        if (!formData.name.trim()) {
            newErrors.name = "El nombre es obligatorio";
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Formato de correo inválido";
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

        onSubmit({
            identityNumber: formData.identityNumber.trim(),
            name: formData.name.trim(),
            lastName1: formData.lastName1.trim() || null,
            lastName2: formData.lastName2.trim() || null,
            type: formData.type,
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
        });
    }

    // ── Field renderer ───────────────────────────────────────────────────

    function renderField({ name, label, icon: Icon, value, onChange, placeholder, type = "text" }) {
        return (
            <div className="space-y-1.5">
                <label htmlFor={name} className="block text-sm font-medium text-slate-600">
                    {label}
                </label>
                <div
                    className={`
                        flex items-center w-full rounded-xl border px-3.5 py-2.5 transition-colors
                        ${errors[name]
                        ? "border-red-300 bg-red-50/40"
                        : "border-slate-200 bg-white focus-within:border-[#34c3d6]"
                    }
                    `}
                >
                    {Icon && <Icon size={15} className={`mr-2.5 shrink-0 ${errors[name] ? "text-red-400" : "text-slate-400"}`} />}
                    <input
                        id={name}
                        name={name}
                        type={type}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className="w-full min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-300 outline-none"
                    />
                </div>
                {errors[name] && (
                    <p className="text-xs text-red-500">{errors[name]}</p>
                )}
            </div>
        );
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={loading ? undefined : onClose}
            />

            <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Users size={18} className="text-[#ef7d2d]" />
                        <h3 className="text-lg font-semibold text-slate-800">
                            {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form id="clientForm" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
                    {/* Type toggle */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-600">Tipo de cliente</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, type: "PRIVATE" }));
                                    setErrors(prev => ({ ...prev, type: null }));
                                }}
                                className={`
                                    flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors
                                    ${formData.type === "PRIVATE"
                                    ? "bg-[#34c3d6]/10 border-[#34c3d6] text-[#34c3d6]"
                                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                                }
                                `}
                            >
                                Privado
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, type: "DISTRIBUTOR" }));
                                    setErrors(prev => ({ ...prev, type: null }));
                                }}
                                className={`
                                    flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors
                                    ${formData.type === "DISTRIBUTOR"
                                    ? "bg-[#ef7d2d]/10 border-[#ef7d2d] text-[#ef7d2d]"
                                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                                }
                                `}
                            >
                                Distribuidor
                            </button>
                        </div>
                    </div>

                    {renderField({
                        name: "identityNumber",
                        label: formData.type === "PRIVATE" ? "Cédula física" : "Cédula jurídica",
                        icon: IdCard,
                        value: formData.identityNumber,
                        onChange: handleChange,
                        placeholder: formData.type === "PRIVATE" ? "Ej: 123456789" : "Ej: 3101234567",
                    })}

                    {renderField({
                        name: "name",
                        label: formData.type === "PRIVATE" ? "Nombre" : "Razón social",
                        icon: User,
                        value: formData.name,
                        onChange: handleChange,
                        placeholder: formData.type === "PRIVATE" ? "Nombre del cliente" : "Nombre de la empresa",
                    })}

                    {/* Last names — only relevant for PRIVATE */}
                    {formData.type === "PRIVATE" && (
                        <div className="grid grid-cols-2 gap-3">
                            {renderField({
                                name: "lastName1",
                                label: "Primer apellido",
                                value: formData.lastName1,
                                onChange: handleChange,
                                placeholder: "Apellido 1",
                            })}
                            {renderField({
                                name: "lastName2",
                                label: "Segundo apellido",
                                value: formData.lastName2,
                                onChange: handleChange,
                                placeholder: "Apellido 2",
                            })}
                        </div>
                    )}

                    {/* Separator */}
                    <div className="flex items-center gap-3 pt-1">
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Contacto (opcional)</span>
                        <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    {renderField({
                        name: "email",
                        label: "Correo electrónico",
                        icon: Mail,
                        type: "email",
                        value: formData.email,
                        onChange: handleChange,
                        placeholder: "correo@ejemplo.com",
                    })}

                    {renderField({
                        name: "phone",
                        label: "Teléfono",
                        icon: Phone,
                        value: formData.phone,
                        onChange: handleChange,
                        placeholder: "Ej: 8888-0000",
                    })}
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl border border-slate-300 bg-white px-6 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <LoadingButton
                        type="submit"
                        form="clientForm"
                        loading={loading}
                        disabled={!hasChanges}
                    >
                        {isEdit ? "Actualizar" : "Guardar"}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}