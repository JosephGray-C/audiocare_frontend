import { useState, useEffect } from "react";
import { X, Package, Barcode, Euro, DollarSign } from "lucide-react";
import { formatCRC, convertCRCToEuro, convertCRCToUSD, formatConvertedCurrency } from "../../utils/currency";
import LoadingButton from "../ui/LoadingButton";

const INITIAL_FORM = {
    modelCode: "",
    name: "",
    priceSale: "",
    costFabricCrc: "",
};

export default function ModelProductModal({ open, onClose, onSubmit, loading = false, model = null }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});

    const isEdit = !!model;

    // Populate form when editing
    useEffect(() => {
        if (open && model) {
            setFormData({
                modelCode: String(model.modelCode || ""),
                name: model.name || "",
                priceSale: String(model.priceSale || ""),
                costFabricCrc: String(model.costFabricCrc || ""),
            });
        } else if (open) {
            setFormData(INITIAL_FORM);
        }
        setErrors({});
    }, [open, model]);

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

    // ── Derived values ───────────────────────────────────────────────────

    const formattedPriceSale = formatCRC(formData.priceSale);
    const formattedCostFabricCrc = formatCRC(formData.costFabricCrc);
    const formattedCostFabricEur = formData.costFabricCrc
        ? formatConvertedCurrency(convertCRCToEuro(formData.costFabricCrc))
        : "0.00";
    const euros = formData.priceSale
        ? formatConvertedCurrency(convertCRCToEuro(formData.priceSale))
        : "0.00";
    const usd = formData.priceSale
        ? formatConvertedCurrency(convertCRCToUSD(formData.priceSale))
        : "0.00";

    // ── Handlers ─────────────────────────────────────────────────────────

    function handlePositiveIntegerChange(e) {
        const { name, value } = e.target;
        const sanitized = value.replace(/\D/g, "");
        setFormData(prev => ({ ...prev, [name]: sanitized }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function validate() {
        const newErrors = {};

        if (!formData.modelCode) {
            newErrors.modelCode = "El código del modelo es obligatorio";
        } else if (!/^\d+$/.test(formData.modelCode)) {
            newErrors.modelCode = "El código debe ser un número entero";
        } else if (Number(formData.modelCode) <= 0) {
            newErrors.modelCode = "El código debe ser un entero positivo";
        }

        if (!formData.name.trim()) {
            newErrors.name = "El nombre es obligatorio";
        }

        if (!formData.costFabricCrc) {
            newErrors.costFabricCrc = "El precio de fábrica es obligatorio";
        } else if (Number(formData.costFabricCrc) <= 0) {
            newErrors.costFabricCrc = "Debe ser un número positivo";
        }

        if (!formData.priceSale) {
            newErrors.priceSale = "El precio de venta es obligatorio";
        } else if (Number(formData.priceSale) <= 0) {
            newErrors.priceSale = "Debe ser un número positivo";
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

        const payload = {
            ...formData,
            costFabricEur: convertCRCToEuro(formData.costFabricCrc),
        };

        onSubmit(payload);
    }

    // ── Reusable field renderer ──────────────────────────────────────────

    function renderField({ name, label, icon: Icon, prefix, value, onChange, placeholder, disabled = false }) {
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
                        : disabled
                            ? "border-slate-200 bg-slate-50"
                            : "border-slate-200 bg-white focus-within:border-[#34c3d6]"
                    }
                    `}
                >
                    {Icon && <Icon size={15} className={`mr-2.5 shrink-0 ${errors[name] ? "text-red-400" : "text-slate-400"}`} />}
                    {prefix && <span className={`mr-2 shrink-0 text-sm ${errors[name] ? "text-red-400" : "text-slate-400"}`}>{prefix}</span>}
                    <input
                        id={name}
                        name={name}
                        type="text"
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        placeholder={placeholder}
                        className="w-full min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-300 outline-none disabled:text-slate-500"
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
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={loading ? undefined : onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <Package size={18} className="text-[#ef7d2d]" />
                        <h3 className="text-lg font-semibold text-slate-800">
                            {isEdit ? "Editar Modelo" : "Nuevo Modelo"}
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
                <form id="modelForm" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {renderField({
                        name: "modelCode",
                        label: "Código Modelo",
                        icon: Barcode,
                        value: formData.modelCode,
                        onChange: handlePositiveIntegerChange,
                        placeholder: "Ej: 1001",
                    })}

                    {renderField({
                        name: "name",
                        label: "Nombre",
                        icon: Package,
                        value: formData.name,
                        onChange: handleChange,
                        placeholder: "Nombre del modelo",
                    })}

                    {renderField({
                        name: "costFabricCrc",
                        label: "Precio Fábrica (₡)",
                        prefix: "₡",
                        value: formattedCostFabricCrc,
                        onChange: handlePositiveIntegerChange,
                        placeholder: "Colones",
                    })}

                    {renderField({
                        name: "costFabricEur",
                        label: "Precio Fábrica (€)",
                        icon: Euro,
                        value: formattedCostFabricEur,
                        onChange: () => {},
                        placeholder: "Calculado automáticamente",
                        disabled: true,
                    })}

                    {renderField({
                        name: "priceSale",
                        label: "Precio Venta (₡)",
                        prefix: "₡",
                        value: formattedPriceSale,
                        onChange: handlePositiveIntegerChange,
                        placeholder: "Colones",
                    })}

                    {/* Currency conversions */}
                    <div className="flex items-center gap-5 rounded-xl px-4 py-2.5 border bg-slate-50 border-slate-200 w-fit">
                        <div className="flex items-center">
                            <Euro size={14} className="text-slate-400 mr-1.5 shrink-0" />
                            <span className="text-sm text-slate-600 tabular-nums">{euros}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200 shrink-0" />
                        <div className="flex items-center">
                            <DollarSign size={14} className="text-slate-400 mr-1.5 shrink-0" />
                            <span className="text-sm text-slate-600 tabular-nums">{usd}</span>
                        </div>
                    </div>
                </form>

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
                        type="submit"
                        form="modelForm"
                        loading={loading}
                    >
                        {isEdit ? "Actualizar" : "Guardar"}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}