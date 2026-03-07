import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/Dashboard";
import Ventas from "../pages/Ventas";
import Inventario from "../pages/Inventario";
import RegistrarVenta from "../pages/RegistrarVenta";

export default function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <MainLayout>
                        <Dashboard />
                    </MainLayout>
                }
            />

            <Route
                path="/ventas"
                element={
                    <MainLayout>
                        <Ventas />
                    </MainLayout>
                }
            />

            <Route
                path="/inventario"
                element={
                    <MainLayout>
                        <Inventario />
                    </MainLayout>
                }
            />

            <Route
                path="/registrar-venta"
                element={
                    <MainLayout>
                        <RegistrarVenta />
                    </MainLayout>
                }
            />
        </Routes>
    );
}
