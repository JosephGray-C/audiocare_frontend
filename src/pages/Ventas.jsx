import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    ShoppingCart, Plus, Search, Filter, Eye, CheckCircle, XCircle,
    Trash2, Loader2, Calendar, ArrowRightCircle
} from "lucide-react";
import { getOrders, updateOrderStatus, cancelOrder, deleteOrder } from "../services/orderClientService";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";
import DeleteConfirmModal from "../components/modals/DeleteConfirmModal";

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

export default function Ventas() {
    const [orders, setOrders] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Detail modal
    const [detailOrder, setDetailOrder] = useState(null);

    // Delete state
    const [showDelete, setShowDelete] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Action loading
    const [actionLoading, setActionLoading] = useState(null);

    const { showAlert } = useAlert();
    const navigate = useNavigate();

    // ── Fetch ────────────────────────────────────────────────────────────

    const fetchOrders = useCallback(async () => {
        try {
            setLoadingData(true);
            const data = await getOrders();
            setOrders(data);
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoadingData(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // ── Filter ───────────────────────────────────────────────────────────

    useEffect(() => {
        let result = orders;

        if (statusFilter !== "ALL") {
            result = result.filter(o => o.status === statusFilter);
        }

        if (dateFrom) {
            result = result.filter(o => o.saleDate >= dateFrom);
        }

        if (dateTo) {
            result = result.filter(o => o.saleDate <= dateTo);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(o =>
                o.invoiceNum.toLowerCase().includes(q) ||
                (o.client?.name && o.client.name.toLowerCase().includes(q)) ||
                (o.client?.identityNumber && o.client.identityNumber.includes(q))
            );
        }

        setFiltered(result);
    }, [orders, search, statusFilter, dateFrom, dateTo]);

    // ── Actions ──────────────────────────────────────────────────────────

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
        setDeleteTarget(order);
        setShowDelete(true);
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try {
            setDeleteLoading(true);
            await deleteOrder(deleteTarget.id);
            showAlert("Orden eliminada correctamente", "success");
            setShowDelete(false);
            setDeleteTarget(null);
            await fetchOrders();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setDeleteLoading(false);
        }
    }

    function handleClearFilters() {
        setSearch("");
        setStatusFilter("ALL");
        setDateFrom("");
        setDateTo("");
    }

    const hasActiveFilters = search || statusFilter !== "ALL" || dateFrom || dateTo;

    // ── Helpers ──────────────────────────────────────────────────────────

    function fmtDate(dateStr) {
        if (!dateStr) return "—";
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
    }

    function fmtCRC(value) {
        return "₡ " + Number(value || 0).toLocaleString("es-CR");
    }

    function clientName(order) {
        const c = order.client;
        if (!c) return "—";
        if (c.type === "DISTRIBUTOR") return c.name;
        return [c.name, c.lastName1, c.lastName2].filter(Boolean).join(" ");
    }

    function getNextStatus(status) {
        if (status === "PENDING") return "CONFIRMED";
        if (status === "CONFIRMED") return "COMPLETED";
        return null;
    }

    // ── Counts ───────────────────────────────────────────────────────────

    const completedOrders = orders.filter(o => o.status === "COMPLETED");
    const totalAmount = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#34c3d6]/10 flex items-center justify-center">
                        <ShoppingCart size={20} className="text-[#34c3d6]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Ventas</h1>
                        <p className="text-sm text-slate-400">
                            {orders.length} orden{orders.length !== 1 ? "es" : ""} · Total: {fmtCRC(totalAmount)}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate("/registrar-venta")}
                    className="
                        flex items-center gap-2 px-5 py-2.5 rounded-xl
                        bg-[#34c3d6] text-white text-sm font-semibold
                        hover:bg-[#28b4c8] transition-colors
                        self-start sm:self-auto
                    "
                >
                    <Plus size={16} />
                    Nueva Venta
                </button>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                {/* Filters row 1 */}
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por factura, cliente o cédula..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#34c3d6] transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#34c3d6] appearance-none cursor-pointer transition-colors"
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="CONFIRMED">Confirmada</option>
                            <option value="COMPLETED">Completada</option>
                            <option value="CANCELED">Cancelada</option>
                        </select>
                    </div>
                </div>

                {/* Filters row 2 — dates */}
                <div className="flex flex-col gap-3 px-5 pb-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#34c3d6] transition-colors"
                            />
                        </div>
                        <span className="text-xs text-slate-400">a</span>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#34c3d6] transition-colors"
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-t border-slate-100">
                            <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider"># Factura</th>
                            <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Cliente</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Tipo</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">Fecha</th>
                            <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Monto</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">Estado</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">Acciones</th>
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
                                                    : "No hay ventas registradas"
                                                }
                                            </span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(order => {
                                const isLoading = actionLoading === order.id;
                                const nextStatus = getNextStatus(order.status);
                                const canCancel = order.status !== "CANCELED" && order.status !== "COMPLETED";
                                const canDelete = order.status === "CANCELED";

                                return (
                                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-3.5">
                                                <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                                    {order.invoiceNum}
                                                </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="font-medium text-slate-800">{clientName(order)}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center hidden md:table-cell">
                                                <span className="text-xs text-slate-500">
                                                    {TYPE_LABELS[order.client?.type] || "—"}
                                                </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="text-slate-600 text-sm">{fmtDate(order.saleDate)}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                                <span className="font-semibold text-slate-800 tabular-nums">
                                                    {fmtCRC(order.totalAmount)}
                                                </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[order.status]}`}>
                                                    {STATUS_LABELS[order.status] || order.status}
                                                </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-1">
                                                {isLoading ? (
                                                    <Loader2 size={16} className="animate-spin text-slate-400" />
                                                ) : (
                                                    <>
                                                        {/* Advance status */}
                                                        {nextStatus && (
                                                            <button
                                                                onClick={() => handleStatusChange(order.id, nextStatus)}
                                                                title={`Avanzar a ${STATUS_LABELS[nextStatus]}`}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                                            >
                                                                <ArrowRightCircle size={15} />
                                                            </button>
                                                        )}

                                                        {/* Cancel */}
                                                        {canCancel && (
                                                            <button
                                                                onClick={() => handleCancel(order.id)}
                                                                title="Cancelar orden"
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                                            >
                                                                <XCircle size={15} />
                                                            </button>
                                                        )}

                                                        {/* Delete — only canceled */}
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => handleOpenDelete(order)}
                                                                title="Eliminar orden"
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {!loadingData && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                        Mostrando {filtered.length} de {orders.length} orden{orders.length !== 1 ? "es" : ""}
                    </div>
                )}
            </div>

            {/* Delete confirmation */}
            <DeleteConfirmModal
                open={showDelete}
                onClose={() => {
                    setShowDelete(false);
                    setDeleteTarget(null);
                }}
                onConfirm={handleConfirmDelete}
                loading={deleteLoading}
                message={
                    deleteTarget
                        ? `¿Está seguro de eliminar la orden "${deleteTarget.invoiceNum}"? Esta es una eliminación lógica (soft delete).`
                        : undefined
                }
            />
        </div>
    );
}