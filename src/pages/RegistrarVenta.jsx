import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getClients } from "../services/clientService";
import { getModelProducts } from "../services/modelProductService";
import { getProductsByModel } from "../services/productService";
import { createOrder } from "../services/orderClientService";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";
import SearchableSelect from "../components/ui/SearchableSelect";
import LoadingButton from "../components/ui/LoadingButton";

const TAX_RATE = 0.13;

export default function RegistrarVenta() {
    // ── Data sources ─────────────────────────────────────────────────────
    const [clients, setClients] = useState([]);
    const [models, setModels] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // ── Form state ───────────────────────────────────────────────────────
    const [clientId, setClientId] = useState(null);
    const [clientType, setClientType] = useState("");
    const [invoiceNum, setInvoiceNum] = useState("");
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [productLines, setProductLines] = useState([createEmptyLine()]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const { showAlert } = useAlert();
    const navigate = useNavigate();

    // ── Load clients and models ──────────────────────────────────────────

    const fetchData = useCallback(async () => {
        try {
            setLoadingData(true);
            const [clientsData, modelsData] = await Promise.all([
                getClients(),
                getModelProducts(),
            ]);
            setClients(clientsData);
            setModels(modelsData);
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoadingData(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Client selection ─────────────────────────────────────────────────

    function handleClientChange(id) {
        setClientId(id);
        const selected = clients.find(c => c.id === id);
        setClientType(selected ? (selected.type === "PRIVATE" ? "Privado" : "Distribuidor") : "");
        setErrors(prev => ({ ...prev, clientId: null }));
    }

    // ── Product line helpers ─────────────────────────────────────────────

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

    function addProductLine() {
        setProductLines(prev => [...prev, createEmptyLine()]);
    }

    function removeProductLine(lineId) {
        if (productLines.length <= 1) return;
        setProductLines(prev => prev.filter(l => l.id !== lineId));
    }

    async function handleModelChange(lineId, modelId) {
        // Get already selected product IDs from other lines
        const otherAssigned = productLines
            .filter(l => l.id !== lineId)
            .flatMap(l => l.assignedProducts.map(p => p.id));

        setProductLines(prev =>
            prev.map(l =>
                l.id === lineId
                    ? { ...l, modelId, assignedProducts: [], loadingProducts: true, error: null }
                    : l
            )
        );

        if (!modelId) {
            setProductLines(prev =>
                prev.map(l =>
                    l.id === lineId
                        ? { ...l, modelId: null, assignedProducts: [], loadingProducts: false, availableCount: 0, pricePerUnit: 0 }
                        : l
                )
            );
            return;
        }

        try {
            const available = await getProductsByModel(modelId, "AVAILABLE");
            // Exclude products already assigned in other lines
            const filtered = available.filter(p => !otherAssigned.includes(p.id));
            const model = models.find(m => m.id === modelId);
            const price = model ? Number(model.priceSale) : 0;

            setProductLines(prev =>
                prev.map(l => {
                    if (l.id !== lineId) return l;
                    const qty = Math.min(l.quantity, filtered.length);
                    return {
                        ...l,
                        loadingProducts: false,
                        availableCount: filtered.length,
                        pricePerUnit: price,
                        quantity: qty || (filtered.length > 0 ? 1 : 0),
                        assignedProducts: filtered.slice(0, qty || (filtered.length > 0 ? 1 : 0)),
                        error: filtered.length === 0 ? "No hay stock disponible para este modelo" : null,
                    };
                })
            );
        } catch {
            setProductLines(prev =>
                prev.map(l =>
                    l.id === lineId
                        ? { ...l, loadingProducts: false, error: "Error al cargar productos" }
                        : l
                )
            );
        }
    }

    async function handleQuantityChange(lineId, newQty) {
        const qty = Math.max(0, Math.min(newQty, 99));

        // Get already selected product IDs from other lines
        const otherAssigned = productLines
            .filter(l => l.id !== lineId)
            .flatMap(l => l.assignedProducts.map(p => p.id));

        const line = productLines.find(l => l.id === lineId);
        if (!line || !line.modelId) {
            setProductLines(prev =>
                prev.map(l => l.id === lineId ? { ...l, quantity: qty, assignedProducts: [] } : l)
            );
            return;
        }

        setProductLines(prev =>
            prev.map(l => l.id === lineId ? { ...l, loadingProducts: true } : l)
        );

        try {
            const available = await getProductsByModel(line.modelId, "AVAILABLE");
            const filtered = available.filter(p => !otherAssigned.includes(p.id));
            const realQty = Math.min(qty, filtered.length);

            setProductLines(prev =>
                prev.map(l => {
                    if (l.id !== lineId) return l;
                    return {
                        ...l,
                        quantity: realQty,
                        assignedProducts: filtered.slice(0, realQty),
                        availableCount: filtered.length,
                        loadingProducts: false,
                        error: qty > filtered.length
                            ? `Solo hay ${filtered.length} unidad${filtered.length !== 1 ? "es" : ""} disponible${filtered.length !== 1 ? "s" : ""}`
                            : null,
                    };
                })
            );
        } catch {
            setProductLines(prev =>
                prev.map(l => l.id === lineId ? { ...l, loadingProducts: false } : l)
            );
        }
    }

    // ── Totals ───────────────────────────────────────────────────────────

    const subtotal = productLines.reduce(
        (sum, l) => sum + l.pricePerUnit * l.assignedProducts.length,
        0
    );
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const totalProducts = productLines.reduce((sum, l) => sum + l.assignedProducts.length, 0);

    // ── Validation ───────────────────────────────────────────────────────

    function validate() {
        const newErrors = {};

        if (!clientId) newErrors.clientId = "Debe seleccionar un cliente";
        if (!invoiceNum.trim()) newErrors.invoiceNum = "El número de factura es obligatorio";
        if (!saleDate) newErrors.saleDate = "La fecha de venta es obligatoria";
        if (totalProducts === 0) newErrors.products = "Debe agregar al menos un producto";

        return newErrors;
    }

    // ── Submit ───────────────────────────────────────────────────────────

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            showAlert("Hay errores en el formulario", "warning");
            return;
        }

        const allProductIds = productLines.flatMap(l => l.assignedProducts.map(p => p.id));

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
            navigate("/ventas");
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setSubmitting(false);
        }
    }

    // ── Dropdown options ─────────────────────────────────────────────────

    const clientOptions = clients.map(c => ({
        value: c.id,
        label: c.type === "DISTRIBUTOR"
            ? c.name
            : [c.name, c.lastName1, c.lastName2].filter(Boolean).join(" "),
        sublabel: `${c.identityNumber} · ${c.type === "PRIVATE" ? "Privado" : "Distribuidor"}`,
    }));

    const modelOptions = models
        .filter(m => m.status === "AVAILABLE")
        .map(m => ({
            value: m.id,
            label: m.name,
            sublabel: `Código: ${m.modelCode} · ₡${Number(m.priceSale).toLocaleString("es-CR")}`,
        }));

    // ── Format ───────────────────────────────────────────────────────────

    function fmtCRC(value) {
        return "₡ " + Number(value || 0).toLocaleString("es-CR", { minimumFractionDigits: 0 });
    }

    // ── Loading state ────────────────────────────────────────────────────

    if (loadingData) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-sm">Cargando datos...</span>
                </div>
            </div>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            {/* Page header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#34c3d6]/10 flex items-center justify-center">
                    <ShoppingCart size={20} className="text-[#34c3d6]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Registrar Venta</h1>
                    <p className="text-sm text-slate-400">Complete los datos para registrar una nueva venta</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* ── Client & Invoice card ──────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Datos de la venta</h2>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Client */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-600">Cliente</label>
                            <SearchableSelect
                                options={clientOptions}
                                value={clientId}
                                onChange={handleClientChange}
                                placeholder="Seleccione un cliente"
                                searchPlaceholder="Buscar por nombre o cédula..."
                                error={errors.clientId}
                            />
                            {errors.clientId && <p className="text-xs text-red-500">{errors.clientId}</p>}
                        </div>

                        {/* Client type — auto-filled */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-600">Tipo de cliente</label>
                            <div className="flex items-center w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                                <span className={`text-sm ${clientType ? "text-slate-700" : "text-slate-300"}`}>
                                    {clientType || "Se completa al seleccionar cliente"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Invoice number */}
                        <div className="space-y-1.5">
                            <label htmlFor="invoiceNum" className="block text-sm font-medium text-slate-600">
                                # Factura
                            </label>
                            <input
                                id="invoiceNum"
                                type="text"
                                value={invoiceNum}
                                onChange={e => {
                                    setInvoiceNum(e.target.value);
                                    setErrors(prev => ({ ...prev, invoiceNum: null }));
                                }}
                                placeholder="Ej: FAC-2026-001"
                                className={`
                                    w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-700
                                    placeholder:text-slate-300 outline-none transition-colors
                                    ${errors.invoiceNum ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white focus:border-[#34c3d6]"}
                                `}
                            />
                            {errors.invoiceNum && <p className="text-xs text-red-500">{errors.invoiceNum}</p>}
                        </div>

                        {/* Sale date */}
                        <div className="space-y-1.5">
                            <label htmlFor="saleDate" className="block text-sm font-medium text-slate-600">
                                Fecha de venta
                            </label>
                            <input
                                id="saleDate"
                                type="date"
                                value={saleDate}
                                onChange={e => {
                                    setSaleDate(e.target.value);
                                    setErrors(prev => ({ ...prev, saleDate: null }));
                                }}
                                className={`
                                    w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-700
                                    outline-none transition-colors
                                    ${errors.saleDate ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white focus:border-[#34c3d6]"}
                                `}
                            />
                            {errors.saleDate && <p className="text-xs text-red-500">{errors.saleDate}</p>}
                        </div>
                    </div>
                </div>

                {/* ── Product lines ───────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Productos</h2>
                        {errors.products && (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {errors.products}
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
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
                        type="button"
                        onClick={addProductLine}
                        className="flex items-center gap-2 text-sm text-[#34c3d6] font-medium hover:text-[#28b4c8] transition-colors"
                    >
                        <Plus size={16} />
                        Agregar otro producto
                    </button>
                </div>

                {/* ── Totals card ─────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6">
                    <div className="max-w-sm ml-auto space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Monto bruto</span>
                            <span className="text-slate-700 font-medium tabular-nums">{fmtCRC(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Impuesto (13%)</span>
                            <span className="text-slate-700 font-medium tabular-nums">{fmtCRC(tax)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-3 flex justify-between">
                            <span className="text-base font-semibold text-slate-800">Monto neto</span>
                            <span className="text-base font-bold text-[#34c3d6] tabular-nums">{fmtCRC(total)}</span>
                        </div>
                        <p className="text-xs text-slate-400">
                            {totalProducts} producto{totalProducts !== 1 ? "s" : ""} en esta venta
                        </p>
                    </div>
                </div>

                {/* ── Actions ─────────────────────────────────────────────── */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/ventas")}
                        className="rounded-xl border border-slate-300 bg-white px-7 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <LoadingButton type="submit" loading={submitting}>
                        Registrar Venta
                    </LoadingButton>
                </div>
            </form>
        </div>
    );
}

// ── Product Line Card ────────────────────────────────────────────────────

function ProductLineCard({ line, index, modelOptions, canRemove, onModelChange, onQuantityChange, onRemove, fmtCRC }) {
    return (
        <div className="border border-slate-200 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100 rounded-t-xl">
                <span className="text-sm font-medium text-slate-600">Producto #{index + 1}</span>
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 overflow-visible">
                {/* Model + Quantity row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    {/* Model dropdown */}
                    <div className="flex-1 space-y-1.5">
                        <label className="block text-sm font-medium text-slate-600">Modelo</label>
                        <SearchableSelect
                            options={modelOptions}
                            value={line.modelId}
                            onChange={onModelChange}
                            placeholder="Seleccione un modelo"
                            searchPlaceholder="Buscar modelo..."
                        />
                    </div>

                    {/* Quantity */}
                    <div className="w-24 space-y-1.5 shrink-0">
                        <label className="block text-sm font-medium text-slate-600">Cant.</label>
                        <input
                            type="number"
                            min={0}
                            max={line.availableCount || 99}
                            value={line.quantity}
                            onChange={e => onQuantityChange(Number(e.target.value))}
                            disabled={!line.modelId}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 text-center outline-none focus:border-[#34c3d6] disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
                        />
                    </div>
                </div>

                {/* Error */}
                {line.error && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertCircle size={14} className="text-amber-500 shrink-0" />
                        <span className="text-xs text-amber-700">{line.error}</span>
                    </div>
                )}

                {/* Loading */}
                {line.loadingProducts && (
                    <div className="flex items-center gap-2 py-2 text-slate-400">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-xs">Asignando productos (FIFO)...</span>
                    </div>
                )}

                {/* Assigned products */}
                {line.assignedProducts.length > 0 && (
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                        <div className="px-3 py-2 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">
                                Productos asignados (FIFO) — {line.assignedProducts.length} unidad{line.assignedProducts.length !== 1 ? "es" : ""}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">
                                {fmtCRC(line.pricePerUnit)}
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-40 overflow-y-auto">
                            {line.assignedProducts.map((product, i) => (
                                <div key={product.id} className="flex items-center justify-between px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-400 w-5 text-right">{i + 1}.</span>
                                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                            {product.serialNum}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        Ingreso: {product.entryDate}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}