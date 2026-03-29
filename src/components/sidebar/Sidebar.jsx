import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import { menu } from "../../config/menu";
import logo from "../../assets/logo_color_AC.png";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import useWindowWidth from "../../hooks/useWindowWidth";
import { useAuth } from "../../context/AuthContext";
import usePermissions from "../../hooks/usePermissions";

const AUTO_COLLAPSE_WIDTH = 980;

export default function Sidebar() {
    const [manualCollapsed, setManualCollapsed] = useState(false);
    const windowWidth = useWindowWidth();
    const { auth, logout } = useAuth();
    const { isMaster, canRead, canWrite } = usePermissions();
    const navigate = useNavigate();

    const isAutoCollapsed = windowWidth < AUTO_COLLAPSE_WIDTH;
    const collapsed = isAutoCollapsed || manualCollapsed;

    function handleToggle() {
        if (isAutoCollapsed) return;
        setManualCollapsed(prev => !prev);
    }

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    // Filter menu items based on permissions
    const visibleMenu = menu.filter(item => {
        // Master-only items
        if (item.masterOnly) return isMaster;
        // No permission key = always visible (Dashboard)
        if (!item.permission) return true;
        // Items that require write access (Registrar Venta)
        if (item.requireWrite) return canWrite(item.permission);
        // Regular items — need at least read
        return canRead(item.permission);
    });

    return (
        <aside
            className={`
                h-full flex flex-col justify-between shrink-0
                bg-[#f8f8f8] border-r border-slate-200
                transition-[width] duration-300
                ${collapsed ? "w-24" : "w-64"}
            `}
        >
            <div>
                {/* Header */}
                {!isAutoCollapsed && (
                    <div
                        className={`
                        flex items-center border-b border-slate-200
                        px-4 py-5
                        ${collapsed ? "justify-center" : "justify-between"}
                    `}
                    >
                        {!collapsed && (
                            <img src={logo} alt='Audiocare' className='w-40 select-none pointer-events-none' draggable='false' />
                        )}

                        <button
                            onClick={handleToggle}
                            className='
                                flex items-center justify-center
                                w-9 h-9 rounded-lg
                                text-slate-700 hover:bg-slate-200
                                transition-colors
                            '
                        >
                            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>
                )}

                {/* Menu */}
                <nav className={`flex flex-col gap-2 p-4 ${collapsed ? "items-center" : ""}`}>
                    {visibleMenu.map(item => (
                        <SidebarItem key={item.name} name={item.name} path={item.path} Icon={item.icon} collapsed={collapsed} />
                    ))}
                </nav>
            </div>

            {/* Logout */}
            <div className='border-t border-slate-200 px-4 py-5'>
                <button
                    onClick={handleLogout}
                    title={collapsed ? "Cerrar sesión" : ""}
                    className={`
                        flex items-center w-full rounded-xl
                        ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"}
                        text-red-500 hover:bg-red-100
                        transition-colors
                    `}
                >
                    <LogOut size={18} />

                    <span
                        className={`
                            whitespace-nowrap overflow-hidden text-ellipsis
                            transition-all duration-200
                            ${collapsed ? "opacity-0 w-0 ml-0" : "opacity-100 ml-1"}
                        `}
                    >
                        Cerrar Sesión
                    </span>
                </button>
            </div>
        </aside>
    );
}