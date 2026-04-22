import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Hash,
} from "lucide-react";
import { getClients } from "../../services/ClientService";
import { getModelProducts } from "../../services/ModelProductService";
import { getProductsByModel } from "../../services/ProductService";
import { createOrder } from "../../services/OrderclientService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import SearchableSelect from "../ui/SearchableSelect";
import AppDatePicker from "../ui/AppDatePicker";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import ModuleFormActions from "../ui/ModuleFormActions";
import AppToolTip from "../ui/AppToolTip";
import FormField from "../form/FormField";
import { formatDateValue, getTodayDateValue } from "../../utils/date";

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

function buildAvailabilityError(requestedQty, availableCount) {
  if (availableCount === 0) {
    return "No hay stock disponible para este modelo";
  }

  if (requestedQty > availableCount) {
    return `Solo hay ${availableCount} unidad${availableCount !== 1 ? "es" : ""} disponible${availableCount !== 1 ? "s" : ""}`;
  }

  return null;
}

function clampQuantity(value) {
  return Math.max(0, Math.min(Number.isFinite(value) ? value : 0, 99));
}

function getOtherAssignedProductIds(lines, lineId) {
  return new Set(
    lines
      .filter((line) => line.id !== lineId)
      .flatMap((line) => line.assignedProducts.map((product) => product.id)),
  );
}

function applyLineAllocation(
  lines,
  lineId,
  availableProducts,
  requestedQty,
  {
    ensureMinimumWhenAvailable = false,
    pricePerUnit,
    loadingProducts = false,
  } = {},
) {
  const targetLine = lines.find((line) => line.id === lineId);

  if (!targetLine) {
    return lines;
  }

  const requestedAmount = clampQuantity(requestedQty);
  const otherAssignedIds = getOtherAssignedProductIds(lines, lineId);
  const filteredProducts = availableProducts.filter(
    (product) => !otherAssignedIds.has(product.id),
  );
  const resolvedQty =
    ensureMinimumWhenAvailable && filteredProducts.length > 0
      ? Math.max(1, Math.min(requestedAmount, filteredProducts.length))
      : Math.min(requestedAmount, filteredProducts.length);

  return lines.map((line) => {
    if (line.id !== lineId) {
      return line;
    }

    return {
      ...line,
      quantity: resolvedQty,
      assignedProducts: filteredProducts.slice(0, resolvedQty),
      availableCount: filteredProducts.length,
      pricePerUnit:
        pricePerUnit !== undefined ? pricePerUnit : line.pricePerUnit,
      loadingProducts,
      error: buildAvailabilityError(requestedAmount, filteredProducts.length),
    };
  });
}

export default function SalesFormView({ onSaleCreated }) {
  const [clients, setClients] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [clientId, setClientId] = useState(null);
  const [clientType, setClientType] = useState("");
  const [invoiceNum, setInvoiceNum] = useState("");
  const [saleDate, setSaleDate] = useState(getTodayDateValue());
  const [notes, setNotes] = useState("");
  const [productLines, setProductLines] = useState([createEmptyLine()]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { showAlert, closeAlert } = useAlert();
  const alertRef = useRef(showAlert);
  const availableProductsCacheRef = useRef(new Map());
  const lineRequestsRef = useRef(new Map());

  useEffect(() => {
    alertRef.current = showAlert;
  }, [showAlert]);

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
      handleApiError(error, alertRef.current);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function clearAllocationCache() {
    availableProductsCacheRef.current.clear();
    lineRequestsRef.current.clear();
  }

  async function getAvailableProductsForModel(modelId) {
    if (availableProductsCacheRef.current.has(modelId)) {
      return availableProductsCacheRef.current.get(modelId);
    }

    const availableProducts = await getProductsByModel(modelId, "AVAILABLE");
    availableProductsCacheRef.current.set(modelId, availableProducts);
    return availableProducts;
  }

  function resetForm() {
    setClientId(null);
    setClientType("");
    setInvoiceNum("");
    setSaleDate(getTodayDateValue());
    setNotes("");
    setProductLines([createEmptyLine()]);
    setErrors({});
    clearAllocationCache();
    closeAlert();
  }

  function handleClientChange(id) {
    setClientId(id);

    const selected = clients.find((client) => client.id === id);

    setClientType(
      selected
        ? selected.type === "PRIVATE"
          ? "Privado"
          : "Distribuidor"
        : "",
    );

    setErrors((prev) => ({ ...prev, clientId: null }));
  }

  function addProductLine() {
    setProductLines((prev) => [...prev, createEmptyLine()]);
  }

  function removeProductLine(lineId) {
    if (productLines.length <= 1) return;
    lineRequestsRef.current.delete(lineId);
    setProductLines((prev) => prev.filter((line) => line.id !== lineId));
  }

  async function handleModelChange(lineId, modelId) {
    const requestToken = Symbol(`line-${lineId}`);
    lineRequestsRef.current.set(lineId, requestToken);

    if (!modelId) {
      lineRequestsRef.current.delete(lineId);
      setProductLines((prev) =>
        prev.map((line) =>
          line.id === lineId
            ? {
                ...line,
                modelId: null,
                quantity: 1,
                assignedProducts: [],
                loadingProducts: false,
                availableCount: 0,
                pricePerUnit: 0,
                error: null,
              }
            : line,
        ),
      );
      return;
    }

    const cachedProducts = availableProductsCacheRef.current.get(modelId);
    const model = models.find((item) => item.id === modelId);
    const price = model ? Number(model.priceSale) : 0;

    if (cachedProducts) {
      setProductLines((prev) => {
        const currentLine = prev.find((line) => line.id === lineId);

        if (!currentLine) {
          return prev;
        }

        const linesWithModel = prev.map((line) =>
          line.id === lineId
            ? {
                ...line,
                modelId,
                assignedProducts: [],
                pricePerUnit: price,
                error: null,
              }
            : line,
        );

        return applyLineAllocation(
          linesWithModel,
          lineId,
          cachedProducts,
          currentLine.quantity,
          {
            ensureMinimumWhenAvailable: true,
            pricePerUnit: price,
          },
        );
      });
      lineRequestsRef.current.delete(lineId);
      return;
    }

    setProductLines((prev) =>
      prev.map((line) =>
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

    try {
      const availableProducts = await getAvailableProductsForModel(modelId);

      if (lineRequestsRef.current.get(lineId) !== requestToken) {
        return;
      }

      setProductLines((prev) =>
        applyLineAllocation(
          prev.map((line) =>
            line.id === lineId
              ? { ...line, modelId, pricePerUnit: price }
              : line,
          ),
          lineId,
          availableProducts,
          prev.find((line) => line.id === lineId)?.quantity ?? 1,
          {
            ensureMinimumWhenAvailable: true,
            pricePerUnit: price,
          },
        ),
      );
    } catch {
      if (lineRequestsRef.current.get(lineId) !== requestToken) {
        return;
      }

      setProductLines((prev) =>
        prev.map((line) =>
          line.id === lineId
            ? {
                ...line,
                loadingProducts: false,
                error: "Error al cargar productos",
              }
            : line,
        ),
      );
    } finally {
      if (lineRequestsRef.current.get(lineId) === requestToken) {
        lineRequestsRef.current.delete(lineId);
      }
    }
  }

  async function handleQuantityChange(lineId, newQty) {
    const qty = clampQuantity(newQty);

    const line = productLines.find((item) => item.id === lineId);

    if (!line || !line.modelId) {
      setProductLines((prev) =>
        prev.map((item) =>
          item.id === lineId
            ? {
                ...item,
                quantity: qty,
                assignedProducts: [],
                availableCount: 0,
                error: null,
              }
            : item,
        ),
      );
      return;
    }

    const cachedProducts = availableProductsCacheRef.current.get(line.modelId);

    if (cachedProducts) {
      setProductLines((prev) =>
        applyLineAllocation(prev, lineId, cachedProducts, qty),
      );
      return;
    }

    setProductLines((prev) =>
      prev.map((item) =>
        item.id === lineId ? { ...item, quantity: qty, error: null } : item,
      ),
    );

    try {
      const availableProducts = await getAvailableProductsForModel(
        line.modelId,
      );

      setProductLines((prev) =>
        prev.find((item) => item.id === lineId)?.modelId !== line.modelId
          ? prev
          : applyLineAllocation(prev, lineId, availableProducts, qty),
      );
    } catch {
      setProductLines((prev) =>
        prev.find((item) => item.id === lineId)?.modelId !== line.modelId
          ? prev
          : prev.map((item) =>
              item.id === lineId
                ? { ...item, error: "No se pudo validar la disponibilidad" }
                : item,
            ),
      );
    }
  }

  function validate() {
    const newErrors = {};

    if (!clientId) newErrors.clientId = "Debe seleccionar un cliente";
    if (!invoiceNum.trim())
      newErrors.invoiceNum = "El número de factura es obligatorio";
    if (!saleDate) newErrors.saleDate = "La fecha de venta es obligatoria";

    const totalProducts = productLines.reduce(
      (sum, line) => sum + line.assignedProducts.length,
      0,
    );

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

    const allProductIds = productLines.flatMap((line) =>
      line.assignedProducts.map((product) => product.id),
    );

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

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label:
      client.type === "DISTRIBUTOR"
        ? client.name
        : [client.name, client.lastName1, client.lastName2]
            .filter(Boolean)
            .join(" "),
    sublabel: `${client.identityNumber} · ${client.type === "PRIVATE" ? "Privado" : "Distribuidor"}`,
  }));

  const modelOptions = models
    .filter((model) => model.status === "AVAILABLE")
    .map((model) => ({
      value: model.id,
      label: model.name,
      sublabel: `Código: ${model.modelCode} · ₡${Number(model.priceSale).toLocaleString("es-CR")}`,
    }));

  const subtotal = productLines.reduce(
    (sum, line) => sum + line.pricePerUnit * line.assignedProducts.length,
    0,
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const totalProducts = productLines.reduce(
    (sum, line) => sum + line.assignedProducts.length,
    0,
  );

  function fmtCRC(value) {
    return `₡ ${Number(value || 0).toLocaleString("es-CR", {
      minimumFractionDigits: 0,
    })}`;
  }

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

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto space-y-5">
        <ModulePanelHeader
          title="Registrar Venta"
          subtitle="Complete los datos para registrar una nueva venta"
          icon={ShoppingCart}
          variant="form"
        />

        <form onSubmit={handleSubmit} id="salesForm" className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Datos de la venta
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">
                  Cliente
                </label>
                <SearchableSelect
                  options={clientOptions}
                  value={clientId}
                  onChange={handleClientChange}
                  placeholder="Seleccione un cliente"
                  searchPlaceholder="Buscar por nombre o cédula..."
                  error={errors.clientId}
                />
                {errors.clientId && (
                  <p className="text-xs text-red-500">{errors.clientId}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-600">
                  Tipo de cliente
                </label>
                <div className="flex min-h-[46px] items-center rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                  {clientType ? (
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium shadow-none ${
                        clientType === "Distribuidor"
                          ? "border-[#ef7d2d]/20 bg-[#ef7d2d]/10 text-[#ef7d2d]"
                          : "border-[#34c3d6]/20 bg-[#34c3d6]/10 text-[#34c3d6]"
                      }`}
                    >
                      {clientType}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">
                      Sin seleccionar
                    </span>
                  )}
                </div>
              </div>

              <FormField
                id="invoiceNum"
                name="invoiceNum"
                label="Factura"
                icon={Hash}
                value={invoiceNum}
                onChange={(e) => {
                  setInvoiceNum(e.target.value);
                  setErrors((prev) => ({ ...prev, invoiceNum: null }));
                }}
                error={errors.invoiceNum}
                placeholder="Ej: FAC-2026-001"
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="saleDate"
                  className="block text-sm font-medium text-slate-600"
                >
                  Fecha
                </label>
                <AppDatePicker
                  id="saleDate"
                  name="saleDate"
                  value={saleDate}
                  onChange={(nextValue) => {
                    setSaleDate(nextValue);
                    setErrors((prev) => ({ ...prev, saleDate: null }));
                  }}
                  error={errors.saleDate}
                />
                {errors.saleDate ? (
                  <p className="text-xs text-red-500">{errors.saleDate}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Productos
              </h2>

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
                  onModelChange={(modelId) =>
                    handleModelChange(line.id, modelId)
                  }
                  onQuantityChange={(qty) => handleQuantityChange(line.id, qty)}
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.78fr)]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Resumen
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {totalProducts} producto{totalProducts !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {saleDate ? (
                    <p className="text-sm text-slate-500">
                      {formatDateValue(saleDate)}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Productos
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-800 tabular-nums">
                      {totalProducts}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Subtotal
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-800 tabular-nums">
                      {fmtCRC(subtotal)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Impuesto
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-800 tabular-nums">
                      {fmtCRC(tax)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Total
                </p>

                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold text-slate-900 tabular-nums sm:text-[2rem]">
                      {fmtCRC(total)}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      IVA 13% incluido
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-700 tabular-nums">
                      {fmtCRC(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Impuesto (13%)</span>
                    <span className="font-medium text-slate-700 tabular-nums">
                      {fmtCRC(tax)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-base font-semibold text-slate-800">
                      Total
                    </span>
                    <span className="text-lg font-bold text-slate-900 tabular-nums">
                      {fmtCRC(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <ModuleFormActions
          onReset={resetForm}
          resetText="Limpiar"
          submitText="Registrar Venta"
          submitFormId="salesForm"
          loading={submitting}
        />
      </div>
    </div>
  );
}

function ProductLineCard({
  line,
  index,
  modelOptions,
  canRemove,
  onModelChange,
  onQuantityChange,
  onRemove,
  fmtCRC,
}) {
  return (
    <div className="border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100 rounded-t-xl">
        <span className="text-sm font-medium text-slate-600">
          Producto #{index + 1}
        </span>

        {canRemove && (
          <AppToolTip message="Quitar producto" position="top">
            <button
              type="button"
              onClick={onRemove}
              aria-label="Quitar producto"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </AppToolTip>
        )}
      </div>

      <div className="p-4 space-y-4 overflow-visible">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="block text-sm font-medium text-slate-600">
              Modelo
            </label>
            <SearchableSelect
              options={modelOptions}
              value={line.modelId}
              onChange={onModelChange}
              placeholder="Seleccione un modelo"
              searchPlaceholder="Buscar modelo..."
            />
          </div>

          <div className="w-24 space-y-1.5 shrink-0">
            <label className="block text-sm font-medium text-slate-600">
              Cant.
            </label>
            <div className="space-y-1.5">
              <input
                type="number"
                min={0}
                max={line.availableCount || 99}
                value={line.quantity}
                onChange={(e) => onQuantityChange(Number(e.target.value))}
                disabled={!line.modelId}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm text-slate-700 outline-none transition-all focus:border-[#34c3d6] focus:ring-4 focus:ring-[#34c3d6]/10 disabled:bg-slate-50 disabled:text-slate-400"
              />

              <div className="min-h-4 text-center">
                {line.loadingProducts ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Loader2 size={10} className="animate-spin" />
                    Cargando
                  </span>
                ) : line.modelId ? (
                  <span className="text-[11px] text-slate-400">
                    {line.availableCount} disponible
                    {line.availableCount !== 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {line.error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle size={14} className="text-amber-500 shrink-0" />
            <span className="text-xs text-amber-700">{line.error}</span>
          </div>
        )}

        {line.assignedProducts.length > 0 && (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Productos asignados (FIFO) — {line.assignedProducts.length}{" "}
                unidad
                {line.assignedProducts.length !== 1 ? "es" : ""}
              </span>

              <span className="text-xs font-semibold text-slate-800">
                {fmtCRC(line.pricePerUnit)}
              </span>
            </div>

            <div className="divide-y divide-slate-50 max-h-40 overflow-y-auto">
              {line.assignedProducts.map((product, i) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 w-5 text-right">
                      {i + 1}.
                    </span>

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
