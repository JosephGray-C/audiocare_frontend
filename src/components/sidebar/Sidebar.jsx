import { useState } from "react";
import SidebarItem from "./SidebarItem";
import { menu } from "../../config/menu";

import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`h-screen flex flex-col justify-between bg-gray-100 transition-[width] duration-300
            ${collapsed ? "w-20" : "w-64"}`}>
            {/* TOP SECTION */}
            <div>
                {/* Header */}
                <div className={`flex items-center p-4 ${collapsed ? "justify-center" : "justify-between"} transition-all duration-300`}>
                    {!collapsed && <h1 className="text-xl font-bold transition-opacity duration-200">Audiocare</h1>}

                    <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-200 rounded transition">
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
            <div>
                <div className="border-t border-gray-200 my-2" />

                <div className={`p-2 ${collapsed ? "flex justify-center" : ""}`}>
                    <button
                        title={collapsed ? "Cerrar sesión" : ""}
                        className={`
                            relative flex items-center w-full
                            ${collapsed ? "justify-center" : ""}
                            p-2 rounded
                            hover:bg-red-100 text-red-600
                            transition-all duration-200
                        `}>
                        <LogOut size={18} />

                        <span
                            className={`
                                flex-shrink-0
                                whitespace-nowrap
                                overflow-hidden
                                text-ellipsis
                                transition-all duration-200
                                ${collapsed ? "opacity-0 w-0 ml-0" : "opacity-100 ml-3"}
                            `}>
                            Cerrar sesión
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
