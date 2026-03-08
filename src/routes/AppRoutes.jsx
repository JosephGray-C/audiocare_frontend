import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/Dashboard";
import Ventas from "../pages/Ventas";
import Inventario from "../pages/Inventario";
import RegistrarVenta from "../pages/RegistrarVenta";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Auth */}
            {/* <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
            </Route> */}

            {/* Main app */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ventas" element={<Ventas />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/registrar-venta" element={<RegistrarVenta/>} />
            </Route>

            {/* Admin */}
            {/* <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<Users />} />
            </Route> */}
        </Routes>
    );
}