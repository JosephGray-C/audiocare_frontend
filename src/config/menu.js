import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    PlusCircle
} from "lucide-react";

export const menu = [
    {
        name: "Dashboard",
        path: "/",
        icon: LayoutDashboard
    },
    {
        name: "Ventas",
        path: "/ventas",
        icon: ShoppingCart
    },
    {
        name: "Inventario",
        path: "/inventario",
        icon: Package
    },
    {
        name: "Registrar Venta",
        path: "/registrar-venta",
        icon: PlusCircle
    }
];