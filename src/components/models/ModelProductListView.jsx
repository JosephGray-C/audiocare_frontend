import { useState, useEffect, useCallback, useRef } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  getModelProducts,
  deleteModelProduct,
} from "../../services/ModelProductService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import usePermissions from "../../hooks/usePermissions";
import useListPagination from "../../hooks/useListPagination";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import AppToolTip from "../ui/AppToolTip";
import ListPagination from "../ui/ListPagination";
import TruncatedCell from "../ui/TruncatedCell";
import SearchableSelect from "../ui/SearchableSelect";
import { formatCRC, formatConvertedCurrency } from "../../utils/currency";

const STATUS_LABELS = {
  AVAILABLE: "Disponible",
  NO_STOCK: "Sin Stock",
};

const STATUS_STYLES = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NO_STOCK: "bg-slate-50 text-slate-500 border-slate-200",
};

const MODEL_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "NO_STOCK", label: "Sin Stock" },
];

export default function ModelProductListView({
  refreshKey = 0,
  onStartCreate,
  onStartEdit,
}) {
  const [models, setModels] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { showAlert, showConfirm } = useAlert();
  const alertRef = useRef(showAlert);
  const { canWrite } = usePermissions();
  const hasWriteAccess = canWrite("models");

  useEffect(() => {
    alertRef.current = showAlert;
  }, [showAlert]);

  const fetchModels = useCallback(async () => {
    try {
      setLoadingData(true);
      const data = await getModelProducts();
      setModels(data);
    } catch (error) {
      handleApiError(error, alertRef.current);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels, refreshKey]);

  useEffect(() => {
    let result = models;

    if (statusFilter !== "ALL") {
      result = result.filter((model) => model.status === statusFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          String(model.modelCode).includes(query),
      );
    }

    setFiltered(result);
  }, [models, search, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedModels,
    totalPages,
    visibleStart,
    visibleEnd,
  } = useListPagination(filtered);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, refreshKey, setCurrentPage]);

  function handleOpenDelete(model) {
    showConfirm({
      title: "Eliminar modelo",
      message: `¿Seguro de eliminar el modelo? Si tiene productos asociados, la eliminación fallará.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      severity: "error",
      onConfirm: async () => {
        try {
          await deleteModelProduct(model.id);
          showAlert("Modelo eliminado correctamente", "success");
          await fetchModels();
        } catch (error) {
          handleApiError(error, showAlert);
        }
      },
    });
  }

  function fmtCRC(value) {
    const formatted = formatCRC(String(Math.round(Number(value || 0))));
    return `₡ ${formatted || "0"}`;
  }

  function fmtEUR(value) {
    return `€ ${formatConvertedCurrency(value)}`;
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("ALL");
  }

  function renderModelActions(model) {
    if (!hasWriteAccess) return null;

    return (
      <div className="flex items-center justify-center gap-1">
        <AppToolTip message="Editar" position="top">
          <button
            type="button"
            onClick={() => onStartEdit?.(model)}
            aria-label="Editar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#34c3d6]/10 hover:text-[#34c3d6]"
          >
            <Pencil size={14} />
          </button>
        </AppToolTip>

        <AppToolTip message="Eliminar" position="top">
          <button
            type="button"
            onClick={() => handleOpenDelete(model)}
            aria-label="Eliminar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </AppToolTip>
      </div>
    );
  }

  const hasActiveFilters = search.trim() || statusFilter !== "ALL";

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
      Nuevo Modelo
    </button>
  ) : null;

  return (
    <div className="space-y-5">
      <ModulePanelHeader
        title="Modelos de Producto"
        subtitle={`${models.length} modelo${models.length !== 1 ? "s" : ""} registrado${models.length !== 1 ? "s" : ""}`}
        icon={Package}
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
              placeholder="Buscar por nombre o código..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-[#34c3d6] focus:ring-4 focus:ring-[#34c3d6]/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-none">
            <SearchableSelect
              options={MODEL_STATUS_OPTIONS}
              value={statusFilter === "ALL" ? null : statusFilter}
              onChange={(nextValue) => setStatusFilter(nextValue || "ALL")}
              placeholder="Estado"
              searchPlaceholder="Buscar estado..."
              icon={Filter}
              variant="filter"
              showSearch={false}
              clearAriaLabel="Limpiar estado"
              className="w-full sm:w-[12rem]"
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
                <span className="text-sm">Cargando modelos...</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Package size={32} strokeWidth={1.5} />
                <span className="text-sm">
                  {hasActiveFilters
                    ? "No se encontraron resultados"
                    : "No hay modelos registrados"}
                </span>
              </div>
            </div>
          ) : (
            paginatedModels.map((model) => (
              <article key={model.id} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {model.modelCode}
                    </span>
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {model.name}
                    </p>
                  </div>

                  <span
                    className={`
                                            inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium shadow-none
                                            ${STATUS_STYLES[model.status] || "border-slate-200 bg-slate-50 text-slate-500"}
                                        `}
                  >
                    {STATUS_LABELS[model.status] || model.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Precio venta</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {fmtCRC(model.priceSale)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Costo fábrica (₡)</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {fmtCRC(model.costFabricCrc)}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-slate-400">Costo fábrica (€)</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {fmtEUR(model.costFabricEur)}
                    </p>
                  </div>
                </div>

                {hasWriteAccess && (
                  <div className="border-t border-slate-100 pt-2">
                    {renderModelActions(model)}
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
                <th className="w-[7rem] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Nombre
                </th>
                <th className="w-[8.5rem] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Precio
                </th>
                <th className="w-[7rem] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                      <span className="text-sm">Cargando modelos...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Package size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {hasActiveFilters
                          ? "No se encontraron resultados"
                          : "No hay modelos registrados"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedModels.map((model) => (
                  <tr
                    key={model.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3.5 align-top">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 font-mono text-sm text-slate-700">
                        {model.modelCode}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <TruncatedCell
                        value={model.name}
                        className="w-full"
                        contentClassName="max-w-full text-sm font-medium text-slate-800"
                      />
                    </td>

                    <td className="px-4 py-3.5 text-right align-top">
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {fmtCRC(model.priceSale)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center align-top">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium shadow-none ${
                          STATUS_STYLES[model.status] ||
                          "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {STATUS_LABELS[model.status] || model.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      {renderModelActions(model)}
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
                  Código
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Precio Venta
                </th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                  Costo Fábrica (₡)
                </th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                  Costo Fábrica (€)
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
                      <span className="text-sm">Cargando modelos...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Package size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {hasActiveFilters
                          ? "No se encontraron resultados"
                          : "No hay modelos registrados"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedModels.map((model) => (
                  <tr
                    key={model.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {model.modelCode}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <TruncatedCell
                        value={model.name}
                        className="w-full"
                        contentClassName="max-w-[18rem] text-sm font-medium text-slate-800"
                      />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {fmtCRC(model.priceSale)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                      <span className="text-slate-600 tabular-nums">
                        {fmtCRC(model.costFabricCrc)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                      <span className="text-slate-600 tabular-nums">
                        {fmtEUR(model.costFabricEur)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`
                                                    inline-block px-2.5 py-1 rounded-full
                                                    text-xs font-medium border shadow-none
                                                    ${STATUS_STYLES[model.status] || "bg-slate-50 text-slate-500 border-slate-200"}
                                                `}
                      >
                        {STATUS_LABELS[model.status] || model.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">{renderModelActions(model)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loadingData && filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              Mostrando {visibleStart}–{visibleEnd} de {filtered.length} modelo
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
