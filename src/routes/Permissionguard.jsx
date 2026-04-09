import { Navigate } from "react-router-dom";
import usePermissions from "../hooks/usePermissions";

/**
 * Wraps a page component and checks permissions before rendering.
 *
 * Props:
 *  - module: permission module key (e.g. "models", "sales", "clients")
 *  - requireWrite: if true, requires write permission (default: false, only read)
 *  - masterOnly: if true, only master can access
 *  - children: the page component to render
 */
export default function PermissionGuard({ module, requireWrite = false, masterOnly = false, children }) {
    const { isMaster, canRead, canWrite } = usePermissions();

    // Master-only pages
    if (masterOnly && !isMaster) {
        return <Navigate to="/" replace />;
    }

    // Module permission check
    if (module) {
        if (requireWrite && !canWrite(module)) {
            return <Navigate to="/" replace />;
        }
        if (!requireWrite && !canRead(module)) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
}