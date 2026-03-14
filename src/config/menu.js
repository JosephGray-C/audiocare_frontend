import { LayoutDashboard, ShoppingCart, Boxes, PlusCircle, FolderKanban, PackagePlus } from "lucide-react";

export const menu = [
    {
        name: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
    },
    {
        name: "Ventas",
        path: "/ventas",
        icon: ShoppingCart,
    },
    {
        name: "Inventario",
        path: "/inventario",
        icon: Boxes,
    },
    {
        name: "Registrar Venta",
        path: "/registrar-venta",
        icon: PlusCircle,
    },
    {
        name: "Registrar Modelo Producto",
        path: "/registrar-modelo-producto",
        icon: FolderKanban,
    },
];