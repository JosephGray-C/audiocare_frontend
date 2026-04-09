import { useEffect, useMemo, useState } from "react";
import { Package, Barcode, Euro, DollarSign } from "lucide-react";
import { formatCRC, convertCRCToEuro, convertCRCToUSD, formatConvertedCurrency } from "../../utils/currency";
import { createModelProduct, updateModelProduct } from "../../services/modelProductService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import FormField from "../form/FormField";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import ModuleFormActions from "../ui/ModuleFormActions";

const EMPTY_FORM = {
    modelCode: "",
    name: "",
    priceSale: "",
    costFabricEur: "",
    costFabricCrc: "",
};

function getInitialForm(model) {
    if (!model) {
        return EMPTY_FORM;
    }

    return {
        modelCode: String(model.modelCode || ""),
        name: model.name || "",
        priceSale: String(model.priceSale || ""),
        costFabricEur: String(model.costFabricEur || ""),
        costFabricCrc: String(model.costFabricCrc || ""),
    };
}

export default function ModelProductFormView({ model = null, onSaved }) {
    const [formData, setFormData] = useState(getInitialForm(model));
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const { showAlert, closeAlert } = useAlert();

    const isEdit = !!model;

    useEffect(() => {
        setFormData(getInitialForm(model));
        setErrors({});
    }, [model]);

    const formattedPriceSale = useMemo(() => {
        return formatCRC(formData.priceSale);
    }, [formData.priceSale]);

    const formattedCostFabricCrc = useMemo(() => {
        return formatCRC(formData.costFabricCrc);
    }, [formData.costFabricCrc]);

    const formattedCostFabricEur = formData.costFabricCrc ? formatConvertedCurrency(convertCRCToEuro(formData.costFabricCrc)) : "0.00";

    const euros = formData.priceSale ? formatConvertedCurrency(convertCRCToEuro(formData.priceSale)) : "0.00";

    const usd = formData.priceSale ? formatConvertedCurrency(convertCRCToUSD(formData.priceSale)) : "0.00";

    function handlePositiveIntegerChange(e) {
        const { name, value } = e.target;
        const sanitized = value.replace(/\D/g, "");

        setFormData(prev => ({
            ...prev,
            [name]: sanitized,
        }));

        setErrors(prev => ({
            ...prev,
            [name]: null,
        }));
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        setErrors(prev => ({
            ...prev,
            [name]: null,
        }));
    }

    function handleReset() {
        setFormData(getInitialForm(model));
        setErrors({});
        closeAlert();
    }

    function validateForm() {
        const newErrors = {};

        if (!formData.modelCode) {
            newErrors.modelCode = "El código del modelo es obligatorio";
        } else if (!/^\d+$/.test(formData.modelCode)) {
            newErrors.modelCode = "El código del modelo debe ser un número entero";
        } else if (Number(formData.modelCode) <= 0) {
            newErrors.modelCode = "El código del modelo debe ser un entero positivo";
        }

        if (!formData.name.trim()) {
            newErrors.name = "El nombre es obligatorio";
        }

        if (!formData.costFabricCrc) {
            newErrors.costFabricCrc = "El precio de fábrica en colones es obligatorio";
        } else if (Number(formData.costFabricCrc) <= 0) {
            newErrors.costFabricCrc = "El precio de fábrica en colones debe ser un número positivo";
        }

        if (!formData.priceSale) {
            newErrors.priceSale = "El precio de venta es obligatorio";
        } else if (Number(formData.priceSale) <= 0) {
            newErrors.priceSale = "El precio de venta debe ser un número positivo";
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            showAlert("Hay errores en el formulario", "warning");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ...formData,
                costFabricEur: convertCRCToEuro(formData.costFabricCrc),
            };

            if (isEdit) {
                await updateModelProduct(model.id, payload);
                showAlert("Modelo actualizado correctamente", "success");
            } else {
                await createModelProduct(payload);
                showAlert("Modelo registrado correctamente", "success");
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
            <div className='max-w-5xl mx-auto space-y-5'>
                <ModulePanelHeader
                    title={isEdit ? "Editar Modelo Producto" : "Registrar Modelo Producto"}
                    subtitle={
                        isEdit ? "Actualice la información del modelo seleccionado" : "Complete los datos para registrar un nuevo modelo"
                    }
                    icon={Package}
                    variant='form'
                />

                <form id='modelProductForm' onSubmit={handleSubmit} className='space-y-5'>
                    <div className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'>
                        <div className='px-5 py-5 space-y-5 lg:px-8 lg:py-7 lg:space-y-4'>
                            <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wider'>Datos del modelo</h2>

                            <FormField
                                label='Código Modelo'
                                name='modelCode'
                                value={formData.modelCode}
                                onChange={handlePositiveIntegerChange}
                                icon={Barcode}
                                placeholder='Ingrese los datos...'
                                error={errors.modelCode}
                            />

                            <FormField
                                label='Nombre'
                                name='name'
                                value={formData.name}
                                onChange={handleChange}
                                icon={Package}
                                placeholder='Ingrese los datos...'
                                error={errors.name}
                            />

                            <FormField
                                label='Precio Fábrica Colones'
                                name='costFabricCrc'
                                value={formattedCostFabricCrc}
                                onChange={handlePositiveIntegerChange}
                                prefix='₡'
                                placeholder='Ingrese los datos...'
                                error={errors.costFabricCrc}
                            />

                            <FormField
                                label='Precio Fábrica Euros'
                                name='costFabricEur'
                                value={formattedCostFabricEur}
                                icon={Euro}
                                placeholder='Calculado automáticamente'
                                disabled
                            />

                            <FormField
                                label='Precio Venta'
                                name='priceSale'
                                value={formattedPriceSale}
                                onChange={handlePositiveIntegerChange}
                                prefix='₡'
                                placeholder='Ingrese los datos...'
                                error={errors.priceSale}
                            />

                            <div className='grid grid-cols-1 gap-2 lg:grid-cols-[165px_1fr] lg:gap-6'>
                                <div className='hidden lg:block' />

                                <div className='pt-1 lg:pl-4'>
                                    <div className='flex items-center gap-6 rounded-2xl px-4 py-2.5 border bg-slate-50 border-slate-200 w-fit'>
                                        <div className='flex items-center'>
                                            <Euro size={15} className='text-slate-500 mr-2 shrink-0' />
                                            <span className='text-sm text-slate-600 tabular-nums'>{euros}</span>
                                        </div>

                                        <div className='w-px h-5 bg-slate-200 shrink-0' />

                                        <div className='flex items-center'>
                                            <DollarSign size={15} className='text-slate-500 mr-2 shrink-0' />
                                            <span className='text-sm text-slate-600 tabular-nums'>{usd}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <ModuleFormActions
                    onReset={handleReset}
                    resetText='Limpiar'
                    submitText={isEdit ? "Actualizar Modelo" : "Guardar Modelo"}
                    submitFormId='modelProductForm'
                    loading={loading}
                />
            </div>
        </div>
    );
}