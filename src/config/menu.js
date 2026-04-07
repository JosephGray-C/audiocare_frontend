import { LayoutDashboard, ShoppingCart, Boxes, PlusCircle, Package, Truck, Hash, Users, ShieldCheck } from "lucide-react";

export const menu = [
    {
        name: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
    },
    {
        name: "Inventario",
        path: "/inventario",
        icon: Boxes,
        permission: "products",
    },
    {
        name: "Ventas",
        path: "/ventas",
        icon: ShoppingCart,
        permission: "sales",
    },
    {
        name: "Modelos Producto",
        path: "/modelos",
        icon: Package,
        permission: "models",
    },
    {
        name: "Pedidos Proveedor",
        path: "/pedidos-proveedor",
        icon: Truck,
        permission: "supplierOrders",
    },
    {
        name: "Productos",
        path: "/productos",
        icon: Hash,
        permission: "products",
    },
    {
        name: "Clientes",
        path: "/clientes",
        icon: Users,
        permission: "clients",
    },
    {
        name: "Administradores",
        path: "/admins",
        icon: ShieldCheck,
        masterOnly: true,
    },
];