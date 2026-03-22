import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, Search, Calendar, Pencil, Loader2 } from "lucide-react";
import { getSupplierOrders, createSupplierOrder, updateSupplierOrder } from "../services/supplierOrderService";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";
import SupplierOrderModal from "../components/modals/SupplierOrderModal";

export default function PedidosProveedor() {
    const [orders, setOrders] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editOrder, setEditOrder] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const { showAlert } = useAlert();

    // ── Fetch data ───────────────────────────────────────────────────────

    const fetchOrders = useCallback(async () => {
        try {
            setLoadingData(true);
            const data = await getSupplierOrders();
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

    // ── Filter & search ──────────────────────────────────────────────────

    useEffect(() => {
        let result = orders;

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(o => o.name.toLowerCase().includes(q));
        }

        if (dateFrom) {
            result = result.filter(o => o.receivedDate >= dateFrom);
        }

        if (dateTo) {
            result = result.filter(o => o.receivedDate <= dateTo);
        }

        setFiltered(result);
    }, [orders, search, dateFrom, dateTo]);

    // ── CRUD handlers ────────────────────────────────────────────────────

    function handleOpenCreate() {
        setEditOrder(null);
        setShowModal(true);
    }

    function handleOpenEdit(order) {
        setEditOrder(order);
        setShowModal(true);
    }

    async function handleSubmitOrder(payload) {
        try {
            setModalLoading(true);

            if (editOrder) {
                await updateSupplierOrder(editOrder.id, payload);
                showAlert("Pedido actualizado correctamente", "success");
            } else {
                await createSupplierOrder(payload);
                showAlert("Pedido registrado correctamente", "success");
            }

            setShowModal(false);
            setEditOrder(null);
            await fetchOrders();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setModalLoading(false);
        }
    }

    function handleClearFilters() {
        setSearch("");
        setDateFrom("");
        setDateTo("");
    }

    // ── Format helpers ───────────────────────────────────────────────────

    function fmtCRC(value) {
        return "₡ " + Number(value || 0).toLocaleString("es-CR");
    }

    function fmtEUR(value) {
        return "€ " + Number(value || 0).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }

    function fmtDate(dateStr) {
        if (!dateStr) return "—";
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
    }

    const hasActiveFilters = search || dateFrom || dateTo;

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#34c3d6]/10 flex items-center justify-center">
                        <Truck size={20} className="text-[#34c3d6]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Pedidos del Proveedor</h1>
                        <p className="text-sm text-slate-400">
                            {orders.length} pedido{orders.length !== 1 ? "s" : ""} registrado{orders.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleOpenCreate}
                    className="
                        flex items-center gap-2 px-5 py-2.5 rounded-xl
                        bg-[#34c3d6] text-white text-sm font-semibold
                        hover:bg-[#28b4c8] transition-colors
                        self-start sm:self-auto
                    "
                >
                    <Plus size={16} />
                    Nuevo Pedido
                </button>
            </div>

            {/* Filters bar + table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nombre del pedido..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#34c3d6] transition-colors"
                        />
                    </div>

                    {/* Date range */}
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

                    {/* Clear filters */}
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
                            <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Nombre</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">Fecha Recepción</th>
                            <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Total (₡)</th>
                            <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Total (€)</th>
                            <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden xl:table-cell">Seguro (₡)</th>
                            <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden xl:table-cell">Seguro (€)</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">Acciones</th>
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
                                                    : "No hay pedidos registrados"
                                                }
                                            </span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(order => (
                                <tr
                                    key={order.id}
                                    className="hover:bg-slate-50/60 transition-colors"
                                >
                                    <td className="px-5 py-3.5">
                                        <span className="font-medium text-slate-800">{order.name}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                        <span className="text-slate-600 text-sm">{fmtDate(order.receivedDate)}</span>
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
                                                {Number(order.insuranceCrc) > 0 ? fmtCRC(order.insuranceCrc) : "—"}
                                            </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right hidden xl:table-cell">
                                            <span className="text-slate-500 tabular-nums">
                                                {Number(order.insuranceEur) > 0 ? fmtEUR(order.insuranceEur) : "—"}
                                            </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={() => handleOpenEdit(order)}
                                                title="Editar"
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-[#34c3d6]/10 hover:text-[#34c3d6] transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Footer count */}
                {!loadingData && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                        Mostrando {filtered.length} de {orders.length} pedido{orders.length !== 1 ? "s" : ""}
                    </div>
                )}
            </div>

            {/* Create / Edit modal */}
            <SupplierOrderModal
                open={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditOrder(null);
                }}
                onSubmit={handleSubmitOrder}
                loading={modalLoading}
                order={editOrder}
            />
        </div>
    );
}