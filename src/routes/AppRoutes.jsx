import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "../pages/LoginPage";

import Dashboard from "../pages/Dashboard";
import Ventas from "../pages/Ventas";
import Inventario from "../pages/Inventario";
import RegistrarVenta from "../pages/RegistrarVenta";
import ModelosProducto from "../pages/ModelosProducto";
import PedidosProveedor from "../pages/PedidosProveedor";
import Productos from "../pages/Productos";

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
                <Route path="/ventas" element={<Ventas />} handle={{ title: "Ventas" }} />
                <Route path="/inventario" element={<Inventario />} handle={{ title: "Inventario" }} />
                <Route path="/registrar-venta" element={<RegistrarVenta />} handle={{ title: "Registrar Venta" }} />
                <Route path="/modelos" element={<ModelosProducto />} handle={{ title: "Modelos de Producto" }} />
                <Route path="/pedidos-proveedor" element={<PedidosProveedor />} handle={{ title: "Pedidos Proveedor" }} />
                <Route path="/productos" element={<Productos />} handle={{ title: "Productos" }} />
            </Route>

            {/* Admin */}
            {/* <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<Users />} />
            </Route> */}

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
