import { useState, useEffect, useCallback, useRef } from "react";
import { Users, Plus, Search, Filter, Pencil, Trash2, Loader2 } from "lucide-react";
import { getClients, deleteClient } from "../../services/clientService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import usePermissions from "../../hooks/usePermissions";
import DeleteConfirmModal from "../modals/DeleteConfirmModal";
import ModulePanelHeader from "../ui/ModulePanelHeader";

const TYPE_LABELS = {
    PRIVATE: "Privado",
    DISTRIBUTOR: "Distribuidor",
};

const TYPE_STYLES = {
    PRIVATE: "bg-[#34c3d6]/10 text-[#34c3d6] border-[#34c3d6]/20",
    DISTRIBUTOR: "bg-[#ef7d2d]/10 text-[#ef7d2d] border-[#ef7d2d]/20",
};

export default function ClientsListView({ refreshKey = 0, onStartCreate, onStartEdit }) {
    const [clients, setClients] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");

    const [showDelete, setShowDelete] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const { showAlert } = useAlert();
    const alertRef = useRef(showAlert);
    const { canWrite } = usePermissions();
    const hasWriteAccess = canWrite("clients");

    useEffect(() => {
        alertRef.current = showAlert;
    }, [showAlert]);

    const fetchClients = useCallback(async () => {
        try {
            setLoadingData(true);
            const data = await getClients();
            setClients(data);
        } catch (error) {
            handleApiError(error, alertRef.current);
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients, refreshKey]);

    useEffect(() => {
        let result = clients;

        if (typeFilter !== "ALL") {
            result = result.filter(client => client.type === typeFilter);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                client =>
                    client.name.toLowerCase().includes(q) ||
                    (client.lastName1 && client.lastName1.toLowerCase().includes(q)) ||
                    (client.lastName2 && client.lastName2.toLowerCase().includes(q)) ||
                    client.identityNumber.toLowerCase().includes(q) ||
                    (client.email && client.email.toLowerCase().includes(q)),
            );
        }

        setFiltered(result);
    }, [clients, search, typeFilter]);

    function handleOpenDelete(client) {
        setDeleteTarget(client);
        setShowDelete(true);
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;

        try {
            setDeleteLoading(true);
            await deleteClient(deleteTarget.id);
            showAlert("Cliente eliminado correctamente", "success");
            setShowDelete(false);
            setDeleteTarget(null);
            await fetchClients();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setDeleteLoading(false);
        }
    }

    function fullName(client) {
        if (client.type === "DISTRIBUTOR") return client.name;
        return [client.name, client.lastName1, client.lastName2].filter(Boolean).join(" ");
    }

    const privateCount = clients.filter(client => client.type === "PRIVATE").length;
    const distributorCount = clients.filter(client => client.type === "DISTRIBUTOR").length;

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
            Nuevo Cliente
        </button>
    ) : null;

    return (
        <div className='space-y-5'>
            <ModulePanelHeader
                title='Clientes'
                subtitle={`${clients.length} cliente${clients.length !== 1 ? "s" : ""} — ${privateCount} privado${privateCount !== 1 ? "s" : ""}, ${distributorCount} distribuidor${distributorCount !== 1 ? "es" : ""}`}
                icon={Users}
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
                            placeholder='Buscar por nombre, cédula o correo...'
                            className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#34c3d6] transition-colors'
                        />
                    </div>

                    <div className='relative'>
                        <Filter size={14} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            className='pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#34c3d6] appearance-none cursor-pointer transition-colors'
                        >
                            <option value='ALL'>Todos los tipos</option>
                            <option value='PRIVATE'>Privado</option>
                            <option value='DISTRIBUTOR'>Distribuidor</option>
                        </select>
                    </div>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='border-t border-slate-100'>
                                <th className='px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Cédula
                                </th>
                                <th className='px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Nombre
                                </th>
                                <th className='px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Tipo
                                </th>
                                <th className='px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell'>
                                    Correo
                                </th>
                                <th className='px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell'>
                                    Teléfono
                                </th>
                                <th className='px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider'>
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className='divide-y divide-slate-100'>
                            {loadingData ? (
                                <tr>
                                    <td colSpan={6} className='px-5 py-16 text-center'>
                                        <div className='flex flex-col items-center gap-3 text-slate-400'>
                                            <Loader2 size={24} className='animate-spin' />
                                            <span className='text-sm'>Cargando clientes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='px-5 py-16 text-center'>
                                        <div className='flex flex-col items-center gap-2 text-slate-400'>
                                            <Users size={32} strokeWidth={1.5} />
                                            <span className='text-sm'>
                                                {search || typeFilter !== "ALL"
                                                    ? "No se encontraron resultados"
                                                    : "No hay clientes registrados"}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(client => (
                                    <tr key={client.id} className='hover:bg-slate-50/60 transition-colors'>
                                        <td className='px-5 py-3.5'>
                                            <span className='font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded'>
                                                {client.identityNumber}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5'>
                                            <span className='font-medium text-slate-800'>{fullName(client)}</span>
                                        </td>

                                        <td className='px-5 py-3.5 text-center'>
                                            <span
                                                className={`
                                                    inline-block px-2.5 py-1 rounded-full
                                                    text-xs font-medium border
                                                    ${TYPE_STYLES[client.type] || "bg-slate-50 text-slate-500 border-slate-200"}
                                                `}
                                            >
                                                {TYPE_LABELS[client.type] || client.type}
                                            </span>
                                        </td>

                                        <td className='px-5 py-3.5 hidden md:table-cell'>
                                            <span className='text-slate-600 text-sm'>{client.email || "—"}</span>
                                        </td>

                                        <td className='px-5 py-3.5 hidden lg:table-cell'>
                                            <span className='text-slate-600 text-sm'>{client.phone || "—"}</span>
                                        </td>

                                        <td className='px-5 py-3.5'>
                                            {hasWriteAccess && (
                                                <div className='flex items-center justify-center gap-1'>
                                                    <button
                                                        type='button'
                                                        onClick={() => onStartEdit?.(client)}
                                                        title='Editar'
                                                        className='w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-[#34c3d6]/10 hover:text-[#34c3d6] transition-colors'
                                                    >
                                                        <Pencil size={14} />
                                                    </button>

                                                    <button
                                                        type='button'
                                                        onClick={() => handleOpenDelete(client)}
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
                        Mostrando {filtered.length} de {clients.length} cliente{clients.length !== 1 ? "s" : ""}
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
                        ? `¿Está seguro de eliminar al cliente "${deleteTarget.name}"? Si tiene órdenes registradas, la eliminación fallará.`
                        : undefined
                }
            />
        </div>
    );
}