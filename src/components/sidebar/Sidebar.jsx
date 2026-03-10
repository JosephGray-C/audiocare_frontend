import { useState } from "react";
import SidebarItem from "./SidebarItem";
import { menu } from "../../config/menu";
import logo from "../../assets/logo_blanco_AC.png";

import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`h-full flex flex-col justify-between bg-[#0f172a] text-gray-300 transition-[width] duration-300
            ${collapsed ? "w-20" : "w-64"}`}
        >
            {/* TOP SECTION */}
            <div>
                {/* Header */}
                <div
                    className={`
                        flex items-center
                        p-4 ${collapsed ? "justify-center" : "justify-between"} 
                        transition-all 
                        duration-300
                    `}
                >
                    {!collapsed && <img src={logo} alt='Audiocare' className='w-40 select-none pointer-events-none' draggable='false' />}

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className='
                            flex items-center justify-center
                            w-8 h-8
                            rounded-md
                            text-gray-400
                            hover:text-white
                            hover:bg-slate-700
                            transition-colors duration-200
                        '
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Menu */}
                <nav className={`flex flex-col gap-1 p-2 ${collapsed ? "items-center" : ""} transition-all duration-300`}>
                    {menu.map(item => (
                        <SidebarItem key={item.name} name={item.name} path={item.path} Icon={item.icon} collapsed={collapsed} />
                    ))}
                </nav>
            </div>

            {/* LOGOUT SECTION */}
            <div className='border-t border-slate-700 p-2'>
                <button
                    title={collapsed ? "Cerrar sesión" : ""}
                    className={`
                        flex items-center w-full
                        ${collapsed ? "justify-center" : "gap-3"}
                        px-2 py-2 rounded-md
                        text-red-400 hover:bg-slate-700 hover:text-red-300
                        transition-colors duration-200
                    `}
                >
                    <LogOut size={18} />

                    <span
                        className={`
                            whitespace-nowrap overflow-hidden text-ellipsis
                            transition-all duration-200
                            ${collapsed ? "opacity-0 w-0 ml-0" : "opacity-100 ml-3"}
                        `}
                    >
                        Cerrar sesión
                    </span>
                </button>
            </div>
        </aside>
    );
}
