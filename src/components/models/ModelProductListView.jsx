import { useState, useEffect, useCallback, useRef } from "react";
import { Package, Plus, Search, Filter, Pencil, Trash2, Loader2 } from "lucide-react";
import { getModelProducts, deleteModelProduct } from "../../services/modelProductService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import usePermissions from "../../hooks/usePermissions";
import DeleteConfirmModal from "../modals/DeleteConfirmModal";
import ModulePanelHeader from "../ui/ModulePanelHeader";

const STATUS_LABELS = {
    AVAILABLE: "Disponible",
    NO_STOCK: "Sin Stock",
};

const STATUS_STYLES = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    NO_STOCK: "bg-slate-50 text-slate-500 border-slate-200",
};

export default function ModelProductListView({ refreshKey = 0, onStartCreate, onStartEdit }) {
    const [models, setModels] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [showDelete, setShowDelete] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const { showAlert } = useAlert();
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
            result = result.filter(model => model.status === statusFilter);
        }

        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(model => model.name.toLowerCase().includes(query) || String(model.modelCode).includes(query));
        }

        setFiltered(result);
    }, [models, search, statusFilter]);

    function handleOpenDelete(model) {
        setDeleteTarget(model);
        setShowDelete(true);
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;

        try {
            setDeleteLoading(true);
            await deleteModelProduct(deleteTarget.id);
            showAlert("Modelo eliminado correctamente", "success");
            setShowDelete(false);
            setDeleteTarget(null);
            await fetchModels();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setDeleteLoading(false);
        }
    }

    function fmtCRC(value) {
        return "₡ " + Number(value || 0).toLocaleString("es-CR");
    }

    function fmtEUR(value) {
        return (
            "€ " +
            Number(value || 0).toLocaleString("es-CR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
            })
        );
    }

    const hasActiveFilters = search.trim() || statusFilter !== "ALL";

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
            Nuevo Modelo
        </button>
    ) : null;

    return (
        <div className='space-y-5'>
            <ModulePanelHeader
                title='Modelos de Producto'
                subtitle={`${models.length} modelo${models.length !== 1 ? "s" : ""} registrado${models.length !== 1 ? "s" : ""}`}
                icon={Package}
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
                            placeholder='Buscar por nombre o código...'
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
                            <option value='NO_STOCK'>Sin Stock</option>
                        </select>
                    </div>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='border-t border-slate-100'>
                                <th className='px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Código
                                </th>
                                <th className='px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Nombre
                                </th>
                                <th className='px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Precio Venta
                                </th>
                                <th className='px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell'>
                                    Costo Fábrica (₡)
                                </th>
                                <th className='px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell'>
                                    Costo Fábrica (€)
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
                                            <span className='text-sm'>Cargando modelos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-5 py-16 text-center'>
                                        <div className='flex flex-col items-center gap-2 text-slate-400'>
                                            <Package size={32} strokeWidth={1.5} />
                                            <span className='text-sm'>
                                                {hasActiveFilters ? "No se encontraron resultados" : "No hay modelos registrados"}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(model => (
                                    <tr key={model.id} className='hover:bg-slate-50/60 transition-colors'>
                                        <td className='px-5 py-3.5'>
                                            <span className='font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded'>
                                                {model.modelCode}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5'>
                                            <span className='font-medium text-slate-800'>{model.name}</span>
                                        </td>

                                        <td className='px-5 py-3.5 text-right'>
                                            <span className='font-semibold text-slate-800 tabular-nums'>{fmtCRC(model.priceSale)}</span>
                                        </td>

                                        <td className='px-5 py-3.5 text-right hidden lg:table-cell'>
                                            <span className='text-slate-600 tabular-nums'>{fmtCRC(model.costFabricCrc)}</span>
                                        </td>

                                        <td className='px-5 py-3.5 text-right hidden lg:table-cell'>
                                            <span className='text-slate-600 tabular-nums'>{fmtEUR(model.costFabricEur)}</span>
                                        </td>

                                        <td className='px-5 py-3.5 text-center'>
                                            <span
                                                className={`
                                                    inline-block px-2.5 py-1 rounded-full
                                                    text-xs font-medium border
                                                    ${STATUS_STYLES[model.status] || "bg-slate-50 text-slate-500 border-slate-200"}
                                                `}
                                            >
                                                {STATUS_LABELS[model.status] || model.status}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5'>
                                            {hasWriteAccess && (
                                                <div className='flex items-center justify-center gap-1'>
                                                    <button
                                                        type='button'
                                                        onClick={() => onStartEdit?.(model)}
                                                        title='Editar'
                                                        className='w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-[#34c3d6]/10 hover:text-[#34c3d6] transition-colors'
                                                    >
                                                        <Pencil size={14} />
                                                    </button>

                                                    <button
                                                        type='button'
                                                        onClick={() => handleOpenDelete(model)}
                                                        title='Eliminar'
                                                        className='w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors'
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
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
                        Mostrando {filtered.length} de {models.length} modelo
                        {models.length !== 1 ? "s" : ""}
                    </div>
                )}
            </div>

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
                        ? `¿Está seguro de eliminar el modelo "${deleteTarget.name}" (Código: ${deleteTarget.modelCode})? Si tiene productos asociados, la eliminación fallará.`
                        : undefined
                }
            />
        </div>
    );
}