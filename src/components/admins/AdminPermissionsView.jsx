import { useState, useEffect } from "react";
import { Shield, Eye, Pencil } from "lucide-react";
import { updateAdminPermissions } from "../../services/adminService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import ModuleFormActions from "../ui/ModuleFormActions";
import AppToolTip from "../ui/AppToolTip";

const MODULES = [
    { key: "model", label: "Modelos de Producto", readKey: "modelRead", crudKey: "modelCrud", crudLabel: "CRUD" },
    { key: "supplierOrder", label: "Pedidos Proveedor", readKey: "supplierOrderRead", crudKey: "supplierOrderCru", crudLabel: "CRU" },
    { key: "product", label: "Productos", readKey: "productRead", crudKey: "productCrud", crudLabel: "CRUD" },
    { key: "movements", label: "Movimientos Inventario", readKey: "movementsRead", crudKey: null, crudLabel: null },
    { key: "client", label: "Clientes", readKey: "clientRead", crudKey: "clientCrud", crudLabel: "CRUD" },
    { key: "sale", label: "Ventas", readKey: "saleRead", crudKey: "saleCrud", crudLabel: "CRUD" },
];

function buildPermissionsState(permissions) {
    return {
        modelRead: permissions?.modelRead ?? false,
        modelCrud: permissions?.modelCrud ?? false,
        supplierOrderRead: permissions?.supplierOrderRead ?? false,
        supplierOrderCru: permissions?.supplierOrderCru ?? false,
        productRead: permissions?.productRead ?? false,
        productCrud: permissions?.productCrud ?? false,
        movementsRead: permissions?.movementsRead ?? false,
        clientRead: permissions?.clientRead ?? false,
        clientCrud: permissions?.clientCrud ?? false,
        saleRead: permissions?.saleRead ?? false,
        saleCrud: permissions?.saleCrud ?? false,
    };
}

export default function AdminPermissionsView({ admin = null, onSaved }) {
    const [perms, setPerms] = useState(buildPermissionsState(null));
    const [original, setOriginal] = useState(buildPermissionsState(null));
    const [loading, setLoading] = useState(false);

    const { showAlert } = useAlert();

    useEffect(() => {
        const state = buildPermissionsState(admin?.permissions);
        setPerms(state);
        setOriginal(state);
    }, [admin]);

    if (!admin) return null;

    const adminName = [admin?.name, admin?.lastName1].filter(Boolean).join(" ");

    function toggleRead(readKey, crudKey) {
        setPerms(prev => {
            const newRead = !prev[readKey];
            const updates = { [readKey]: newRead };

            if (!newRead && crudKey) {
                updates[crudKey] = false;
            }

            return { ...prev, ...updates };
        });
    }

    function toggleCrud(readKey, crudKey) {
        setPerms(prev => {
            const newCrud = !prev[crudKey];
            const updates = { [crudKey]: newCrud };

            if (newCrud) {
                updates[readKey] = true;
            }

            return { ...prev, ...updates };
        });
    }

    function handleSelectAll() {
        const allOn = {};
        MODULES.forEach(module => {
            allOn[module.readKey] = true;
            if (module.crudKey) allOn[module.crudKey] = true;
        });
        setPerms(allOn);
    }

    function handleClearAll() {
        setPerms(buildPermissionsState(null));
    }

    function handleReset() {
        setPerms(original);
    }

    async function handleSubmit() {
        if (!admin) return;

        try {
            setLoading(true);

            const payload = { ...perms };

            MODULES.forEach(module => {
                if (module.crudKey && payload[module.crudKey]) {
                    payload[module.readKey] = true;
                }
            });

            await updateAdminPermissions(admin.id, payload);
            showAlert("Permisos actualizados correctamente", "success");
            onSaved?.();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='w-full'>
            <div className='max-w-5xl mx-auto space-y-5'>
                <ModulePanelHeader
                    title='Permisos de Administrador'
                    subtitle={adminName || "Seleccione un administrador para gestionar permisos"}
                    icon={Shield}
                    variant='form'
                />

                <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4'>
                    <div className='flex flex-wrap gap-2'>
                        <button
                            type='button'
                            onClick={handleSelectAll}
                            className='text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors'
                        >
                            Seleccionar todo
                        </button>

                        <button
                            type='button'
                            onClick={handleClearAll}
                            className='text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors'
                        >
                            Quitar todo
                        </button>
                    </div>

                    <div className='grid grid-cols-[1fr_80px_80px] gap-2 px-3 pb-2'>
                        <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>Módulo</span>
                        <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider text-center'>Lectura</span>
                        <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider text-center'>Escritura</span>
                    </div>

                    <div className='space-y-1'>
                        {MODULES.map(module => {
                            const readOn = perms[module.readKey];
                            const crudOn = module.crudKey ? perms[module.crudKey] : false;
                            const readLocked = crudOn;
                            const readMessage = readLocked ? "Activo por escritura" : readOn ? "Desactivar lectura" : "Activar lectura";
                            const crudMessage = crudOn ? `Desactivar ${module.crudLabel}` : `Activar ${module.crudLabel}`;

                            return (
                                <div
                                    key={module.key}
                                    className={`
                                        grid grid-cols-[1fr_80px_80px] gap-2 items-center px-3 py-3 rounded-xl transition-colors
                                        ${readOn || crudOn ? "bg-slate-50/80" : ""}
                                    `}
                                >
                                    <div>
                                        <p className='text-sm font-medium text-slate-700'>{module.label}</p>
                                        {!module.crudKey && <p className='text-[11px] text-slate-400'>Solo lectura</p>}
                                    </div>

                                    <div className='flex justify-center'>
                                        <AppToolTip message={readMessage} position='top'>
                                            <button
                                                type='button'
                                                onClick={() => !readLocked && toggleRead(module.readKey, module.crudKey)}
                                                disabled={readLocked}
                                                aria-label={readMessage}
                                                className={`
                                                    w-9 h-9 flex items-center justify-center rounded-lg transition-all
                                                    ${
                                                        readOn
                                                            ? readLocked
                                                                ? "bg-[#34c3d6]/15 text-[#34c3d6] cursor-default"
                                                                : "bg-[#34c3d6]/15 text-[#34c3d6] hover:bg-[#34c3d6]/25"
                                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                    }
                                                `}
                                            >
                                                <Eye size={15} />
                                            </button>
                                        </AppToolTip>
                                    </div>

                                    <div className='flex justify-center'>
                                        {module.crudKey ? (
                                            <AppToolTip message={crudMessage} position='top'>
                                                <button
                                                    type='button'
                                                    onClick={() => toggleCrud(module.readKey, module.crudKey)}
                                                    aria-label={crudMessage}
                                                    className={`
                                                        w-9 h-9 flex items-center justify-center rounded-lg transition-all
                                                        ${
                                                            crudOn
                                                                ? "bg-[#ef7d2d]/15 text-[#ef7d2d] hover:bg-[#ef7d2d]/25"
                                                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                        }
                                                    `}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </AppToolTip>
                                        ) : (
                                            <span className='text-xs text-slate-300'>—</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <ModuleFormActions
                    onReset={handleReset}
                    resetText='Restablecer'
                    submitText='Guardar permisos'
                    loading={loading}
                    submitType='button'
                    onSubmitClick={handleSubmit}
                />
            </div>
        </div>
    );
}
