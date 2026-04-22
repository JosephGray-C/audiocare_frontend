import { useState, useEffect, useCallback, useRef } from "react";
import { Truck, Plus, Search, Pencil, Loader2 } from "lucide-react";
import { getSupplierOrders } from "../../services/SupplierorderService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import usePermissions from "../../hooks/usePermissions";
import useListPagination from "../../hooks/useListPagination";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import AppToolTip from "../ui/AppToolTip";
import ListPagination from "../ui/ListPagination";
import TruncatedCell from "../ui/TruncatedCell";
import AppDatePicker from "../ui/AppDatePicker";
import { formatCRC, formatConvertedCurrency } from "../../utils/currency";

export default function SupplierOrderListView({
  refreshKey = 0,
  onStartCreate,
  onStartEdit,
}) {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { showAlert } = useAlert();
  const alertRef = useRef(showAlert);
  const { canWrite } = usePermissions();
  const hasWriteAccess = canWrite("supplierOrders");

  useEffect(() => {
    alertRef.current = showAlert;
  }, [showAlert]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingData(true);
      const data = await getSupplierOrders();
      setOrders(data);
    } catch (error) {
      handleApiError(error, alertRef.current);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshKey]);

  useEffect(() => {
    let result = orders;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((order) => order.name.toLowerCase().includes(q));
    }

    if (dateFrom) {
      result = result.filter((order) => order.receivedDate >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((order) => order.receivedDate <= dateTo);
    }

    setFiltered(result);
  }, [orders, search, dateFrom, dateTo]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedOrders,
    totalPages,
    visibleStart,
    visibleEnd,
  } = useListPagination(filtered);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo, refreshKey, setCurrentPage]);

  function handleClearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  }

  function fmtCRC(value) {
    const formatted = formatCRC(String(Math.round(Number(value || 0))));
    return `₡ ${formatted || "0"}`;
  }

  function fmtEUR(value) {
    return `€ ${formatConvertedCurrency(value)}`;
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

  function renderOrderActions(order) {
    if (!hasWriteAccess) return null;

    return (
      <div className="flex items-center justify-center">
        <AppToolTip message="Editar" position="top">
          <button
            type="button"
            onClick={() => onStartEdit?.(order)}
            aria-label="Editar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#34c3d6]/10 hover:text-[#34c3d6]"
          >
            <Pencil size={14} />
          </button>
        </AppToolTip>
      </div>
    );
  }

  const hasActiveFilters = search || dateFrom || dateTo;

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
      Nuevo Pedido
    </button>
  ) : null;

  return (
    <div className="space-y-5">
      <ModulePanelHeader
        title="Pedidos del Proveedor"
        subtitle={`${orders.length} pedido${orders.length !== 1 ? "s" : ""} registrado${orders.length !== 1 ? "s" : ""}`}
        icon={Truck}
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
              placeholder="Buscar por nombre del pedido..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-[#34c3d6] focus:ring-4 focus:ring-[#34c3d6]/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
            <AppDatePicker
              value={dateFrom}
              onChange={(nextValue) => setDateFrom(nextValue || "")}
              placeholder="Desde"
              variant="filter"
              allowClear
              max={dateTo || undefined}
              className="w-full sm:w-[11rem]"
            />

            <AppDatePicker
              value={dateTo}
              onChange={(nextValue) => setDateTo(nextValue || "")}
              placeholder="Hasta"
              variant="filter"
              allowClear
              min={dateFrom || undefined}
              className="w-full sm:w-[11rem]"
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
                <span className="text-sm">Cargando pedidos...</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Truck size={32} strokeWidth={1.5} />
                <span className="text-sm">
                  {hasActiveFilters
                    ? "No se encontraron resultados"
                    : "No hay pedidos registrados"}
                </span>
              </div>
            </div>
          ) : (
            paginatedOrders.map((order) => (
              <article key={order.id} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {order.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {fmtDate(order.receivedDate)}
                    </p>
                  </div>

                  {hasWriteAccess && renderOrderActions(order)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Total (₡)</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {fmtCRC(order.totalAmountCrc)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Total (€)</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {fmtEUR(order.totalAmountEur)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Seguro (₡)</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {Number(order.insuranceCrc) > 0
                        ? fmtCRC(order.insuranceCrc)
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Seguro (€)</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {Number(order.insuranceEur) > 0
                        ? fmtEUR(order.insuranceEur)
                        : "—"}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block xl:hidden">
          <table className="w-full table-fixed text-[13px]">
            <thead>
              <tr className="border-t border-slate-100">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Nombre
                </th>
                <th className="w-[8rem] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Recepción
                </th>
                <th className="w-[8.5rem] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Total (₡)
                </th>
                <th className="w-[8.5rem] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Total (€)
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
                      <span className="text-sm">Cargando pedidos...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Truck size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {hasActiveFilters
                          ? "No se encontraron resultados"
                          : "No hay pedidos registrados"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3.5 align-top">
                      <div className="min-w-0">
                        <TruncatedCell
                          value={order.name}
                          className="w-full"
                          contentClassName="max-w-full text-sm font-medium text-slate-800"
                        />
                        <span className="mt-1 block text-xs text-slate-400">
                          {fmtDate(order.receivedDate)}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center align-top">
                      <span className="text-sm text-slate-600">
                        {fmtDate(order.receivedDate)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right align-top">
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {fmtCRC(order.totalAmountCrc)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right align-top">
                      <span className="text-slate-600 tabular-nums">
                        {fmtEUR(order.totalAmountEur)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      {renderOrderActions(order)}
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
                  Nombre
                </th>
                <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Fecha Recepción
                </th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Total (₡)
                </th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                  Total (€)
                </th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden xl:table-cell">
                  Seguro (₡)
                </th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden xl:table-cell">
                  Seguro (€)
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
                      <span className="text-sm">Cargando pedidos...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Truck size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {hasActiveFilters
                          ? "No se encontraron resultados"
                          : "No hay pedidos registrados"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <TruncatedCell
                        value={order.name}
                        className="w-full"
                        contentClassName="max-w-[18rem] text-sm font-medium text-slate-800"
                      />
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span className="text-slate-600 text-sm">
                        {fmtDate(order.receivedDate)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {fmtCRC(order.totalAmountCrc)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                      <span className="text-slate-600 tabular-nums">
                        {fmtEUR(order.totalAmountEur)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right hidden xl:table-cell">
                      <span className="text-slate-500 tabular-nums">
                        {Number(order.insuranceCrc) > 0
                          ? fmtCRC(order.insuranceCrc)
                          : "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right hidden xl:table-cell">
                      <span className="text-slate-500 tabular-nums">
                        {Number(order.insuranceEur) > 0
                          ? fmtEUR(order.insuranceEur)
                          : "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">{renderOrderActions(order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loadingData && filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              Mostrando {visibleStart}–{visibleEnd} de {filtered.length} pedido
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
