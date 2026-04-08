import { useState, useEffect, useCallback, useRef } from "react";
import { ShoppingCart, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { getClients } from "../../services/clientService";
import { getModelProducts } from "../../services/modelProductService";
import { getProductsByModel } from "../../services/productService";
import { createOrder } from "../../services/orderClientService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import SearchableSelect from "../ui/SearchableSelect";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import ModuleFormActions from "../ui/ModuleFormActions";

const TAX_RATE = 0.13;

function createEmptyLine() {
    return {
        id: Date.now() + Math.random(),
        modelId: null,
        quantity: 1,
        assignedProducts: [],
        loadingProducts: false,
        availableCount: 0,
        pricePerUnit: 0,
        error: null,
    };
}

function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

export default function SalesFormView({ onSaleCreated }) {
    const [clients, setClients] = useState([]);
    const [models, setModels] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    const [clientId, setClientId] = useState(null);
    const [clientType, setClientType] = useState("");
    const [invoiceNum, setInvoiceNum] = useState("");
    const [saleDate, setSaleDate] = useState(getTodayDate());
    const [notes, setNotes] = useState("");
    const [productLines, setProductLines] = useState([createEmptyLine()]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const { showAlert } = useAlert();
    const alertRef = useRef(showAlert);

    useEffect(() => {
        alertRef.current = showAlert;
    }, [showAlert]);

    const fetchData = useCallback(async () => {
        try {
            setLoadingData(true);

            const [clientsData, modelsData] = await Promise.all([getClients(), getModelProducts()]);

            setClients(clientsData);
            setModels(modelsData);
        } catch (error) {
            handleApiError(error, alertRef.current);
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    function resetForm() {
        setClientId(null);
        setClientType("");
        setInvoiceNum("");
        setSaleDate(getTodayDate());
        setNotes("");
        setProductLines([createEmptyLine()]);
        setErrors({});
    }

    function handleClientChange(id) {
        setClientId(id);

        const selected = clients.find(client => client.id === id);

        setClientType(selected ? (selected.type === "PRIVATE" ? "Privado" : "Distribuidor") : "");

        setErrors(prev => ({ ...prev, clientId: null }));
    }

    function addProductLine() {
        setProductLines(prev => [...prev, createEmptyLine()]);
    }

    function removeProductLine(lineId) {
        if (productLines.length <= 1) return;
        setProductLines(prev => prev.filter(line => line.id !== lineId));
    }

    async function handleModelChange(lineId, modelId) {
        const otherAssigned = productLines
            .filter(line => line.id !== lineId)
            .flatMap(line => line.assignedProducts.map(product => product.id));

        setProductLines(prev =>
            prev.map(line =>
                line.id === lineId
                    ? {
                          ...line,
                          modelId,
                          assignedProducts: [],
                          loadingProducts: true,
                          error: null,
                      }
                    : line,
            ),
        );

        if (!modelId) {
            setProductLines(prev =>
                prev.map(line =>
                    line.id === lineId
                        ? {
                              ...line,
                              modelId: null,
                              assignedProducts: [],
                              loadingProducts: false,
                              availableCount: 0,
                              pricePerUnit: 0,
                          }
                        : line,
                ),
            );
            return;
        }

        try {
            const available = await getProductsByModel(modelId, "AVAILABLE");
            const filtered = available.filter(product => !otherAssigned.includes(product.id));

            const model = models.find(item => item.id === modelId);
            const price = model ? Number(model.priceSale) : 0;

            setProductLines(prev =>
                prev.map(line => {
                    if (line.id !== lineId) return line;

                    const qty = Math.min(line.quantity, filtered.length);
                    const resolvedQty = qty || (filtered.length > 0 ? 1 : 0);

                    return {
                        ...line,
                        loadingProducts: false,
                        availableCount: filtered.length,
                        pricePerUnit: price,
                        quantity: resolvedQty,
                        assignedProducts: filtered.slice(0, resolvedQty),
                        error: filtered.length === 0 ? "No hay stock disponible para este modelo" : null,
                    };
                }),
            );
        } catch {
            setProductLines(prev =>
                prev.map(line =>
                    line.id === lineId
                        ? {
                              ...line,
                              loadingProducts: false,
                              error: "Error al cargar productos",
                          }
                        : line,
                ),
            );
        }
    }

    async function handleQuantityChange(lineId, newQty) {
        const qty = Math.max(0, Math.min(newQty, 99));

        const otherAssigned = productLines
            .filter(line => line.id !== lineId)
            .flatMap(line => line.assignedProducts.map(product => product.id));

        const line = productLines.find(item => item.id === lineId);

        if (!line || !line.modelId) {
            setProductLines(prev => prev.map(item => (item.id === lineId ? { ...item, quantity: qty, assignedProducts: [] } : item)));
            return;
        }

        setProductLines(prev => prev.map(item => (item.id === lineId ? { ...item, loadingProducts: true } : item)));

        try {
            const available = await getProductsByModel(line.modelId, "AVAILABLE");
            const filtered = available.filter(product => !otherAssigned.includes(product.id));

            const realQty = Math.min(qty, filtered.length);

            setProductLines(prev =>
                prev.map(item => {
                    if (item.id !== lineId) return item;

                    return {
                        ...item,
                        quantity: realQty,
                        assignedProducts: filtered.slice(0, realQty),
                        availableCount: filtered.length,
                        loadingProducts: false,
                        error:
                            qty > filtered.length
                                ? `Solo hay ${filtered.length} unidad${filtered.length !== 1 ? "es" : ""} disponible${filtered.length !== 1 ? "s" : ""}`
                                : null,
                    };
                }),
            );
        } catch {
            setProductLines(prev => prev.map(item => (item.id === lineId ? { ...item, loadingProducts: false } : item)));
        }
    }

    function validate() {
        const newErrors = {};

        if (!clientId) newErrors.clientId = "Debe seleccionar un cliente";
        if (!invoiceNum.trim()) newErrors.invoiceNum = "El número de factura es obligatorio";
        if (!saleDate) newErrors.saleDate = "La fecha de venta es obligatoria";

        const totalProducts = productLines.reduce((sum, line) => sum + line.assignedProducts.length, 0);

        if (totalProducts === 0) {
            newErrors.products = "Debe agregar al menos un producto";
        }

        return newErrors;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            showAlert("Hay errores en el formulario", "warning");
            return;
        }

        const allProductIds = productLines.flatMap(line => line.assignedProducts.map(product => product.id));

        try {
            setSubmitting(true);

            await createOrder({
                clientId,
                invoiceNum: invoiceNum.trim(),
                saleDate,
                notes: notes.trim() || null,
                productIds: allProductIds,
            });

            showAlert("Venta registrada correctamente", "success");
            resetForm();
            onSaleCreated?.();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setSubmitting(false);
        }
    }

    const clientOptions = clients.map(client => ({
        value: client.id,
        label: client.type === "DISTRIBUTOR" ? client.name : [client.name, client.lastName1, client.lastName2].filter(Boolean).join(" "),
        sublabel: `${client.identityNumber} · ${client.type === "PRIVATE" ? "Privado" : "Distribuidor"}`,
    }));

    const modelOptions = models
        .filter(model => model.status === "AVAILABLE")
        .map(model => ({
            value: model.id,
            label: model.name,
            sublabel: `Código: ${model.modelCode} · ₡${Number(model.priceSale).toLocaleString("es-CR")}`,
        }));

    const subtotal = productLines.reduce((sum, line) => sum + line.pricePerUnit * line.assignedProducts.length, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const totalProducts = productLines.reduce((sum, line) => sum + line.assignedProducts.length, 0);

    function fmtCRC(value) {
        return `₡ ${Number(value || 0).toLocaleString("es-CR", {
            minimumFractionDigits: 0,
        })}`;
    }

    if (loadingData) {
        return (
            <div className='flex items-center justify-center py-20'>
                <div className='flex flex-col items-center gap-3 text-slate-400'>
                    <Loader2 size={28} className='animate-spin' />
                    <span className='text-sm'>Cargando datos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className='w-full'>
            <div className='max-w-4xl mx-auto space-y-5'>
                <ModulePanelHeader
                    title='Registrar Venta'
                    subtitle='Complete los datos para registrar una nueva venta'
                    icon={ShoppingCart}
                    variant='form'
                />

                <form onSubmit={handleSubmit} id='salesForm' className='space-y-5'>
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4'>
                        <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wider'>Datos de la venta</h2>

                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                            <div className='space-y-1.5'>
                                <label className='block text-sm font-medium text-slate-600'>Cliente</label>
                                <SearchableSelect
                                    options={clientOptions}
                                    value={clientId}
                                    onChange={handleClientChange}
                                    placeholder='Seleccione un cliente'
                                    searchPlaceholder='Buscar por nombre o cédula...'
                                    error={errors.clientId}
                                />
                                {errors.clientId && <p className='text-xs text-red-500'>{errors.clientId}</p>}
                            </div>

                            <div className='space-y-1.5'>
                                <label className='block text-sm font-medium text-slate-600'>Tipo de cliente</label>
                                <div className='flex items-center w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5'>
                                    <span className={`text-sm ${clientType ? "text-slate-700" : "text-slate-300"}`}>
                                        {clientType || "Se completa al seleccionar cliente"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                            <div className='space-y-1.5'>
                                <label htmlFor='invoiceNum' className='block text-sm font-medium text-slate-600'>
                                    # Factura
                                </label>
                                <input
                                    id='invoiceNum'
                                    type='text'
                                    value={invoiceNum}
                                    onChange={e => {
                                        setInvoiceNum(e.target.value);
                                        setErrors(prev => ({ ...prev, invoiceNum: null }));
                                    }}
                                    placeholder='Ej: FAC-2026-001'
                                    className={`
                                        w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-700
                                        placeholder:text-slate-300 outline-none transition-colors
                                        ${
                                            errors.invoiceNum
                                                ? "border-red-300 bg-red-50/40"
                                                : "border-slate-200 bg-white focus:border-[#34c3d6]"
                                        }
                                    `}
                                />
                                {errors.invoiceNum && <p className='text-xs text-red-500'>{errors.invoiceNum}</p>}
                            </div>

                            <div className='space-y-1.5'>
                                <label htmlFor='saleDate' className='block text-sm font-medium text-slate-600'>
                                    Fecha de venta
                                </label>
                                <input
                                    id='saleDate'
                                    type='date'
                                    value={saleDate}
                                    onChange={e => {
                                        setSaleDate(e.target.value);
                                        setErrors(prev => ({ ...prev, saleDate: null }));
                                    }}
                                    className={`
                                        w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-700
                                        outline-none transition-colors
                                        ${
                                            errors.saleDate
                                                ? "border-red-300 bg-red-50/40"
                                                : "border-slate-200 bg-white focus:border-[#34c3d6]"
                                        }
                                    `}
                                />
                                {errors.saleDate && <p className='text-xs text-red-500'>{errors.saleDate}</p>}
                            </div>
                        </div>
                    </div>

                    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4'>
                        <div className='flex items-center justify-between'>
                            <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wider'>Productos</h2>

                            {errors.products && (
                                <span className='text-xs text-red-500 flex items-center gap-1'>
                                    <AlertCircle size={12} />
                                    {errors.products}
                                </span>
                            )}
                        </div>

                        <div className='space-y-4'>
                            {productLines.map((line, index) => (
                                <ProductLineCard
                                    key={line.id}
                                    line={line}
                                    index={index}
                                    modelOptions={modelOptions}
                                    canRemove={productLines.length > 1}
                                    onModelChange={modelId => handleModelChange(line.id, modelId)}
                                    onQuantityChange={qty => handleQuantityChange(line.id, qty)}
                                    onRemove={() => removeProductLine(line.id)}
                                    fmtCRC={fmtCRC}
                                />
                            ))}
                        </div>

                        <button
                            type='button'
                            onClick={addProductLine}
                            className='flex items-center gap-2 text-sm text-[#34c3d6] font-medium hover:text-[#28b4c8] transition-colors'
                        >
                            <Plus size={16} />
                            Agregar otro producto
                        </button>
                    </div>

                    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6'>
                        <div className='max-w-sm ml-auto space-y-3'>
                            <div className='flex justify-between text-sm'>
                                <span className='text-slate-500'>Monto bruto</span>
                                <span className='text-slate-700 font-medium tabular-nums'>{fmtCRC(subtotal)}</span>
                            </div>

                            <div className='flex justify-between text-sm'>
                                <span className='text-slate-500'>Impuesto (13%)</span>
                                <span className='text-slate-700 font-medium tabular-nums'>{fmtCRC(tax)}</span>
                            </div>

                            <div className='border-t border-slate-200 pt-3 flex justify-between'>
                                <span className='text-base font-semibold text-slate-800'>Monto neto</span>
                                <span className='text-base font-bold text-[#34c3d6] tabular-nums'>{fmtCRC(total)}</span>
                            </div>

                            <p className='text-xs text-slate-400'>
                                {totalProducts} producto{totalProducts !== 1 ? "s" : ""} en esta venta
                            </p>
                        </div>
                    </div>
                </form>

                <ModuleFormActions
                    onReset={resetForm}
                    resetText='Limpiar'
                    submitText='Registrar Venta'
                    submitFormId='salesForm'
                    loading={submitting}
                />
            </div>
        </div>
    );
}

function ProductLineCard({ line, index, modelOptions, canRemove, onModelChange, onQuantityChange, onRemove, fmtCRC }) {
    return (
        <div className='border border-slate-200 rounded-xl'>
            <div className='flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100 rounded-t-xl'>
                <span className='text-sm font-medium text-slate-600'>Producto #{index + 1}</span>

                {canRemove && (
                    <button
                        type='button'
                        onClick={onRemove}
                        className='w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors'
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            <div className='p-4 space-y-4 overflow-visible'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
                    <div className='flex-1 space-y-1.5'>
                        <label className='block text-sm font-medium text-slate-600'>Modelo</label>
                        <SearchableSelect
                            options={modelOptions}
                            value={line.modelId}
                            onChange={onModelChange}
                            placeholder='Seleccione un modelo'
                            searchPlaceholder='Buscar modelo...'
                        />
                    </div>

                    <div className='w-24 space-y-1.5 shrink-0'>
                        <label className='block text-sm font-medium text-slate-600'>Cant.</label>
                        <input
                            type='number'
                            min={0}
                            max={line.availableCount || 99}
                            value={line.quantity}
                            onChange={e => onQuantityChange(Number(e.target.value))}
                            disabled={!line.modelId}
                            className='w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 text-center outline-none focus:border-[#34c3d6] disabled:bg-slate-50 disabled:text-slate-400 transition-colors'
                        />
                    </div>
                </div>

                {line.error && (
                    <div className='flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200'>
                        <AlertCircle size={14} className='text-amber-500 shrink-0' />
                        <span className='text-xs text-amber-700'>{line.error}</span>
                    </div>
                )}

                {line.loadingProducts && (
                    <div className='flex items-center gap-2 py-2 text-slate-400'>
                        <Loader2 size={14} className='animate-spin' />
                        <span className='text-xs'>Asignando productos (FIFO)...</span>
                    </div>
                )}

                {line.assignedProducts.length > 0 && (
                    <div className='border border-slate-100 rounded-lg overflow-hidden'>
                        <div className='px-3 py-2 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between'>
                            <span className='text-xs font-medium text-slate-500'>
                                Productos asignados (FIFO) — {line.assignedProducts.length} unidad
                                {line.assignedProducts.length !== 1 ? "es" : ""}
                            </span>

                            <span className='text-xs font-semibold text-slate-800'>{fmtCRC(line.pricePerUnit)}</span>
                        </div>

                        <div className='divide-y divide-slate-50 max-h-40 overflow-y-auto'>
                            {line.assignedProducts.map((product, i) => (
                                <div key={product.id} className='flex items-center justify-between px-3 py-2'>
                                    <div className='flex items-center gap-2'>
                                        <span className='text-[11px] text-slate-400 w-5 text-right'>{i + 1}.</span>

                                        <span className='font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded'>
                                            {product.serialNum}
                                        </span>
                                    </div>

                                    <span className='text-xs text-slate-400'>Ingreso: {product.entryDate}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
