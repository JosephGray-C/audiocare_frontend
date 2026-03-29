import { useState, useEffect } from "react";
import { X, Shield, Eye, Pencil } from "lucide-react";
import LoadingButton from "../ui/LoadingButton";

// Permission modules config — defines structure for all modules
const MODULES = [
    { key: "model",         label: "Modelos de Producto",  readKey: "modelRead",         crudKey: "modelCrud",         crudLabel: "CRUD" },
    { key: "supplierOrder", label: "Pedidos Proveedor",    readKey: "supplierOrderRead", crudKey: "supplierOrderCru",  crudLabel: "CRU" },
    { key: "product",       label: "Productos",            readKey: "productRead",       crudKey: "productCrud",       crudLabel: "CRUD" },
    { key: "movements",     label: "Movimientos Inventario", readKey: "movementsRead",   crudKey: null,                crudLabel: null }, // Solo lectura
    { key: "client",        label: "Clientes",             readKey: "clientRead",        crudKey: "clientCrud",        crudLabel: "CRUD" },
    { key: "sale",          label: "Ventas",               readKey: "saleRead",          crudKey: "saleCrud",          crudLabel: "CRUD" },
];

function buildPermissionsState(permissions) {
    return {
        modelRead:         permissions?.modelRead ?? false,
        modelCrud:         permissions?.modelCrud ?? false,
        supplierOrderRead: permissions?.supplierOrderRead ?? false,
        supplierOrderCru:  permissions?.supplierOrderCru ?? false,
        productRead:       permissions?.productRead ?? false,
        productCrud:       permissions?.productCrud ?? false,
        movementsRead:     permissions?.movementsRead ?? false,
        clientRead:        permissions?.clientRead ?? false,
        clientCrud:        permissions?.clientCrud ?? false,
        saleRead:          permissions?.saleRead ?? false,
        saleCrud:          permissions?.saleCrud ?? false,
    };
}

export default function PermissionsModal({ open, onClose, onSubmit, loading = false, admin = null }) {
    const [perms, setPerms] = useState(() => buildPermissionsState(null));
    const [original, setOriginal] = useState(() => buildPermissionsState(null));

    useEffect(() => {
        if (open && admin) {
            const state = buildPermissionsState(admin.permissions);
            setPerms(state);
            setOriginal(state);
        }
    }, [open, admin]);

    const hasChanges = JSON.stringify(perms) !== JSON.stringify(original);

    useEffect(() => {
        function handleKey(e) {
            if (e.key === "Escape" && !loading) onClose();
        }
        if (open) {
            document.addEventListener("keydown", handleKey);
            return () => document.removeEventListener("keydown", handleKey);
        }
    }, [open, onClose, loading]);

    // ── Toggle logic ─────────────────────────────────────────────────────
    // When CRUD is toggled ON → Read auto-enables (locked)
    // When CRUD is toggled OFF → Read stays independently toggleable
    // When Read is toggled OFF → CRUD also turns off (can't write without read)

    function toggleRead(readKey, crudKey) {
        setPerms(prev => {
            const newRead = !prev[readKey];
            const updates = { [readKey]: newRead };
            // If turning off read, also turn off crud
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
            // If turning on crud, auto-enable read
            if (newCrud) {
                updates[readKey] = true;
            }
            return { ...prev, ...updates };
        });
    }

    function handleSelectAll() {
        const allOn = {};
        MODULES.forEach(m => {
            allOn[m.readKey] = true;
            if (m.crudKey) allOn[m.crudKey] = true;
        });
        setPerms(allOn);
    }

    function handleClearAll() {
        setPerms(buildPermissionsState(null));
    }

    function handleSubmit() {
        // Ensure read is true when crud is true (safety net)
        const payload = { ...perms };
        MODULES.forEach(m => {
            if (m.crudKey && payload[m.crudKey]) {
                payload[m.readKey] = true;
            }
        });
        onSubmit(payload);
    }

    if (!open || !admin) return null;

    const adminName = [admin.name, admin.lastName1].filter(Boolean).join(" ");

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={loading ? undefined : onClose} />

            <div className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Shield size={18} className="text-[#ef7d2d]" />
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Permisos</h3>
                            <p className="text-xs text-slate-400">{adminName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto space-y-1">
                    {/* Quick actions */}
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        >
                            Seleccionar todo
                        </button>
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        >
                            Quitar todo
                        </button>
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 pb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Módulo</span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Lectura</span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Escritura</span>
                    </div>

                    {/* Module rows */}
                    {MODULES.map(mod => {
                        const readOn = perms[mod.readKey];
                        const crudOn = mod.crudKey ? perms[mod.crudKey] : false;
                        const readLocked = crudOn; // Read is locked when crud is on

                        return (
                            <div
                                key={mod.key}
                                className={`
                                    grid grid-cols-[1fr_80px_80px] gap-2 items-center px-3 py-3 rounded-xl transition-colors
                                    ${readOn || crudOn ? "bg-slate-50/80" : ""}
                                `}
                            >
                                {/* Module name */}
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{mod.label}</p>
                                    {!mod.crudKey && (
                                        <p className="text-[11px] text-slate-400">Solo lectura</p>
                                    )}
                                </div>

                                {/* Read toggle */}
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => !readLocked && toggleRead(mod.readKey, mod.crudKey)}
                                        disabled={readLocked}
                                        title={readLocked ? "Activo por escritura" : (readOn ? "Desactivar lectura" : "Activar lectura")}
                                        className={`
                                            w-9 h-9 flex items-center justify-center rounded-lg transition-all
                                            ${readOn
                                            ? readLocked
                                                ? "bg-[#34c3d6]/15 text-[#34c3d6] cursor-default"
                                                : "bg-[#34c3d6]/15 text-[#34c3d6] hover:bg-[#34c3d6]/25"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                        }
                                        `}
                                    >
                                        <Eye size={15} />
                                    </button>
                                </div>

                                {/* CRUD toggle */}
                                <div className="flex justify-center">
                                    {mod.crudKey ? (
                                        <button
                                            type="button"
                                            onClick={() => toggleCrud(mod.readKey, mod.crudKey)}
                                            title={crudOn ? `Desactivar ${mod.crudLabel}` : `Activar ${mod.crudLabel}`}
                                            className={`
                                                w-9 h-9 flex items-center justify-center rounded-lg transition-all
                                                ${crudOn
                                                ? "bg-[#ef7d2d]/15 text-[#ef7d2d] hover:bg-[#ef7d2d]/25"
                                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                            }
                                            `}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-300">—</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
                    <button
                        type="button" onClick={onClose} disabled={loading}
                        className="rounded-xl border border-slate-300 bg-white px-6 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <LoadingButton onClick={handleSubmit} loading={loading} disabled={!hasChanges}>
                        Guardar permisos
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}