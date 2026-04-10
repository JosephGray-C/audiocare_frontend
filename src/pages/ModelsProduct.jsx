import { useState } from "react";
import ModelProductListView from "../components/models/ModelProductListView";
import ModelProductFormView from "../components/models/ModelProductFormView";
import ModuleCarouselPage from "../components/ui/ModuleCarouselPage";

const PANELS = [
    { key: "list", label: "Listado" },
    { key: "form", label: "Formulario" },
];

export default function ModelsProduct() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedModel, setSelectedModel] = useState(null);

    const totalSlides = PANELS.length;

    function handleStartCreate() {
        setSelectedModel(null);
        setCurrentSlide(1);
    }

    function handleStartEdit(model) {
        setSelectedModel(model);
        setCurrentSlide(1);
    }

    function handleModelSaved() {
        setRefreshKey(prev => prev + 1);
        setSelectedModel(null);
        setCurrentSlide(0);
    }

    return (
        <ModuleCarouselPage
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            totalSlides={totalSlides}
            panelLabels={PANELS.map(panel => panel.label)}
        >
            <ModelProductListView refreshKey={refreshKey} onStartCreate={handleStartCreate} onStartEdit={handleStartEdit} />

            <ModelProductFormView model={selectedModel} onSaved={handleModelSaved} />
        </ModuleCarouselPage>
    );
}
