import { NavLink } from "react-router-dom";

export default function SidebarItem({ name, path, Icon, collapsed }) {
    return (
        <NavLink
            to={path}
            title={collapsed ? name : ""}
            className={({ isActive }) =>`
                relative flex items-center w-full
                ${collapsed ? "justify-center" : ""}
                p-2 rounded
                transition-all duration-200
                ${isActive ? "bg-purple-100 text-purple-700" : "hover:bg-gray-200"}
            `}>
            {({ isActive }) => (
                <>
                    {isActive && <div className="absolute left-0 top-1 bottom-1 w-1 bg-purple-600 rounded-r" />}

                    <Icon size={18} />

                    <span
                        className={`
                            flex-shrink-0
                            whitespace-nowrap
                            overflow-hidden
                            text-ellipsis
                            transition-all duration-200
                            ${collapsed ? "opacity-0 w-0 ml-0" : "opacity-100 ml-3"}
                        `}>
                        {name}
                    </span>
                </>
            )}
        </NavLink>
    );
}
