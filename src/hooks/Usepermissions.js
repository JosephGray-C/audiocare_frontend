import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Hook to check permissions for the logged-in admin.
 *
 * Master admins have full access to everything.
 * Regular admins have granular permissions per module.
 *
 * Usage:
 *   const { canRead, canWrite, isMaster } = usePermissions();
 *   canRead("models")   → true/false
 *   canWrite("products") → true/false
 */

// Maps module keys to permission field names
const MODULE_MAP = {
    models:         { read: "modelRead",         write: "modelCrud" },
    supplierOrders: { read: "supplierOrderRead", write: "supplierOrderCru" },
    products:       { read: "productRead",       write: "productCrud" },
    movements:      { read: "movementsRead",     write: null }, // read-only module
    clients:        { read: "clientRead",        write: "clientCrud" },
    sales:          { read: "saleRead",          write: "saleCrud" },
    admins:         { read: null,                write: null }, // master-only
};

export default function usePermissions() {
    const { auth } = useAuth();

    const permissions = useMemo(() => {
        const isMaster = auth?.isMaster === true;
        const perms = auth?.permissions || {};

        function canRead(module) {
            if (isMaster) return true;
            if (module === "admins") return false; // only master
            const mapping = MODULE_MAP[module];
            if (!mapping || !mapping.read) return false;
            return perms[mapping.read] === true;
        }

        function canWrite(module) {
            if (isMaster) return true;
            if (module === "admins") return false; // only master
            const mapping = MODULE_MAP[module];
            if (!mapping || !mapping.write) return false;
            return perms[mapping.write] === true;
        }

        return { isMaster, canRead, canWrite };
    }, [auth]);

    return permissions;
}