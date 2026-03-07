import { NavLink } from "react-router-dom";

export default function SidebarItem({ name, path, Icon }) {
    return (
        <NavLink
            to={path}
            className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded 
        ${isActive ? "bg-gray-200" : "hover:bg-gray-100"}`
            }
        >
            <Icon size={18} />
            {name}
        </NavLink>
    );
}