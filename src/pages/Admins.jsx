import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Plus, Search, Pencil, Trash2, Loader2, Shield, Crown } from "lucide-react";
import { getAdmins, createAdmin, updateAdmin, updateAdminPermissions, deleteAdmin } from "../services/adminService";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";
import AdminModal from "../components/modals/AdminModal";
import PermissionsModal from "../components/modals/PermissionsModal";
import DeleteConfirmModal from "../components/modals/DeleteConfirmModal";

export default function Admins() {
    const [admins, setAdmins] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [search, setSearch] = useState("");

    // Admin modal
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [editAdmin, setEditAdmin] = useState(null);
    const [adminModalLoading, setAdminModalLoading] = useState(false);

    // Permissions modal
    const [showPermsModal, setShowPermsModal] = useState(false);
    const [permsAdmin, setPermsAdmin] = useState(null);
    const [permsLoading, setPermsLoading] = useState(false);

    // Delete
    const [showDelete, setShowDelete] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const { auth } = useAuth();
    const { showAlert } = useAlert();

    // ── Fetch ────────────────────────────────────────────────────────────

    const fetchAdmins = useCallback(async () => {
        try {
            setLoadingData(true);
            const data = await getAdmins();
            setAdmins(data);
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoadingData(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    // ── Filter ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(admins);
            return;
        }
        const q = search.toLowerCase();
        setFiltered(admins.filter(a =>
            a.name.toLowerCase().includes(q) ||
            a.lastName1?.toLowerCase().includes(q) ||
            a.email.toLowerCase().includes(q) ||
            a.identityNumber.includes(q)
        ));
    }, [admins, search]);

    // ── CRUD ─────────────────────────────────────────────────────────────

    function handleOpenCreate() {
        setEditAdmin(null);
        setShowAdminModal(true);
    }

    function handleOpenEdit(admin) {
        setEditAdmin(admin);
        setShowAdminModal(true);
    }

    function handleOpenPermissions(admin) {
        setPermsAdmin(admin);
        setShowPermsModal(true);
    }

    function handleOpenDelete(admin) {
        if (admin.isMaster) {
            showAlert("No se puede eliminar un admin master", "warning");
            return;
        }
        if (admin.id === auth?.adminId) {
            showAlert("No se puede eliminar su propia cuenta", "warning");
            return;
        }
        setDeleteTarget(admin);
        setShowDelete(true);
    }

    async function handleSubmitAdmin(payload) {
        try {
            setAdminModalLoading(true);
            if (editAdmin) {
                await updateAdmin(editAdmin.id, payload);
                showAlert("Admin actualizado correctamente", "success");
            } else {
                await createAdmin(payload);
                showAlert("Admin creado correctamente", "success");
            }
            setShowAdminModal(false);
            setEditAdmin(null);
            await fetchAdmins();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setAdminModalLoading(false);
        }
    }

    async function handleSubmitPermissions(permissions) {
        if (!permsAdmin) return;
        try {
            setPermsLoading(true);
            await updateAdminPermissions(permsAdmin.id, permissions);
            showAlert("Permisos actualizados correctamente", "success");
            setShowPermsModal(false);
            setPermsAdmin(null);
            await fetchAdmins();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setPermsLoading(false);
        }
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try {
            setDeleteLoading(true);
            await deleteAdmin(deleteTarget.id);
            showAlert("Admin eliminado correctamente", "success");
            setShowDelete(false);
            setDeleteTarget(null);
            await fetchAdmins();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setDeleteLoading(false);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    function fullName(admin) {
        return [admin.name, admin.lastName1, admin.lastName2].filter(Boolean).join(" ");
    }

    function countActivePermissions(admin) {
        if (admin.isMaster) return "Acceso total";
        const p = admin.permissions;
        if (!p) return "Sin permisos";
        const fields = [
            p.modelRead, p.modelCrud,
            p.supplierOrderRead, p.supplierOrderCru,
            p.productRead, p.productCrud,
            p.movementsRead,
            p.clientRead, p.clientCrud,
            p.saleRead, p.saleCrud,
        ];
        const active = fields.filter(Boolean).length;
        return active === 0 ? "Sin permisos" : `${active} permiso${active !== 1 ? "s" : ""} activo${active !== 1 ? "s" : ""}`;
    }

    function fmtDate(dateStr) {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
    }

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#34c3d6]/10 flex items-center justify-center">
                        <ShieldCheck size={20} className="text-[#34c3d6]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Administradores</h1>
                        <p className="text-sm text-slate-400">
                            {admins.length} admin{admins.length !== 1 ? "s" : ""} registrado{admins.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#34c3d6] text-white text-sm font-semibold hover:bg-[#28b4c8] transition-colors self-start sm:self-auto"
                >
                    <Plus size={16} />
                    Nuevo Admin
                </button>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-5 py-4">
                    <div className="relative max-w-md">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, correo o cédula..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#34c3d6] transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-t border-slate-100">
                            <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Admin</th>
                            <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Correo</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">Rol</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Permisos</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Creado</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {loadingData ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <Loader2 size={24} className="animate-spin" />
                                        <span className="text-sm">Cargando admins...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <ShieldCheck size={32} strokeWidth={1.5} />
                                        <span className="text-sm">{search ? "Sin resultados" : "No hay admins"}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(admin => {
                                const isSelf = admin.id === auth?.adminId;

                                return (
                                    <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${admin.isMaster ? "bg-[#ef7d2d]/10" : "bg-slate-100"}`}>
                                                    {admin.isMaster
                                                        ? <Crown size={14} className="text-[#ef7d2d]" />
                                                        : <span className="text-xs font-bold text-slate-500">{admin.name?.charAt(0)?.toUpperCase()}</span>
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate">
                                                        {fullName(admin)}
                                                        {isSelf && <span className="text-xs text-slate-400 ml-1.5">(tú)</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{admin.identityNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 hidden md:table-cell">
                                            <span className="text-sm text-slate-600">{admin.email}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                    admin.isMaster
                                                        ? "bg-[#ef7d2d]/10 text-[#ef7d2d] border-[#ef7d2d]/20"
                                                        : "bg-slate-50 text-slate-500 border-slate-200"
                                                }`}>
                                                    {admin.isMaster ? "Master" : "Admin"}
                                                </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                                                <span className="text-xs text-slate-500">
                                                    {countActivePermissions(admin)}
                                                </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                                            <span className="text-xs text-slate-500">{fmtDate(admin.createdAt)}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-1">
                                                {/* Permissions — only for non-master */}
                                                {!admin.isMaster && (
                                                    <button
                                                        onClick={() => handleOpenPermissions(admin)}
                                                        title="Gestionar permisos"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-[#ef7d2d]/10 hover:text-[#ef7d2d] transition-colors"
                                                    >
                                                        <Shield size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleOpenEdit(admin)}
                                                    title="Editar"
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-[#34c3d6]/10 hover:text-[#34c3d6] transition-colors"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                {!admin.isMaster && !isSelf && (
                                                    <button
                                                        onClick={() => handleOpenDelete(admin)}
                                                        title="Eliminar"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
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

                {!loadingData && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                        Mostrando {filtered.length} de {admins.length} admin{admins.length !== 1 ? "s" : ""}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AdminModal
                open={showAdminModal}
                onClose={() => { setShowAdminModal(false); setEditAdmin(null); }}
                onSubmit={handleSubmitAdmin}
                loading={adminModalLoading}
                admin={editAdmin}
            />

            <PermissionsModal
                open={showPermsModal}
                onClose={() => { setShowPermsModal(false); setPermsAdmin(null); }}
                onSubmit={handleSubmitPermissions}
                loading={permsLoading}
                admin={permsAdmin}
            />

            <DeleteConfirmModal
                open={showDelete}
                onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
                onConfirm={handleConfirmDelete}
                loading={deleteLoading}
                message={deleteTarget ? `¿Está seguro de eliminar al admin "${deleteTarget.name} ${deleteTarget.lastName1}"? Sus permisos serán eliminados automáticamente.` : undefined}
            />
        </div>
    );
}