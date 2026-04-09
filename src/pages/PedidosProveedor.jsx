import { useState } from "react";
import SupplierOrderListView from "../components/supplier-orders/SupplierOrderListView";
import SupplierOrderFormView from "../components/supplier-orders/SupplierOrderFormView";
import ModuleCarouselPage from "../components/ui/ModuleCarouselPage";

const PANELS = [
    { key: "list", label: "Listado" },
    { key: "form", label: "Formulario" },
];

export default function PedidosProveedor() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const totalSlides = PANELS.length;

    function handleStartCreate() {
        setSelectedOrder(null);
        setCurrentSlide(1);
    }

    function handleStartEdit(order) {
        setSelectedOrder(order);
        setCurrentSlide(1);
    }

    function handleOrderSaved() {
        setRefreshKey(prev => prev + 1);
        setSelectedOrder(null);
        setCurrentSlide(0);
    }

    return (
        <ModuleCarouselPage currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} totalSlides={totalSlides}>
            <SupplierOrderListView refreshKey={refreshKey} onStartCreate={handleStartCreate} onStartEdit={handleStartEdit} />

            <SupplierOrderFormView order={selectedOrder} onSaved={handleOrderSaved} />
        </ModuleCarouselPage>
    );
}
