import { useState, useEffect, useCallback, useRef } from "react";
import {
  Hash,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Loader2,
  Package,
  Truck,
} from "lucide-react";
import { getAllProducts, deleteProduct } from "../../services/ProductService";
import { getModelProducts } from "../../services/ModelProductService";
import { getSupplierOrders } from "../../services/SupplierorderService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import usePermissions from "../../hooks/usePermissions";
import useListPagination from "../../hooks/useListPagination";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import AppToolTip from "../ui/AppToolTip";
import ListPagination from "../ui/ListPagination";
import TruncatedCell from "../ui/TruncatedCell";
import SearchableSelect from "../ui/SearchableSelect";

const STATUS_LABELS = {
  AVAILABLE: "Disponible",
  BILLED: "Facturado",
};

const STATUS_STYLES = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BILLED: "bg-blue-50 text-blue-700 border-blue-200",
};

const PRODUCT_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "BILLED", label: "Facturado" },
];

export default function ProductListView({
  refreshKey = 0,
  onStartCreate,
  onStartEdit,
}) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modelFilter, setModelFilter] = useState("ALL");
  const [supplierFilter, setSupplierFilter] = useState("ALL");

  const [models, setModels] = useState([]);
  const [supplierOrders, setSupplierOrders] = useState([]);

  const { showAlert, showConfirm } = useAlert();
  const alertRef = useRef(showAlert);
  const { canWrite } = usePermissions();
  const hasWriteAccess = canWrite("products");

  useEffect(() => {
    alertRef.current = showAlert;
  }, [showAlert]);

  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true);

      const [productsData, modelsData, ordersData] = await Promise.all([
        getAllProducts(),
        getModelProducts(),
        getSupplierOrders(),
      ]);

      setProducts(productsData);
      setModels(modelsData);
      setSupplierOrders(ordersData);
    } catch (error) {
      handleApiError(error, alertRef.current);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  useEffect(() => {
    let result = products;

    if (statusFilter !== "ALL") {
      result = result.filter((product) => product.status === statusFilter);
    }

    if (modelFilter !== "ALL") {
      result = result.filter(
        (product) => product.model?.id === Number(modelFilter),
      );
    }

    if (supplierFilter !== "ALL") {
      result = result.filter(
        (product) => product.supplierOrder?.id === Number(supplierFilter),
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (product) =>
          product.serialNum.toLowerCase().includes(q) ||
          (product.model?.name && product.model.name.toLowerCase().includes(q)),
      );
    }

    setFiltered(result);
  }, [products, search, statusFilter, modelFilter, supplierFilter]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedProducts,
    totalPages,
    visibleStart,
    visibleEnd,
  } = useListPagination(filtered);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    modelFilter,
    supplierFilter,
    refreshKey,
    setCurrentPage,
  ]);

  function handleOpenDelete(product) {
    if (product.status === "BILLED") {
      showAlert("No se puede eliminar un producto ya facturado", "warning");
      return;
    }

    showConfirm({
      title: "Eliminar producto",
      message: `¿Seguro de eliminar el producto? Se eliminará del inventario y se generará el movimiento correspondiente.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      severity: "error",
      onConfirm: async () => {
        try {
          await deleteProduct(product.id);
          showAlert("Producto eliminado correctamente", "success");
          await fetchData();
        } catch (error) {
          handleApiError(error, showAlert);
        }
      },
    });
  }

  function handleEditClick(product) {
    if (product.status === "BILLED") {
      showAlert("No se puede editar un producto ya facturado", "warning");
      return;
    }

    onStartEdit?.(product);
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setModelFilter("ALL");
    setSupplierFilter("ALL");
  }

  function fmtDate(dateStr) {
    if (!dateStr) return "—";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function renderProductActions(product) {
    if (!hasWriteAccess) return null;

    const editMessage =
      product.status === "BILLED" ? "No editable (facturado)" : "Editar";
    const deleteMessage =
      product.status === "BILLED" ? "No eliminable (facturado)" : "Eliminar";

    return (
      <div className="flex items-center justify-center gap-1">
        <AppToolTip message={editMessage} position="top">
          <button
            type="button"
            onClick={() => handleEditClick(product)}
            aria-label={editMessage}
            className={`
                            flex h-8 w-8 items-center justify-center rounded-lg transition-colors
                            ${
                              product.status === "BILLED"
                                ? "cursor-not-allowed text-slate-300"
                                : "text-slate-400 hover:bg-[#34c3d6]/10 hover:text-[#34c3d6]"
                            }
                        `}
          >
            <Pencil size={14} />
          </button>
        </AppToolTip>

        <AppToolTip message={deleteMessage} position="top">
          <button
            type="button"
            onClick={() => handleOpenDelete(product)}
            aria-label={deleteMessage}
            className={`
                            flex h-8 w-8 items-center justify-center rounded-lg transition-colors
                            ${
                              product.status === "BILLED"
                                ? "cursor-not-allowed text-slate-300"
                                : "text-slate-400 hover:bg-red-50 hover:text-red-500"
                            }
                        `}
          >
            <Trash2 size={14} />
          </button>
        </AppToolTip>
      </div>
    );
  }

  const hasActiveFilters =
    search ||
    statusFilter !== "ALL" ||
    modelFilter !== "ALL" ||
    supplierFilter !== "ALL";
  const modelFilterOptions = models.map((model) => ({
    value: String(model.id),
    label: model.name,
    sublabel: `Código ${model.modelCode}`,
  }));
  const supplierFilterOptions = supplierOrders.map((order) => ({
    value: String(order.id),
    label: order.name,
    sublabel: fmtDate(order.receivedDate),
  }));

  const headerActions = hasWriteAccess ? (
    <button
      type="button"
      onClick={onStartCreate}
      className="
                flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-[#34c3d6] text-white text-sm font-semibold
                hover:bg-[#28b4c8] transition-colors
            "
    >
      <Plus size={16} />
      Nuevo Producto
    </button>
  ) : null;

  return (
    <div className="space-y-5">
      <ModulePanelHeader
        title="Productos"
        subtitle={`${products.length} producto${products.length !== 1 ? "s" : ""} registrado${products.length !== 1 ? "s" : ""}`}
        icon={Hash}
        variant="list"
        actions={headerActions}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por serie o modelo..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-[#34c3d6] focus:ring-4 focus:ring-[#34c3d6]/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)_auto] lg:flex-none">
            <SearchableSelect
              options={PRODUCT_STATUS_OPTIONS}
              value={statusFilter === "ALL" ? null : statusFilter}
              onChange={(nextValue) => setStatusFilter(nextValue || "ALL")}
              placeholder="Estado"
              searchPlaceholder="Buscar estado..."
              icon={Filter}
              variant="filter"
              showSearch={false}
              clearAriaLabel="Limpiar estado"
              className="w-full"
            />

            <SearchableSelect
              options={modelFilterOptions}
              value={modelFilter === "ALL" ? null : String(modelFilter)}
              onChange={(nextValue) => setModelFilter(nextValue || "ALL")}
              placeholder="Modelo"
              searchPlaceholder="Buscar modelo..."
              icon={Package}
              variant="filter"
              clearAriaLabel="Limpiar modelo"
              className="w-full"
            />

            <SearchableSelect
              options={supplierFilterOptions}
              value={supplierFilter === "ALL" ? null : String(supplierFilter)}
              onChange={(nextValue) => setSupplierFilter(nextValue || "ALL")}
              placeholder="Pedido"
              searchPlaceholder="Buscar pedido..."
              icon={Truck}
              variant="filter"
              clearAriaLabel="Limpiar pedido"
              className="w-full"
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl px-3 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {loadingData ? (
            <div className="px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm">Cargando productos...</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Hash size={32} strokeWidth={1.5} />
                <span className="text-sm">
                  {hasActiveFilters
                    ? "No se encontraron resultados"
                    : "No hay productos registrados"}
                </span>
              </div>
            </div>
          ) : (
            paginatedProducts.map((product) => (
              <article key={product.id} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {product.serialNum}
                    </span>

                    <div>
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {product.model?.name || "—"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Código: {product.model?.modelCode || "—"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`
                                            inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium shadow-none
                                            ${STATUS_STYLES[product.status] || "border-slate-200 bg-slate-50 text-slate-500"}
                                        `}
                  >
                    {STATUS_LABELS[product.status] || product.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Ingreso</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {fmtDate(product.entryDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Venta</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {product.saleDate ? fmtDate(product.saleDate) : "—"}
                    </p>
                  </div>

                  <div className="col-span-2 min-w-0">
                    <p className="text-slate-400">Pedido proveedor</p>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {product.supplierOrder?.name || "—"}
                    </p>
                  </div>
                </div>

                {hasWriteAccess && (
                  <div className="border-t border-slate-100 pt-2">
                    {renderProductActions(product)}
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block xl:hidden">
          <table className="w-full table-fixed text-[13px]">
            <thead>
              <tr className="border-t border-slate-100">
                <th className="w-[8.5rem] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Serie
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Modelo
                </th>
                <th className="w-[11rem] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Pedido
                </th>
                <th className="w-[7.5rem] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Estado
                </th>
                <th className="w-[6rem] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingData ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-sm">Cargando productos...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Hash size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {hasActiveFilters
                          ? "No se encontraron resultados"
                          : "No hay productos registrados"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3.5 align-top">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 font-mono text-sm text-slate-700">
                        {product.serialNum}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <div className="min-w-0">
                        <TruncatedCell
                          value={product.model?.name}
                          className="w-full"
                          contentClassName="max-w-full text-sm font-medium text-slate-800"
                        />
                        <span className="mt-1 block truncate text-xs text-slate-400">
                          Código: {product.model?.modelCode || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <TruncatedCell
                        value={product.supplierOrder?.name}
                        className="w-full"
                        contentClassName="max-w-full text-sm text-slate-600"
                      />
                    </td>

                    <td className="px-4 py-3.5 text-center align-top">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium shadow-none ${
                          STATUS_STYLES[product.status] ||
                          "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {STATUS_LABELS[product.status] || product.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      {renderProductActions(product)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-100">
                <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Serie
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Modelo
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                  Pedido Proveedor
                </th>
                <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Ingreso
                </th>
                <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">
                  Venta
                </th>
                <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingData ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-sm">Cargando productos...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Hash size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {hasActiveFilters
                          ? "No se encontraron resultados"
                          : "No hay productos registrados"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {product.serialNum}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="min-w-0">
                          <TruncatedCell
                            value={product.model?.name}
                            className="w-full"
                            contentClassName="max-w-[18rem] text-sm font-medium text-slate-800"
                          />
                          <span className="text-xs text-slate-400">
                            Código: {product.model?.modelCode || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <TruncatedCell
                          value={product.supplierOrder?.name}
                          className="w-full"
                          contentClassName="max-w-[14rem] text-sm text-slate-600"
                        />
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="text-slate-600 text-sm">
                          {fmtDate(product.entryDate)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center hidden md:table-cell">
                        <span className="text-slate-500 text-sm">
                          {product.saleDate ? fmtDate(product.saleDate) : "—"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`
                                                    inline-block px-2.5 py-1 rounded-full
                                                    text-xs font-medium border shadow-none
                                                    ${STATUS_STYLES[product.status] || "bg-slate-50 text-slate-500 border-slate-200"}
                                                `}
                        >
                          {STATUS_LABELS[product.status] || product.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {renderProductActions(product)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loadingData && filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              Mostrando {visibleStart}–{visibleEnd} de {filtered.length}{" "}
              producto
              {filtered.length !== 1 ? "s" : ""}
            </p>

            <ListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="ml-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}
