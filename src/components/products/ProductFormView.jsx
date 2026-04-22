import { useState, useEffect } from "react";
import { Hash, Package, Truck, Calendar } from "lucide-react";
import { getModelProducts } from "../../services/modelProductService";
import { getSupplierOrders } from "../../services/Supplierorderservice";
import { createProduct, updateProduct } from "../../services/Productservice";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import SearchableSelect from "../ui/SearchableSelect";
import FormField from "../form/FormField";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import ModuleFormActions from "../ui/ModuleFormActions";

const EMPTY_FORM = {
  serialNum: "",
  modelId: null,
  supplierOrderId: null,
  entryDate: "",
};

function getInitialForm(product) {
  if (!product) return EMPTY_FORM;

  return {
    serialNum: product.serialNum || "",
    modelId: product.model?.id ?? null,
    supplierOrderId: product.supplierOrder?.id ?? null,
    entryDate: product.entryDate || "",
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProductFormView({ product = null, onSaved }) {
  const [formData, setFormData] = useState(getInitialForm(product));
  const [errors, setErrors] = useState({});

  const [modelOptions, setModelOptions] = useState([]);
  const [supplierOrderOptions, setSupplierOrderOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  const { showAlert, closeAlert } = useAlert();

  const isEdit = !!product;

  useEffect(() => {
    setFormData(getInitialForm(product));
    setErrors({});
  }, [product]);

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);

      try {
        const [models, orders] = await Promise.all([
          getModelProducts(),
          getSupplierOrders(),
        ]);

        setModelOptions(
          models.map((model) => ({
            value: model.id,
            label: model.name,
            sublabel: `Código: ${model.modelCode} · ₡${Number(model.priceSale).toLocaleString("es-CR")}`,
          })),
        );

        setSupplierOrderOptions(
          orders.map((order) => ({
            value: order.id,
            label: order.name,
            sublabel: `Recibido: ${formatDate(order.receivedDate)} · ₡${Number(order.totalAmountCrc).toLocaleString("es-CR")}`,
          })),
        );
      } catch (error) {
        handleApiError(error, showAlert);
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, [showAlert]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function handleSelectChange(name, value) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function handleReset() {
    setFormData(getInitialForm(product));
    setErrors({});
    closeAlert();
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

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showAlert("Hay errores en el formulario", "warning");
      return;
    }

    const payload = {
      serialNum: formData.serialNum.trim(),
      modelId: formData.modelId,
      supplierOrderId: formData.supplierOrderId,
      entryDate: formData.entryDate,
    };

    try {
      setLoading(true);

      if (isEdit) {
        await updateProduct(product.id, payload);
        showAlert("Producto actualizado correctamente", "success");
      } else {
        await createProduct(payload);
        showAlert("Producto registrado correctamente", "success");
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

  function renderSelectField({
    name,
    label,
    icon,
    options,
    placeholder,
    searchPlaceholder,
  }) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-600">
          {label}
        </label>

        <SearchableSelect
          options={options}
          value={formData[name]}
          onChange={(value) => handleSelectChange(name, value)}
          placeholder={loadingOptions ? "Cargando..." : placeholder}
          searchPlaceholder={searchPlaceholder}
          icon={icon}
          error={errors[name]}
          disabled={loadingOptions}
        />

        {errors[name] ? (
          <p className="text-xs text-red-500">{errors[name]}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto space-y-5">
        <ModulePanelHeader
          title={isEdit ? "Editar Producto" : "Registrar Producto"}
          subtitle={
            isEdit
              ? "Actualice la información del producto seleccionado"
              : "Complete los datos para registrar un nuevo producto"
          }
          icon={Hash}
          variant="form"
        />

        <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Datos del producto
            </h2>

            <FormField
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

            <FormField
              name="entryDate"
              label="Fecha de Ingreso"
              icon={Calendar}
              dateTooltip="Seleccionar fecha de ingreso"
              type="date"
              value={formData.entryDate}
              onChange={handleChange}
              error={errors.entryDate}
              placeholder="Seleccione fecha"
            />

            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                El producto se registrará con estado{" "}
                <span className="font-semibold text-emerald-600">
                  DISPONIBLE
                </span>{" "}
                y se generará un movimiento de inventario automáticamente.
              </p>
            </div>
          </div>
        </form>

        <ModuleFormActions
          onReset={handleReset}
          resetText="Limpiar"
          submitText={isEdit ? "Actualizar Producto" : "Guardar Producto"}
          submitFormId="productForm"
          loading={loading}
        />
      </div>
    </div>
  );
}
