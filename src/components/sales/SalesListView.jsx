import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  XCircle,
  Trash2,
  Loader2,
  ArrowRightCircle,
} from "lucide-react";
import {
  getOrders,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
} from "../../services/OrderclientService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import usePermissions from "../../hooks/usePermissions";
import useListPagination from "../../hooks/useListPagination";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import AppToolTip from "../ui/AppToolTip";
import ListPagination from "../ui/ListPagination";
import TruncatedCell from "../ui/TruncatedCell";
import SearchableSelect from "../ui/SearchableSelect";
import AppDatePicker from "../ui/AppDatePicker";
import { formatCRC } from "../../utils/currency";

const STATUS_LABELS = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELED: "Cancelada",
};

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELED: "bg-red-50 text-red-500 border-red-200",
};

const TYPE_LABELS = {
  PRIVATE: "Privado",
  DISTRIBUTOR: "Distribuidor",
};

const SALES_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELED", label: "Cancelada" },
];

export default function SalesListView({ refreshKey = 0, onStartCreateSale }) {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [actionLoading, setActionLoading] = useState(null);

  const { showAlert, showConfirm } = useAlert();
  const alertRef = useRef(showAlert);
  const { canWrite } = usePermissions();
  const hasWriteAccess = canWrite("sales");

  useEffect(() => {
    alertRef.current = showAlert;
  }, [showAlert]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingData(true);
      const data = await getOrders();
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

    if (statusFilter !== "ALL") {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (dateFrom) {
      result = result.filter((order) => order.saleDate >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((order) => order.saleDate <= dateTo);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (order) =>
          order.invoiceNum.toLowerCase().includes(query) ||
          (order.client?.name &&
            order.client.name.toLowerCase().includes(query)) ||
          (order.client?.identityNumber &&
            order.client.identityNumber.includes(query)),
      );
    }

    setFiltered(result);
  }, [orders, search, statusFilter, dateFrom, dateTo]);

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
  }, [search, statusFilter, dateFrom, dateTo, refreshKey, setCurrentPage]);

  async function handleStatusChange(orderId, newStatus) {
    try {
      setActionLoading(orderId);
      await updateOrderStatus(orderId, newStatus);
      showAlert(`Orden actualizada a ${STATUS_LABELS[newStatus]}`, "success");
      await fetchOrders();
    } catch (error) {
      handleApiError(error, showAlert);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(orderId) {
    try {
      setActionLoading(orderId);
      await cancelOrder(orderId);
      showAlert("Orden cancelada. Stock revertido.", "success");
      await fetchOrders();
    } catch (error) {
      handleApiError(error, showAlert);
    } finally {
      setActionLoading(null);
    }
  }

  function handleOpenDelete(order) {
    showConfirm({
      title: "Eliminar orden",
      message: `¿Está seguro de eliminar la orden "${order.invoiceNum}"? Esta es una eliminación lógica (soft delete).`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      severity: "error",
      onConfirm: async () => {
        try {
          await deleteOrder(order.id);
          showAlert("Orden eliminada correctamente", "success");
          await fetchOrders();
        } catch (error) {
          handleApiError(error, showAlert);
        }
      },
    });
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
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

  function clientName(order) {
    const client = order.client;
    if (!client) return "—";
    if (client.type === "DISTRIBUTOR") return client.name;
    return [client.name, client.lastName1, client.lastName2]
      .filter(Boolean)
      .join(" ");
  }

  function getNextStatus(status) {
    if (status === "PENDING") return "CONFIRMED";
    if (status === "CONFIRMED") return "COMPLETED";
    return null;
  }

  function renderOrderActions(order) {
    if (!hasWriteAccess) return null;

    const isLoading = actionLoading === order.id;
    const nextStatus = getNextStatus(order.status);
    const canCancel =
      order.status !== "CANCELED" && order.status !== "COMPLETED";
    const canDelete = order.status === "CANCELED";
    const nextStatusMessage = nextStatus
      ? `Avanzar a ${STATUS_LABELS[nextStatus]}`
      : "";

    return (
      <div className="flex items-center justify-center gap-1">
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-slate-400" />
        ) : (
          <>
            {nextStatus && (
              <AppToolTip message={nextStatusMessage} position="top">
                <button
                  type="button"
                  onClick={() => handleStatusChange(order.id, nextStatus)}
                  aria-label={nextStatusMessage}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                >
                  <ArrowRightCircle size={15} />
                </button>
              </AppToolTip>
            )}

            {canCancel && (
              <AppToolTip message="Cancelar orden" position="top">
                <button
                  type="button"
                  onClick={() => handleCancel(order.id)}
                  aria-label="Cancelar orden"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                >
                  <XCircle size={15} />
                </button>
              </AppToolTip>
            )}

            {canDelete && (
              <AppToolTip message="Eliminar orden" position="top">
                <button
                  type="button"
                  onClick={() => handleOpenDelete(order)}
                  aria-label="Eliminar orden"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </AppToolTip>
            )}
          </>
        )}
      </div>
    );
  }

  const hasActiveFilters =
    search || statusFilter !== "ALL" || dateFrom || dateTo;

  const completedOrders = orders.filter(
    (order) => order.status === "COMPLETED",
  );
  const totalAmount = completedOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0,
  );

  const headerActions = hasWriteAccess ? (
    <button
      type="button"
      onClick={onStartCreateSale}
      className="
                flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-[#34c3d6] text-white text-sm font-semibold
                hover:bg-[#28b4c8] transition-colors
            "
    >
      <Plus size={16} />
      Nueva Venta
    </button>
  ) : null;

  return (
    <div className="space-y-5">
      <ModulePanelHeader
        title="Ventas"
        subtitle={`${orders.length} orden${orders.length !== 1 ? "es" : ""} · Total: ${fmtCRC(totalAmount)}`}
        icon={ShoppingCart}
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
              placeholder="Buscar por factura, cliente o cédula..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-[#34c3d6] focus:ring-4 focus:ring-[#34c3d6]/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
            <SearchableSelect
              options={SALES_STATUS_OPTIONS}
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
                <span className="text-sm">Cargando ventas...</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <ShoppingCart size={32} strokeWidth={1.5} />
                <span className="text-sm">
                  {hasActiveFilters
                    ? "No se encontraron resultados"
                    : "No hay ventas registradas"}
                </span>
              </div>
            </div>
          ) : (
            paginatedOrders.map((order) => (
              <article key={order.id} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {order.invoiceNum}
                    </span>
                    <p className="text-sm font-semibold text-slate-800">
                      {clientName(order)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {TYPE_LABELS[order.client?.type] || "—"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium shadow-none ${STATUS_STYLES[order.status]}`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Fecha</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {fmtDate(order.saleDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Monto</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {fmtCRC(order.totalAmount)}
                    </p>
                  </div>
                </div>

                {hasWriteAccess && (
                  <div className="border-t border-slate-100 pt-2">
                    {renderOrderActions(order)}
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
                <th className="w-[8rem] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Factura
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Cliente
                </th>
                <th className="w-[7.5rem] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Fecha
                </th>
                <th className="w-[8rem] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Monto
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
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-sm">Cargando ventas...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ShoppingCart size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {hasActiveFilters
                          ? "No se encontraron resultados"
                          : "No hay ventas registradas"}
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
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 font-mono text-sm text-slate-700">
                        {order.invoiceNum}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <div className="min-w-0">
                        <TruncatedCell
                          value={clientName(order)}
                          className="w-full"
                          contentClassName="max-w-full text-sm font-medium text-slate-800"
                        />
                        <span className="mt-1 block truncate text-xs text-slate-400">
                          {TYPE_LABELS[order.client?.type] || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center align-top">
                      <span className="text-sm text-slate-600">
                        {fmtDate(order.saleDate)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right align-top">
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {fmtCRC(order.totalAmount)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center align-top">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium shadow-none ${STATUS_STYLES[order.status]}`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
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
                  # Factura
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">
                  Tipo
                </th>
                <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Monto
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
                      <span className="text-sm">Cargando ventas...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ShoppingCart size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {hasActiveFilters
                          ? "No se encontraron resultados"
                          : "No hay ventas registradas"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {order.invoiceNum}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <TruncatedCell
                          value={clientName(order)}
                          className="w-full"
                          contentClassName="max-w-[18rem] text-sm font-medium text-slate-800"
                        />
                      </td>

                      <td className="px-5 py-3.5 text-center hidden md:table-cell">
                        <span className="text-xs text-slate-500">
                          {TYPE_LABELS[order.client?.type] || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="text-slate-600 text-sm">
                          {fmtDate(order.saleDate)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {fmtCRC(order.totalAmount)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full border text-xs font-medium shadow-none ${STATUS_STYLES[order.status]}`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {renderOrderActions(order)}
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
              Mostrando {visibleStart}–{visibleEnd} de {filtered.length} orden
              {filtered.length !== 1 ? "es" : ""}
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
