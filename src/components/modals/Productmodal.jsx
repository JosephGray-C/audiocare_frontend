import { useState, useEffect } from "react";
import { X, Hash, Package, Truck, Calendar } from "lucide-react";
import { getModelProducts } from "../../services/modelProductService";
import { getSupplierOrders } from "../../services/supplierOrderService";
import SearchableSelect from "../ui/SearchableSelect";
import LoadingButton from "../ui/LoadingButton";
import RenderField from "../form/RenderField";

const INITIAL_FORM = {
    serialNum: "",
    modelId: null,
    supplierOrderId: null,
    entryDate: "",
};

export default function ProductModal({ open, onClose, onSubmit, loading = false, product = null }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});

    // Dropdown options
    const [modelOptions, setModelOptions] = useState([]);
    const [supplierOrderOptions, setSupplierOrderOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const isEdit = !!product;

    // Load dropdown options when modal opens
    useEffect(() => {
        if (!open) return;

        async function loadOptions() {
            setLoadingOptions(true);
            try {
                const [models, orders] = await Promise.all([
                    getModelProducts(),
                    getSupplierOrders(),
                ]);

                setModelOptions(
                    models.map(m => ({
                        value: m.id,
                        label: `${m.name}`,
                        sublabel: `Código: ${m.modelCode} · ₡${Number(m.priceSale).toLocaleString("es-CR")}`,
                    }))
                );

                setSupplierOrderOptions(
                    orders.map(o => ({
                        value: o.id,
                        label: o.name,
                        sublabel: `Recibido: ${formatDate(o.receivedDate)} · ₡${Number(o.totalAmountCrc).toLocaleString("es-CR")}`,
                    }))
                );
            } catch {
                // Options failed to load — dropdowns will be empty
            } finally {
                setLoadingOptions(false);
            }
        }

        loadOptions();
    }, [open]);

    // Populate form when editing
    useEffect(() => {
        if (open && product) {
            setFormData({
                serialNum: product.serialNum || "",
                modelId: product.model?.id ?? null,
                supplierOrderId: product.supplierOrder?.id ?? null,
                entryDate: product.entryDate || "",
            });
        } else if (open) {
            setFormData(INITIAL_FORM);
        }
        setErrors({});
    }, [open, product]);

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

    function handleSelectChange(name, value) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function validate() {
        const newErrors = {};

        if (!formData.serialNum.trim()) {
            newErrors.serialNum = "El número de serie es obligatorio";
        }

        if (!formData.modelId) {
            newErrors.modelId = "Debe seleccionar un modelo";
        }

        if (!formData.supplierOrderId) {
            newErrors.supplierOrderId = "Debe seleccionar un pedido del proveedor";
        }

        if (!formData.entryDate) {
            newErrors.entryDate = "La fecha de ingreso es obligatoria";
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
            serialNum: formData.serialNum.trim(),
            modelId: formData.modelId,
            supplierOrderId: formData.supplierOrderId,
            entryDate: formData.entryDate,
        });
    }

    function renderSelectField({ name, label, icon, options, placeholder, searchPlaceholder }) {
        return (
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">
                    {label}
                </label>
                <SearchableSelect
                    options={options}
                    value={formData[name]}
                    onChange={val => handleSelectChange(name, val)}
                    placeholder={loadingOptions ? "Cargando..." : placeholder}
                    searchPlaceholder={searchPlaceholder}
                    icon={icon}
                    error={errors[name]}
                    disabled={loadingOptions}
                />
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
            <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Hash size={18} className="text-[#ef7d2d]" />
                        <h3 className="text-lg font-semibold text-slate-800">
                            {isEdit ? "Editar Producto" : "Nuevo Producto"}
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
                <form id="productForm" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
                    <RenderField
                        name="serialNum"
                        label="Número de Serie"
                        icon={Hash}
                        value={formData.serialNum}
                        onChange={handleChange}
                        error={errors.serialNum}
                        placeholder="Ej: SER-001-2026"
                    />

                    {renderSelectField({
                        name: "modelId",
                        label: "Modelo de Producto",
                        icon: Package,
                        options: modelOptions,
                        placeholder: "Seleccione un modelo",
                        searchPlaceholder: "Buscar por nombre o código...",
                    })}

                    {renderSelectField({
                        name: "supplierOrderId",
                        label: "Pedido del Proveedor",
                        icon: Truck,
                        options: supplierOrderOptions,
                        placeholder: "Seleccione un pedido",
                        searchPlaceholder: "Buscar por nombre...",
                    })}

                    <RenderField
                        name="entryDate"
                        label="Fecha de Ingreso"
                        icon={Calendar}
                        type="date"
                        value={formData.entryDate}
                        onChange={handleChange}
                        error={errors.entryDate}
                        placeholder="Seleccione fecha"
                    />

                    {/* Info note */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            El producto se registrará con estado <span className="font-semibold text-emerald-600">DISPONIBLE</span> y
                            se generará un movimiento de inventario automáticamente.
                        </p>
                    </div>
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
                        form="productForm"
                        loading={loading}
                    >
                        {isEdit ? "Actualizar" : "Guardar"}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}

// ── Helper ───────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
}
