import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import { menu } from "../../config/menu";
import logo from "../../assets/logo_color_AC.png";
import { ChevronLeft, ChevronRight, LogOut, User } from "lucide-react";
import useWindowWidth from "../../hooks/useWindowWidth";
import { useAuth } from "../../context/AuthContext";
import usePermissions from "../../hooks/usePermissions";
import { useAlert } from "../../context/AlertContext";
import AppToolTip from "../ui/AppToolTip";

const AUTO_COLLAPSE_WIDTH = 980;

export default function Sidebar() {
    const [manualCollapsed, setManualCollapsed] = useState(false);
    const windowWidth = useWindowWidth();
    const { logout } = useAuth();
    const { isMaster, canRead, canWrite } = usePermissions();
    const navigate = useNavigate();

    const isAutoCollapsed = windowWidth < AUTO_COLLAPSE_WIDTH;
    const collapsed = isAutoCollapsed || manualCollapsed;

    function handleToggle() {
        if (isAutoCollapsed) return;
        setManualCollapsed(prev => !prev);
    }

    const { showConfirm } = useAlert();

    function handleLogout() {
        showConfirm({
            message: "¿Seguro que quieres cerrar sesión?",
            confirmText: "Sí, cerrar",
            cancelText: "Cancelar",
            onConfirm: async () => {
                logout();
                navigate("/login", { replace: true });
            },
            severity: "warning",
        });
    }

    function handlePerfil() {
        navigate("/perfil");
    }

    const visibleMenu = menu.filter(item => {
        if (item.masterOnly) return isMaster;
        if (!item.permission) return true;
        if (item.requireWrite) return canWrite(item.permission);
        return canRead(item.permission);
    });

    const collapseMessage = collapsed ? "Expandir barra lateral" : "Contraer barra lateral";

    const profileButton = (
        <button
            onClick={handlePerfil}
            aria-label='Ir al perfil'
            className={`
                flex items-center w-full rounded-xl
                ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"}
                text-[#34c3d6] hover:bg-[#34c3d6]/10
                transition-colors
            `}
        >
            <User size={18} className='text-[#34c3d6]' />

            <span
                className={`
                    whitespace-nowrap overflow-hidden text-ellipsis
                    transition-all duration-200
                    ${collapsed ? "opacity-0 w-0 ml-0" : "opacity-100 ml-1"}
                `}
            >
                Perfil
            </span>
        </button>
    );

    const logoutButton = (
        <button
            onClick={handleLogout}
            aria-label='Cerrar sesión'
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
    );

    return (
        <aside
            className={`
                h-full shrink-0 flex flex-col overflow-hidden
                bg-[#f8f8f8] border-r border-slate-200
                transition-[width] duration-300
                ${collapsed ? "w-24" : "w-64"}
            `}
        >
            {!isAutoCollapsed && (
                <div
                    className={`
                        flex items-center border-b border-slate-200
                        px-4 py-5 shrink-0
                        ${collapsed ? "justify-center" : "justify-between"}
                    `}
                >
                    {!collapsed && <img src={logo} alt='Audiocare' className='w-40 select-none pointer-events-none' draggable='false' />}

                    <AppToolTip message={collapseMessage} position='bottom'>
                        <button
                            onClick={handleToggle}
                            aria-label={collapseMessage}
                            className='
                                flex items-center justify-center
                                w-9 h-9 rounded-lg
                                text-slate-700 hover:bg-slate-200
                                transition-colors
                            '
                        >
                            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </AppToolTip>
                </div>
            )}

            <div className='flex-1 min-h-0 overflow-y-auto hide-scrollbar'>
                <nav className={`flex flex-col gap-2 p-4 pb-6 ${collapsed ? "items-center" : ""}`}>
                    {visibleMenu.map(item => (
                        <SidebarItem key={item.name} name={item.name} path={item.path} Icon={item.icon} collapsed={collapsed} />
                    ))}
                </nav>
            </div>

            <div className='border-t border-slate-200 px-4 py-5 shrink-0 space-y-2'>
                {collapsed ? (
                    <AppToolTip message='Perfil' position='right' className='w-full'>
                        {profileButton}
                    </AppToolTip>
                ) : (
                    profileButton
                )}

                {collapsed ? (
                    <AppToolTip message='Cerrar sesión' position='right' className='w-full'>
                        {logoutButton}
                    </AppToolTip>
                ) : (
                    logoutButton
                )}
            </div>
        </aside>
    );
}
