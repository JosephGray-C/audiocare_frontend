import { useState } from "react";
import ProductsListView from "../components/products/ProductListView";
import ProductFormView from "../components/products/ProductFormView";
import ModuleCarouselPage from "../components/ui/ModuleCarouselPage";

const PANELS = [
    { key: "list", label: "Listado" },
    { key: "form", label: "Formulario" },
];

export default function Productos() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const totalSlides = PANELS.length;

    function handleStartCreate() {
        setSelectedProduct(null);
        setCurrentSlide(1);
    }

    function handleStartEdit(product) {
        setSelectedProduct(product);
        setCurrentSlide(1);
    }

    function handleProductSaved() {
        setRefreshKey(prev => prev + 1);
        setSelectedProduct(null);
        setCurrentSlide(0);
    }

    return (
        <ModuleCarouselPage
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            totalSlides={totalSlides}
            panelLabels={PANELS.map(panel => panel.label)}
        >
            <ProductsListView refreshKey={refreshKey} onStartCreate={handleStartCreate} onStartEdit={handleStartEdit} />

            <ProductFormView product={selectedProduct} onSaved={handleProductSaved} />
        </ModuleCarouselPage>
    );
}
