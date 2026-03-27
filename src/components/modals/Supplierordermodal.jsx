import { useState, useEffect } from "react";
import { X, Truck, Calendar, Euro, ShieldCheck } from "lucide-react";
import { formatCRC, convertCRCToEuro, formatConvertedCurrency } from "../../utils/currency";
import LoadingButton from "../ui/LoadingButton";
import RenderField from "../form/RenderField";

const INITIAL_FORM = {
    name: "",
    receivedDate: "",
    totalAmountCrc: "",
    totalAmountEur: "",
    insuranceCrc: "",
    insuranceEur: "",
};

export default function SupplierOrderModal({ open, onClose, onSubmit, loading = false, order = null }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});

    const isEdit = !!order;

    // Populate form when editing
    useEffect(() => {
        if (open && order) {
            setFormData({
                name: order.name || "",
                receivedDate: order.receivedDate || "",
                totalAmountCrc: String(Math.round(Number(order.totalAmountCrc || 0))),
                totalAmountEur: String(order.totalAmountEur || ""),
                insuranceCrc: String(Math.round(Number(order.insuranceCrc || 0))),
                insuranceEur: String(order.insuranceEur || ""),
            });
        } else if (open) {
            setFormData(INITIAL_FORM);
        }
        setErrors({});
    }, [open, order]);

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

    const formattedTotalCrc = formatCRC(formData.totalAmountCrc);
    const computedTotalEur = formData.totalAmountCrc
        ? formatConvertedCurrency(convertCRCToEuro(formData.totalAmountCrc))
        : "0.00";

    const formattedInsuranceCrc = formatCRC(formData.insuranceCrc);
    const computedInsuranceEur = formData.insuranceCrc
        ? formatConvertedCurrency(convertCRCToEuro(formData.insuranceCrc))
        : "0.00";

    // ── Handlers ─────────────────────────────────────────────────────────

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function handlePositiveIntegerChange(e) {
        const { name, value } = e.target;
        const sanitized = value.replace(/\D/g, "");
        setFormData(prev => ({ ...prev, [name]: sanitized }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function validate() {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "El nombre del pedido es obligatorio";
        }

        if (!formData.receivedDate) {
            newErrors.receivedDate = "La fecha de recepción es obligatoria";
        }

        if (!formData.totalAmountCrc) {
            newErrors.totalAmountCrc = "El monto total es obligatorio";
        } else if (Number(formData.totalAmountCrc) <= 0) {
            newErrors.totalAmountCrc = "Debe ser mayor a 0";
        }

        // Insurance is optional but can't be negative
        if (formData.insuranceCrc && Number(formData.insuranceCrc) < 0) {
            newErrors.insuranceCrc = "No puede ser negativo";
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
            name: formData.name,
            receivedDate: formData.receivedDate,
            totalAmountCrc: Number(formData.totalAmountCrc),
            totalAmountEur: Number(convertCRCToEuro(formData.totalAmountCrc)),
            insuranceCrc: formData.insuranceCrc ? Number(formData.insuranceCrc) : 0,
            insuranceEur: formData.insuranceCrc ? Number(convertCRCToEuro(formData.insuranceCrc)) : 0,
        };

        onSubmit(payload);
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
                        <Truck size={18} className="text-[#ef7d2d]" />
                        <h3 className="text-lg font-semibold text-slate-800">
                            {isEdit ? "Editar Pedido" : "Nuevo Pedido"}
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

                {/* Form — scrollable */}
                <form id="supplierOrderForm" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
                    <RenderField
                        name="name"
                        label="Nombre del Pedido"
                        icon={Truck}
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="Ej: Pedido Europeo Q1 2026"
                    />

                    <RenderField
                        name="receivedDate"
                        label="Fecha de Recepción"
                        icon={Calendar}
                        type="date"
                        value={formData.receivedDate}
                        onChange={handleChange}
                        error={errors.receivedDate}
                        placeholder="Seleccione fecha"
                    />

                    {/* Separator */}
                    <div className="flex items-center gap-3 pt-1">
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Montos</span>
                        <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    {/* Total amount CRC */}
                    <RenderField
                        name="totalAmountCrc"
                        label="Monto Total (₡)"
                        prefix="₡"
                        value={formattedTotalCrc}
                        onChange={handlePositiveIntegerChange}
                        error={errors.totalAmountCrc}
                        placeholder="Colones"
                    />

                    {/* Total amount EUR — auto-calculated */}
                    <RenderField
                        name="totalAmountEur"
                        label="Monto Total (€)"
                        icon={Euro}
                        value={computedTotalEur}
                        onChange={() => {}}
                        error={errors.totalAmountEur}
                        placeholder="Calculado automáticamente"
                        disabled
                    />

                    {/* Separator */}
                    <div className="flex items-center gap-3 pt-1">
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Seguro (opcional)</span>
                        <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    {/* Insurance CRC */}
                    <RenderField
                        name="insuranceCrc"
                        label="Seguro (₡)"
                        icon={ShieldCheck}
                        value={formattedInsuranceCrc}
                        onChange={handlePositiveIntegerChange}
                        error={errors.insuranceCrc}
                        placeholder="0 si no aplica"
                    />

                    {/* Insurance EUR — auto-calculated */}
                    <RenderField
                        name="insuranceEur"
                        label="Seguro (€)"
                        icon={Euro}
                        value={computedInsuranceEur}
                        onChange={() => {}}
                        error={errors.insuranceEur}
                        placeholder="Calculado automáticamente"
                        disabled
                    />
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
                        form="supplierOrderForm"
                        loading={loading}
                    >
                        {isEdit ? "Actualizar" : "Guardar"}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}
