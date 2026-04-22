import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Boxes,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Loader2,
  Package,
} from "lucide-react";
import { getAllProducts } from "../services/ProductService";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";
import { formatCRC } from "../utils/currency";
import useListPagination from "../hooks/useListPagination";
import ListPagination from "../components/ui/ListPagination";
import TruncatedCell from "../components/ui/TruncatedCell";
import SearchableSelect from "../components/ui/SearchableSelect";

const STATUS_STYLES = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BILLED: "bg-blue-50 text-blue-700 border-blue-200",
};

const INVENTORY_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Disponibles" },
  { value: "BILLED", label: "Facturados" },
];

export default function Inventario() {
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedModels, setExpandedModels] = useState(new Set());

  const { showAlert } = useAlert();
  const alertRef = useRef(showAlert);

  useEffect(() => {
    alertRef.current = showAlert;
  }, [showAlert]);

  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true);
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      handleApiError(error, alertRef.current);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const years = useMemo(() => {
    const yearSet = new Set();

    products.forEach((product) => {
      if (product.entryDate) {
        yearSet.add(product.entryDate.substring(0, 4));
      }
    });

    return Array.from(yearSet).sort().reverse();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (yearFilter !== "ALL") {
      result = result.filter(
        (product) =>
          product.entryDate && product.entryDate.startsWith(yearFilter),
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((product) => product.status === statusFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (product) =>
          (product.model?.name &&
            product.model.name.toLowerCase().includes(query)) ||
          (product.serialNum &&
            product.serialNum.toLowerCase().includes(query)) ||
          (product.model?.modelCode &&
            String(product.model.modelCode).includes(query)),
      );
    }

    return result;
  }, [products, yearFilter, statusFilter, search]);

  const groupedModels = useMemo(() => {
    const groups = new Map();

    filteredProducts.forEach((product) => {
      const modelId = product.model?.id;
      if (!modelId) return;

      if (!groups.has(modelId)) {
        groups.set(modelId, {
          id: modelId,
          name: product.model.name,
          modelCode: product.model.modelCode,
          priceSale: product.model.priceSale,
          costFabricCrc: product.model.costFabricCrc,
          costFabricEur: product.model.costFabricEur,
          status: product.model.status,
          products: [],
          availableCount: 0,
          billedCount: 0,
          totalCount: 0,
          oldestEntry: null,
        });
      }

      const group = groups.get(modelId);
      group.products.push(product);
      group.totalCount += 1;

      if (product.status === "AVAILABLE") group.availableCount += 1;
      if (product.status === "BILLED") group.billedCount += 1;

      if (!group.oldestEntry || product.entryDate < group.oldestEntry) {
        group.oldestEntry = product.entryDate;
      }
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [filteredProducts]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedGroups,
    totalPages,
    visibleStart,
    visibleEnd,
  } = useListPagination(groupedModels);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, yearFilter, statusFilter, setCurrentPage]);

  const totalAvailable = groupedModels.reduce(
    (sum, group) => sum + group.availableCount,
    0,
  );
  const totalBilled = groupedModels.reduce(
    (sum, group) => sum + group.billedCount,
    0,
  );
  const totalProducts = groupedModels.reduce(
    (sum, group) => sum + group.totalCount,
    0,
  );
  const modelsInStock = groupedModels.filter(
    (group) => group.availableCount > 0,
  ).length;
  const hasActiveFilters =
    search || yearFilter !== "ALL" || statusFilter !== "ALL";

  function toggleExpand(modelId) {
    setExpandedModels((previousExpanded) => {
      const nextExpanded = new Set(previousExpanded);

      if (nextExpanded.has(modelId)) {
        nextExpanded.delete(modelId);
      } else {
        nextExpanded.add(modelId);
      }

      return nextExpanded;
    });
  }

  function fmtDate(dateStr) {
    if (!dateStr) return "—";
    const date = new Date(`${dateStr}T00:00:00`);

    return date.toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function fmtCRC(value) {
    const formatted = formatCRC(String(Math.round(Number(value || 0))));
    return `₡ ${formatted || "0"}`;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#34c3d6]/10">
          <Boxes size={20} className="text-[#34c3d6]" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Inventario de Stock
          </h1>
          <p className="text-sm text-slate-400">
            Supervise y gestione el stock físico disponible
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Modelos en stock"
          value={modelsInStock}
          color="#34c3d6"
        />
        <SummaryCard
          label="Unidades disponibles"
          value={totalAvailable}
          color="#22c55e"
        />
        <SummaryCard
          label="Unidades facturadas"
          value={totalBilled}
          color="#3b82f6"
        />
        <SummaryCard
          label="Total unidades"
          value={totalProducts}
          color="#64748b"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto px-5 pb-2 pt-4">
          <button
            type="button"
            onClick={() => setYearFilter("ALL")}
            className={`
                            whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors
                            ${
                              yearFilter === "ALL"
                                ? "bg-[#34c3d6]/10 text-[#34c3d6]"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            }
                        `}
          >
            Todos
          </button>

          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setYearFilter(year)}
              className={`
                                whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors
                                ${
                                  yearFilter === year
                                    ? "bg-[#34c3d6]/10 text-[#34c3d6]"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                }
                            `}
            >
              {year}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por modelo, código o serie..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-[#34c3d6] focus:ring-4 focus:ring-[#34c3d6]/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-none">
            <SearchableSelect
              options={INVENTORY_STATUS_OPTIONS}
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
                onClick={() => {
                  setSearch("");
                  setYearFilter("ALL");
                  setStatusFilter("ALL");
                }}
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
                <span className="text-sm">Cargando inventario...</span>
              </div>
            </div>
          ) : groupedModels.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Boxes size={32} strokeWidth={1.5} />
                <span className="text-sm">
                  {hasActiveFilters
                    ? "No se encontraron resultados"
                    : "No hay productos en inventario"}
                </span>
              </div>
            </div>
          ) : (
            paginatedGroups.map((group) => (
              <ModelCard
                key={group.id}
                group={group}
                isExpanded={expandedModels.has(group.id)}
                onToggle={() => toggleExpand(group.id)}
                fmtDate={fmtDate}
                fmtCRC={fmtCRC}
              />
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block xl:hidden">
          <table className="w-full table-fixed text-[13px]">
            <thead>
              <tr className="border-t border-slate-100">
                <th className="w-10 px-3 py-3" />
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Modelo
                </th>
                <th className="w-[7rem] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Stock
                </th>
                <th className="w-[8.5rem] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Precio
                </th>
                <th className="w-[7rem] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingData ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-sm">Cargando inventario...</span>
                    </div>
                  </td>
                </tr>
              ) : groupedModels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Boxes size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {hasActiveFilters
                          ? "No se encontraron resultados"
                          : "No hay productos en inventario"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((group) => (
                  <ModelRowMedium
                    key={group.id}
                    group={group}
                    isExpanded={expandedModels.has(group.id)}
                    onToggle={() => toggleExpand(group.id)}
                    fmtDate={fmtDate}
                    fmtCRC={fmtCRC}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-100">
                <th className="w-10 px-3 py-3" />
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Modelo
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Código
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Disponibles
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Facturados
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Primera Entrada
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Precio Venta
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Estado Modelo
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingData ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-sm">Cargando inventario...</span>
                    </div>
                  </td>
                </tr>
              ) : groupedModels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Boxes size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {hasActiveFilters
                          ? "No se encontraron resultados"
                          : "No hay productos en inventario"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((group) => (
                  <ModelRow
                    key={group.id}
                    group={group}
                    isExpanded={expandedModels.has(group.id)}
                    onToggle={() => toggleExpand(group.id)}
                    fmtDate={fmtDate}
                    fmtCRC={fmtCRC}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loadingData && groupedModels.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              Mostrando {visibleStart}–{visibleEnd} de {groupedModels.length}{" "}
              modelo
              {groupedModels.length !== 1 ? "s" : ""}
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

function SummaryCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function ModelCard({ group, isExpanded, onToggle, fmtDate, fmtCRC }) {
  const modelStatusStyle =
    group.availableCount > 0
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-500";
  const modelStatusLabel =
    group.availableCount > 0 ? "Disponible" : "Sin Stock";
  const sortedProducts = [...group.products].sort((a, b) =>
    (a.entryDate || "").localeCompare(b.entryDate || ""),
  );

  return (
    <article className="px-5 py-4">
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-start gap-3">
          <div className="pt-0.5 text-slate-400">
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ef7d2d]/10">
                    <Package size={14} className="text-[#ef7d2d]" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {group.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Código: {group.modelCode}
                    </p>
                  </div>
                </div>
              </div>

              <span
                className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium shadow-none ${modelStatusStyle}`}
              >
                {modelStatusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400">Disponibles</p>
                <p className="mt-1 text-sm font-semibold text-emerald-600 tabular-nums">
                  {group.availableCount}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Facturados</p>
                <p className="mt-1 text-sm text-slate-500 tabular-nums">
                  {group.billedCount}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Total</p>
                <p className="mt-1 text-sm font-semibold text-slate-700 tabular-nums">
                  {group.totalCount}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Precio venta</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {fmtCRC(group.priceSale)}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-slate-400">Primera entrada</p>
                <p className="mt-1 text-sm text-slate-500">
                  {fmtDate(group.oldestEntry)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-600">
                  {product.serialNum}
                </span>

                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-none ${STATUS_STYLES[product.status]}`}
                >
                  {product.status === "AVAILABLE" ? "Disponible" : "Facturado"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400">Ingreso</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {fmtDate(product.entryDate)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400">Venta</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {product.saleDate ? fmtDate(product.saleDate) : "—"}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-slate-400">Pedido proveedor</p>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {product.supplierOrder?.name || "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function ModelRowMedium({ group, isExpanded, onToggle, fmtDate, fmtCRC }) {
  const modelStatusStyle =
    group.availableCount > 0
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-50 text-slate-500 border-slate-200";
  const modelStatusLabel =
    group.availableCount > 0 ? "Disponible" : "Sin Stock";
  const sortedProducts = [...group.products].sort((a, b) =>
    (a.entryDate || "").localeCompare(b.entryDate || ""),
  );

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer transition-colors hover:bg-slate-50/60"
      >
        <td className="px-3 py-3.5 text-center align-top">
          {isExpanded ? (
            <ChevronDown size={16} className="mx-auto text-slate-400" />
          ) : (
            <ChevronRight size={16} className="mx-auto text-slate-400" />
          )}
        </td>

        <td className="px-4 py-3.5 align-top">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ef7d2d]/10">
              <Package size={14} className="text-[#ef7d2d]" />
            </div>

            <div className="min-w-0">
              <TruncatedCell
                value={group.name}
                className="w-full"
                contentClassName="max-w-full text-sm font-medium text-slate-800"
              />
              <span className="mt-1 block truncate text-xs text-slate-400">
                Código: {group.modelCode}
              </span>
            </div>
          </div>
        </td>

        <td className="px-4 py-3.5 text-center align-top">
          <div>
            <span className="block font-semibold text-emerald-600 tabular-nums">
              {group.availableCount}/{group.totalCount}
            </span>
            <span className="mt-1 block text-[11px] text-slate-400">
              {group.billedCount} fact.
            </span>
          </div>
        </td>

        <td className="px-4 py-3.5 text-right align-top">
          <span className="font-semibold text-slate-800 tabular-nums">
            {fmtCRC(group.priceSale)}
          </span>
        </td>

        <td className="px-4 py-3.5 text-center align-top">
          <span
            className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium shadow-none ${modelStatusStyle}`}
          >
            {modelStatusLabel}
          </span>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-0 py-0">
            <div className="grid gap-2 border-y border-slate-100 bg-slate-50/80 p-3 md:grid-cols-2">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-slate-200 bg-white/80 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-600">
                      {product.serialNum}
                    </span>

                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-none ${STATUS_STYLES[product.status]}`}
                    >
                      {product.status === "AVAILABLE"
                        ? "Disponible"
                        : "Facturado"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2">
                      <p className="text-slate-400">Pedido proveedor</p>
                      <TruncatedCell
                        value={product.supplierOrder?.name}
                        className="mt-1 w-full"
                        contentClassName="max-w-full text-sm text-slate-500"
                      />
                    </div>

                    <div>
                      <p className="text-slate-400">Ingreso</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {fmtDate(product.entryDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Venta</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {product.saleDate ? fmtDate(product.saleDate) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ModelRow({ group, isExpanded, onToggle, fmtDate, fmtCRC }) {
  const modelStatusStyle =
    group.availableCount > 0
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-50 text-slate-500 border-slate-200";
  const modelStatusLabel =
    group.availableCount > 0 ? "Disponible" : "Sin Stock";
  const sortedProducts = [...group.products].sort((a, b) =>
    (a.entryDate || "").localeCompare(b.entryDate || ""),
  );

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer transition-colors hover:bg-slate-50/60"
      >
        <td className="px-3 py-3.5 text-center">
          {isExpanded ? (
            <ChevronDown size={16} className="mx-auto text-slate-400" />
          ) : (
            <ChevronRight size={16} className="mx-auto text-slate-400" />
          )}
        </td>

        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ef7d2d]/10">
              <Package size={14} className="text-[#ef7d2d]" />
            </div>

            <TruncatedCell
              value={group.name}
              className="w-full"
              contentClassName="max-w-[18rem] text-sm font-medium text-slate-800"
            />
          </div>
        </td>

        <td className="px-5 py-3.5">
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm text-slate-600">
            {group.modelCode}
          </span>
        </td>

        <td className="px-5 py-3.5 text-center">
          <span className="font-semibold tabular-nums text-emerald-600">
            {group.availableCount}
          </span>
        </td>

        <td className="px-5 py-3.5 text-center">
          <span className="tabular-nums text-slate-500">
            {group.billedCount}
          </span>
        </td>

        <td className="px-5 py-3.5 text-center">
          <span className="font-semibold tabular-nums text-slate-700">
            {group.totalCount}
          </span>
        </td>

        <td className="px-5 py-3.5 text-center">
          <span className="text-sm text-slate-500">
            {fmtDate(group.oldestEntry)}
          </span>
        </td>

        <td className="px-5 py-3.5 text-right">
          <span className="font-semibold tabular-nums text-slate-800">
            {fmtCRC(group.priceSale)}
          </span>
        </td>

        <td className="px-5 py-3.5 text-center">
          <span
            className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium shadow-none ${modelStatusStyle}`}
          >
            {modelStatusLabel}
          </span>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={9} className="px-0 py-0">
            <div className="border-y border-slate-100 bg-slate-50/80">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="py-2.5 pl-16 pr-5 text-left text-xs font-medium text-slate-400">
                      Serie
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-400">
                      Pedido Proveedor
                    </th>
                    <th className="px-5 py-2.5 text-center text-xs font-medium text-slate-400">
                      Fecha Ingreso
                    </th>
                    <th className="px-5 py-2.5 text-center text-xs font-medium text-slate-400">
                      Fecha Venta
                    </th>
                    <th className="px-5 py-2.5 text-center text-xs font-medium text-slate-400">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100/80">
                  {sortedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-white/60"
                    >
                      <td className="py-2.5 pl-16 pr-5">
                        <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-600">
                          {product.serialNum}
                        </span>
                      </td>

                      <td className="px-5 py-2.5">
                        <TruncatedCell
                          value={product.supplierOrder?.name}
                          className="w-full"
                          contentClassName="max-w-[12rem] text-xs text-slate-500"
                        />
                      </td>

                      <td className="px-5 py-2.5 text-center">
                        <span className="text-xs text-slate-500">
                          {fmtDate(product.entryDate)}
                        </span>
                      </td>

                      <td className="px-5 py-2.5 text-center">
                        <span className="text-xs text-slate-400">
                          {product.saleDate ? fmtDate(product.saleDate) : "—"}
                        </span>
                      </td>

                      <td className="px-5 py-2.5 text-center">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-none ${STATUS_STYLES[product.status]}`}
                        >
                          {product.status === "AVAILABLE"
                            ? "Disponible"
                            : "Facturado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
