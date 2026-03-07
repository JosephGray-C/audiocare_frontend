import SidebarItem from "./SidebarItem";
import { menu } from "../config/menu";

export default function Sidebar() {
    return (
        <aside className="w-64 h-screen bg-gray-100 p-4">
            <h1 className="text-xl font-bold mb-6">Audiocare</h1>

            <nav className="flex flex-col gap-2">
                {menu.map((item) => (
                    <SidebarItem
                        key={item.name}
                        name={item.name}
                        path={item.path}
                        Icon={item.icon}
                    />
                ))}
            </nav>
        </aside>
    );
}
