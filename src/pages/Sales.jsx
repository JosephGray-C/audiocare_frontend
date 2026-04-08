import { useState } from "react";
import SalesListView from "../components/sales/SalesListView";
import SalesFormView from "../components/sales/SalesFormView";
import ModuleCarouselPage from "../components/ui/ModuleCarouselPage";

const PANELS = [
    { key: "list", label: "Listado" },
    { key: "form", label: "Formulario" },
];

export default function Sales() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);

    const totalSlides = PANELS.length;

    function handleStartCreateSale() {
        setCurrentSlide(1);
    }

    function handleSaleCreated() {
        setRefreshKey(prev => prev + 1);
        setCurrentSlide(0);
    }

    return (
        <ModuleCarouselPage currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} totalSlides={totalSlides}>
            <SalesListView refreshKey={refreshKey} onStartCreateSale={handleStartCreateSale} />

            <SalesFormView onSaleCreated={handleSaleCreated} />
        </ModuleCarouselPage>
    );
}
