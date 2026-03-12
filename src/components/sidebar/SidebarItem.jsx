import { NavLink } from "react-router-dom";

export default function SidebarItem({ name, path, Icon, collapsed }) {
    return (
        <NavLink
            to={path}
            title={collapsed ? name : ""}
            className={({ isActive }) => `
                relative flex items-center w-full rounded-xl
                ${collapsed ? "justify-center px-0 py-4" : "gap-3 px-4 py-4"}
                transition-all duration-200
                ${isActive ? "bg-[#d8eef1] text-slate-800" : "text-slate-600 hover:bg-slate-200 hover:text-slate-800"}
            `}
        >
            {({ isActive }) => (
                <>
                    {isActive && <div className='absolute left-0 top-3 bottom-3 w-1 bg-[#ef7d2d] rounded-r-full' />}

                    <Icon size={18} className={isActive ? "text-[#f0a45a]" : "text-slate-500"} />

                    <span
                        className={`
                            whitespace-nowrap overflow-hidden text-ellipsis font-medium
                            transition-all duration-200
                            ${collapsed ? "opacity-0 w-0 ml-0" : "opacity-100"}
                        `}
                    >
                        {name}
                    </span>
                </>
            )}
        </NavLink>
    );
}
