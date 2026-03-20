import { LayoutDashboard, ShoppingCart, Boxes, PlusCircle, Package, Truck, Hash } from "lucide-react";

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
        name: "Modelos Producto",
        path: "/modelos",
        icon: Package,
    },
    {
        name: "Pedidos Proveedor",
        path: "/pedidos-proveedor",
        icon: Truck,
    },
    {
        name: "Productos",
        path: "/productos",
        icon: Hash,
    },
];