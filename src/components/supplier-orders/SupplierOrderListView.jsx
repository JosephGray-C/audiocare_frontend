import { useState, useEffect, useCallback, useRef } from "react";
import { Truck, Plus, Search, Calendar, Pencil, Loader2 } from "lucide-react";
import { getSupplierOrders } from "../../services/supplierOrderService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import usePermissions from "../../hooks/usePermissions";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import AppToolTip from "../ui/AppToolTip";
import { formatCRC, formatConvertedCurrency } from "../../utils/currency";

export default function SupplierOrderListView({ refreshKey = 0, onStartCreate, onStartEdit }) {
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
            result = result.filter(order => order.name.toLowerCase().includes(q));
        }

        if (dateFrom) {
            result = result.filter(order => order.receivedDate >= dateFrom);
        }

        if (dateTo) {
            result = result.filter(order => order.receivedDate <= dateTo);
        }

        setFiltered(result);
    }, [orders, search, dateFrom, dateTo]);

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

    const hasActiveFilters = search || dateFrom || dateTo;

    const headerActions = hasWriteAccess ? (
        <button
            type='button'
            onClick={onStartCreate}
            className='
                flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-[#34c3d6] text-white text-sm font-semibold
                hover:bg-[#28b4c8] transition-colors
            '
        >
            <Plus size={16} />
            Nuevo Pedido
        </button>
    ) : null;

    return (
        <div className='space-y-5'>
            <ModulePanelHeader
                title='Pedidos del Proveedor'
                subtitle={`${orders.length} pedido${orders.length !== 1 ? "s" : ""} registrado${orders.length !== 1 ? "s" : ""}`}
                icon={Truck}
                variant='list'
                actions={headerActions}
            />

            <div className='bg-white rounded-2xl border border-slate-200 shadow-sm'>
                <div className='flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center'>
                    <div className='relative flex-1'>
                        <Search size={15} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
                        <input
                            type='text'
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder='Buscar por nombre del pedido...'
                            className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#34c3d6] transition-colors'
                        />
                    </div>

                    <div className='flex items-center gap-2'>
                        <div className='relative'>
                            <Calendar size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                            <input
                                type='date'
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className='pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#34c3d6] transition-colors'
                            />
                        </div>

                        <span className='text-xs text-slate-400'>a</span>

                        <div className='relative'>
                            <Calendar size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                            <input
                                type='date'
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className='pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#34c3d6] transition-colors'
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type='button'
                            onClick={handleClearFilters}
                            className='text-xs text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap'
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='border-t border-slate-100'>
                                <th className='px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Nombre
                                </th>
                                <th className='px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Fecha Recepción
                                </th>
                                <th className='px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Total (₡)
                                </th>
                                <th className='px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell'>
                                    Total (€)
                                </th>
                                <th className='px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden xl:table-cell'>
                                    Seguro (₡)
                                </th>
                                <th className='px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden xl:table-cell'>
                                    Seguro (€)
                                </th>
                                <th className='px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className='divide-y divide-slate-100'>
                            {loadingData ? (
                                <tr>
                                    <td colSpan={7} className='px-5 py-16 text-center'>
                                        <div className='flex flex-col items-center gap-3 text-slate-400'>
                                            <Loader2 size={24} className='animate-spin' />
                                            <span className='text-sm'>Cargando pedidos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-5 py-16 text-center'>
                                        <div className='flex flex-col items-center gap-2 text-slate-400'>
                                            <Truck size={32} strokeWidth={1.5} />
                                            <span className='text-sm'>
                                                {hasActiveFilters ? "No se encontraron resultados" : "No hay pedidos registrados"}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(order => (
                                    <tr key={order.id} className='hover:bg-slate-50/60 transition-colors'>
                                        <td className='px-5 py-3.5'>
                                            <span className='font-medium text-slate-800'>{order.name}</span>
                                        </td>

                                        <td className='px-5 py-3.5 text-center'>
                                            <span className='text-slate-600 text-sm'>{fmtDate(order.receivedDate)}</span>
                                        </td>

                                        <td className='px-5 py-3.5 text-right'>
                                            <span className='font-semibold text-slate-800 tabular-nums'>
                                                {fmtCRC(order.totalAmountCrc)}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5 text-right hidden lg:table-cell'>
                                            <span className='text-slate-600 tabular-nums'>{fmtEUR(order.totalAmountEur)}</span>
                                        </td>

                                        <td className='px-5 py-3.5 text-right hidden xl:table-cell'>
                                            <span className='text-slate-500 tabular-nums'>
                                                {Number(order.insuranceCrc) > 0 ? fmtCRC(order.insuranceCrc) : "—"}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5 text-right hidden xl:table-cell'>
                                            <span className='text-slate-500 tabular-nums'>
                                                {Number(order.insuranceEur) > 0 ? fmtEUR(order.insuranceEur) : "—"}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5'>
                                            {hasWriteAccess && (
                                                <div className='flex items-center justify-center'>
                                                    <AppToolTip message='Editar' position='top'>
                                                        <button
                                                            type='button'
                                                            onClick={() => onStartEdit?.(order)}
                                                            aria-label='Editar'
                                                            className='w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-[#34c3d6]/10 hover:text-[#34c3d6] transition-colors'
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                    </AppToolTip>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loadingData && filtered.length > 0 && (
                    <div className='px-5 py-3 border-t border-slate-100 text-xs text-slate-400'>
                        Mostrando {filtered.length} de {orders.length} pedido{orders.length !== 1 ? "s" : ""}
                    </div>
                )}
            </div>
        </div>
    );
}
