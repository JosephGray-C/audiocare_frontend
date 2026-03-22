import { Package, Barcode, Euro, DollarSign } from "lucide-react";
import { useState } from "react";
import { formatCRC, convertCRCToEuro, convertCRCToUSD, formatConvertedCurrency} from "../utils/currency";
import { createModelProduct } from "../services/modelProductService";
import FormField from "../components/form/FormField";
import FormCardHeader from "../components/form/FormCardHeader";
import FormCardFooter from "../components/form/FormCardFooter";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";
import FormPageWrapper from "../layouts/FormPageWrapper";

export default function RegistrarModeloProducto() {
    const [formData, setFormData] = useState({
        modelCode: "",
        name: "",
        priceSale: "",
        costFabricEur: "",
        costFabricCrc: "",
    });

    const { showAlert } = useAlert();
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const formattedPriceSale = formatCRC(formData.priceSale);
    const formattedCostFabricCrc = formatCRC(formData.costFabricCrc);
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

    function handleCancelar() {
        setFormData({
            modelCode: "",
            name: "",
            priceSale: "",
            costFabricEur: "",
            costFabricCrc: "",
        });

        setErrors({});
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

            console.log(payload);

            await createModelProduct(payload);

            showAlert("Producto registrado correctamente", "success");

            setFormData({
                modelCode: "",
                name: "",
                costFabricCrc: "",
                costFabricEur: "",
                priceSale: "",
            });

            setErrors({});
        } catch (error) {
            console.error(error);
            handleApiError(error, showAlert);
        } finally {
            setLoading(false);
        }
    }

    return (
        <FormPageWrapper>
            <div className='w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden '>
                {/* HEADER */}
                <FormCardHeader title='Registrar Modelo Producto' icon={Package} />

                {/* BODY */}
                <form id='productForm' onSubmit={handleSubmit} className='px-5 py-5 space-y-5 lg:px-8 lg:py-7 lg:space-y-7'>
                    <FormField
                        label='Codigo Modelo'
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
                </form>

                {/* FOOTER */}
                <FormCardFooter
                    onCancel={handleCancelar}
                    submitFormId='productForm'
                    loading={loading}
                    cancelText='Cancelar'
                    submitText='Guardar'
                />
            </div>
        </FormPageWrapper>
    );
}
