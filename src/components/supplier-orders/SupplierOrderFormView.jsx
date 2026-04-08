import { useEffect, useMemo, useState } from "react";
import { Truck, Calendar, Euro, ShieldCheck } from "lucide-react";
import { formatCRC, convertCRCToEuro, formatConvertedCurrency } from "../../utils/currency";
import { createSupplierOrder, updateSupplierOrder } from "../../services/supplierOrderService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import FormField from "../form/FormField";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import ModuleFormActions from "../ui/ModuleFormActions";

const EMPTY_FORM = {
    name: "",
    receivedDate: "",
    totalAmountCrc: "",
    totalAmountEur: "",
    insuranceCrc: "",
    insuranceEur: "",
};

function getInitialForm(order) {
    if (!order) return EMPTY_FORM;

    return {
        name: order.name || "",
        receivedDate: order.receivedDate || "",
        totalAmountCrc: String(Math.round(Number(order.totalAmountCrc || 0))),
        totalAmountEur: String(order.totalAmountEur || ""),
        insuranceCrc: String(Math.round(Number(order.insuranceCrc || 0))),
        insuranceEur: String(order.insuranceEur || ""),
    };
}

export default function SupplierOrderFormView({ order = null, onSaved }) {
    const [formData, setFormData] = useState(getInitialForm(order));
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const { showAlert } = useAlert();

    const isEdit = !!order;

    useEffect(() => {
        setFormData(getInitialForm(order));
        setErrors({});
    }, [order]);

    const formattedTotalCrc = useMemo(() => formatCRC(formData.totalAmountCrc), [formData.totalAmountCrc]);

    const computedTotalEur = formData.totalAmountCrc ? formatConvertedCurrency(convertCRCToEuro(formData.totalAmountCrc)) : "0.00";

    const formattedInsuranceCrc = useMemo(() => formatCRC(formData.insuranceCrc), [formData.insuranceCrc]);

    const computedInsuranceEur = formData.insuranceCrc ? formatConvertedCurrency(convertCRCToEuro(formData.insuranceCrc)) : "0.00";

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

    function handleReset() {
        setFormData(getInitialForm(order));
        setErrors({});
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

        if (formData.insuranceCrc && Number(formData.insuranceCrc) < 0) {
            newErrors.insuranceCrc = "No puede ser negativo";
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            showAlert("Hay errores en el formulario", "warning");
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

        try {
            setLoading(true);

            if (isEdit) {
                await updateSupplierOrder(order.id, payload);
                showAlert("Pedido actualizado correctamente", "success");
            } else {
                await createSupplierOrder(payload);
                showAlert("Pedido registrado correctamente", "success");
            }

            setFormData(EMPTY_FORM);
            setErrors({});
            onSaved?.();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='w-full'>
            <div className='max-w-4xl mx-auto space-y-5'>
                <ModulePanelHeader
                    title={isEdit ? "Editar Pedido del Proveedor" : "Registrar Pedido del Proveedor"}
                    subtitle={
                        isEdit ? "Actualice la información del pedido seleccionado" : "Complete los datos para registrar un nuevo pedido"
                    }
                    icon={Truck}
                    variant='form'
                />

                <form id='supplierOrderForm' onSubmit={handleSubmit} className='space-y-5'>
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4'>
                        <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wider'>Datos del pedido</h2>

                        <FormField
                            name='name'
                            label='Nombre del Pedido'
                            icon={Truck}
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            placeholder='Ej: Pedido Europeo Q1 2026'
                        />

                        <FormField
                            name='receivedDate'
                            label='Fecha de Recepción'
                            icon={Calendar}
                            type='date'
                            value={formData.receivedDate}
                            onChange={handleChange}
                            error={errors.receivedDate}
                            placeholder='Seleccione fecha'
                        />
                    </div>

                    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4'>
                        <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wider'>Montos</h2>

                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                            <FormField
                                name='totalAmountCrc'
                                label='Monto Total (₡)'
                                prefix='₡'
                                value={formattedTotalCrc}
                                onChange={handlePositiveIntegerChange}
                                error={errors.totalAmountCrc}
                                placeholder='Colones'
                            />

                            <FormField
                                name='totalAmountEur'
                                label='Monto Total (€)'
                                icon={Euro}
                                value={computedTotalEur}
                                onChange={() => {}}
                                placeholder='Calculado automáticamente'
                                disabled
                            />
                        </div>
                    </div>

                    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4'>
                        <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wider'>Seguro (opcional)</h2>

                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                            <FormField
                                name='insuranceCrc'
                                label='Seguro (₡)'
                                icon={ShieldCheck}
                                value={formattedInsuranceCrc}
                                onChange={handlePositiveIntegerChange}
                                error={errors.insuranceCrc}
                                placeholder='0 si no aplica'
                            />

                            <FormField
                                name='insuranceEur'
                                label='Seguro (€)'
                                icon={Euro}
                                value={computedInsuranceEur}
                                onChange={() => {}}
                                placeholder='Calculado automáticamente'
                                disabled
                            />
                        </div>
                    </div>
                </form>

                <ModuleFormActions
                    onReset={handleReset}
                    resetText='Limpiar'
                    submitText={isEdit ? "Actualizar Pedido" : "Guardar Pedido"}
                    submitFormId='supplierOrderForm'
                    loading={loading}
                />
            </div>
        </div>
    );
}