import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import PermissionGuard from "./PermissionGuard";
import LoginPage from "../pages/LoginPage";
import Dashboard from "../pages/Dashboard";
import Ventas from "../pages/Ventas";
import Inventario from "../pages/Inventario";
import RegistrarVenta from "../pages/RegistrarVenta";
import ModelosProducto from "../pages/ModelosProducto";
import PedidosProveedor from "../pages/PedidosProveedor";
import Productos from "../pages/Productos";
import Clientes from "../pages/Clientes";
import Admins from "../pages/Admins";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Main app — protected */}
            <Route
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Dashboard />} handle={{ title: "Dashboard" }} />

                <Route path="/ventas" element={
                    <PermissionGuard module="sales"><Ventas /></PermissionGuard>
                } handle={{ title: "Ventas" }} />

                <Route path="/inventario" element={
                    <PermissionGuard module="products"><Inventario /></PermissionGuard>
                } handle={{ title: "Inventario" }} />

                <Route path="/registrar-venta" element={
                    <PermissionGuard module="sales" requireWrite><RegistrarVenta /></PermissionGuard>
                } handle={{ title: "Registrar Venta" }} />

                <Route path="/modelos" element={
                    <PermissionGuard module="models"><ModelosProducto /></PermissionGuard>
                } handle={{ title: "Modelos Producto" }} />

                <Route path="/pedidos-proveedor" element={
                    <PermissionGuard module="supplierOrders"><PedidosProveedor /></PermissionGuard>
                } handle={{ title: "Pedidos Proveedor" }} />

                <Route path="/productos" element={
                    <PermissionGuard module="products"><Productos /></PermissionGuard>
                } handle={{ title: "Productos" }} />

                <Route path="/clientes" element={
                    <PermissionGuard module="clients"><Clientes /></PermissionGuard>
                } handle={{ title: "Clientes" }} />

                <Route path="/admins" element={
                    <PermissionGuard masterOnly><Admins /></PermissionGuard>
                } handle={{ title: "Administradores" }} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}