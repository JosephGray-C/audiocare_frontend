import { useState, useEffect, useCallback, useRef } from "react";
import { Hash, Plus, Search, Filter, Pencil, Trash2, Loader2, Package, Truck } from "lucide-react";
import { getAllProducts, deleteProduct } from "../../services/productService";
import { getModelProducts } from "../../services/modelProductService";
import { getSupplierOrders } from "../../services/supplierOrderService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import usePermissions from "../../hooks/usePermissions";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import AppToolTip from "../ui/AppToolTip";

const STATUS_LABELS = {
    AVAILABLE: "Disponible",
    BILLED: "Facturado",
};

const STATUS_STYLES = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    BILLED: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function ProductListView({ refreshKey = 0, onStartCreate, onStartEdit }) {
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

            const [productsData, modelsData, ordersData] = await Promise.all([getAllProducts(), getModelProducts(), getSupplierOrders()]);

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
            result = result.filter(product => product.status === statusFilter);
        }

        if (modelFilter !== "ALL") {
            result = result.filter(product => product.model?.id === Number(modelFilter));
        }

        if (supplierFilter !== "ALL") {
            result = result.filter(product => product.supplierOrder?.id === Number(supplierFilter));
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                product =>
                    product.serialNum.toLowerCase().includes(q) || (product.model?.name && product.model.name.toLowerCase().includes(q)),
            );
        }

        setFiltered(result);
    }, [products, search, statusFilter, modelFilter, supplierFilter]);

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

    const hasActiveFilters = search || statusFilter !== "ALL" || modelFilter !== "ALL" || supplierFilter !== "ALL";

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
            Nuevo Producto
        </button>
    ) : null;

    return (
        <div className='space-y-5'>
            <ModulePanelHeader
                title='Productos'
                subtitle={`${products.length} producto${products.length !== 1 ? "s" : ""} registrado${products.length !== 1 ? "s" : ""}`}
                icon={Hash}
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
                            placeholder='Buscar por serie o modelo...'
                            className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#34c3d6] transition-colors'
                        />
                    </div>

                    <div className='relative'>
                        <Filter size={14} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className='pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#34c3d6] appearance-none cursor-pointer transition-colors'
                        >
                            <option value='ALL'>Todos los estados</option>
                            <option value='AVAILABLE'>Disponible</option>
                            <option value='BILLED'>Facturado</option>
                        </select>
                    </div>
                </div>

                <div className='flex flex-col gap-3 px-5 pb-4 sm:flex-row sm:items-center'>
                    <div className='relative flex-1'>
                        <Package size={14} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        <select
                            value={modelFilter}
                            onChange={e => setModelFilter(e.target.value)}
                            className='w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#34c3d6] appearance-none cursor-pointer transition-colors'
                        >
                            <option value='ALL'>Todos los modelos</option>
                            {models.map(model => (
                                <option key={model.id} value={model.id}>
                                    {model.name} ({model.modelCode})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='relative flex-1'>
                        <Truck size={14} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        <select
                            value={supplierFilter}
                            onChange={e => setSupplierFilter(e.target.value)}
                            className='w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#34c3d6] appearance-none cursor-pointer transition-colors'
                        >
                            <option value='ALL'>Todos los pedidos</option>
                            {supplierOrders.map(order => (
                                <option key={order.id} value={order.id}>
                                    {order.name}
                                </option>
                            ))}
                        </select>
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
                                <th className='px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider'>Serie</th>
                                <th className='px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Modelo
                                </th>
                                <th className='px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell'>
                                    Pedido Proveedor
                                </th>
                                <th className='px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Ingreso
                                </th>
                                <th className='px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell'>
                                    Venta
                                </th>
                                <th className='px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Estado
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
                                            <span className='text-sm'>Cargando productos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-5 py-16 text-center'>
                                        <div className='flex flex-col items-center gap-2 text-slate-400'>
                                            <Hash size={32} strokeWidth={1.5} />
                                            <span className='text-sm'>
                                                {hasActiveFilters ? "No se encontraron resultados" : "No hay productos registrados"}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(product => {
                                    const editMessage = product.status === "BILLED" ? "No editable (facturado)" : "Editar";
                                    const deleteMessage = product.status === "BILLED" ? "No eliminable (facturado)" : "Eliminar";

                                    return (
                                    <tr key={product.id} className='hover:bg-slate-50/60 transition-colors'>
                                        <td className='px-5 py-3.5'>
                                            <span className='font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded'>
                                                {product.serialNum}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5'>
                                            <div className='min-w-0'>
                                                <span className='font-medium text-slate-800 block truncate'>
                                                    {product.model?.name || "—"}
                                                </span>
                                                <span className='text-xs text-slate-400'>Código: {product.model?.modelCode || "—"}</span>
                                            </div>
                                        </td>

                                        <td className='px-5 py-3.5 hidden lg:table-cell'>
                                            <span className='text-slate-600 text-sm truncate block max-w-[200px]'>
                                                {product.supplierOrder?.name || "—"}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5 text-center'>
                                            <span className='text-slate-600 text-sm'>{fmtDate(product.entryDate)}</span>
                                        </td>

                                        <td className='px-5 py-3.5 text-center hidden md:table-cell'>
                                            <span className='text-slate-500 text-sm'>
                                                {product.saleDate ? fmtDate(product.saleDate) : "—"}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5 text-center'>
                                            <span
                                                className={`
                                                    inline-block px-2.5 py-1 rounded-full
                                                    text-xs font-medium border
                                                    ${STATUS_STYLES[product.status] || "bg-slate-50 text-slate-500 border-slate-200"}
                                                `}
                                            >
                                                {STATUS_LABELS[product.status] || product.status}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5'>
                                            {hasWriteAccess && (
                                                <div className='flex items-center justify-center gap-1'>
                                                    <AppToolTip message={editMessage} position='top'>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleEditClick(product)}
                                                            aria-label={editMessage}
                                                            className={`
                                                                w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                                                                ${
                                                                    product.status === "BILLED"
                                                                        ? "text-slate-300 cursor-not-allowed"
                                                                        : "text-slate-400 hover:bg-[#34c3d6]/10 hover:text-[#34c3d6]"
                                                                }
                                                            `}
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                    </AppToolTip>

                                                    <AppToolTip message={deleteMessage} position='top'>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleOpenDelete(product)}
                                                            aria-label={deleteMessage}
                                                            className={`
                                                                w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                                                                ${
                                                                    product.status === "BILLED"
                                                                        ? "text-slate-300 cursor-not-allowed"
                                                                        : "text-slate-400 hover:bg-red-50 hover:text-red-500"
                                                                }
                                                            `}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </AppToolTip>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!loadingData && filtered.length > 0 && (
                    <div className='px-5 py-3 border-t border-slate-100 text-xs text-slate-400'>
                        Mostrando {filtered.length} de {products.length} producto{products.length !== 1 ? "s" : ""}
                    </div>
                )}
            </div>
        </div>
    );
}
