import { useState } from "react";
import ClientsListView from "../components/clients/ClientsListView";
import ClientFormView from "../components/clients/ClientFormView";
import ModuleCarouselPage from "../components/ui/ModuleCarouselPage";

const PANELS = [
    { key: "list", label: "Listado" },
    { key: "form", label: "Formulario" },
];

export default function Clientes() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedClient, setSelectedClient] = useState(null);

    const totalSlides = PANELS.length;

    function handleStartCreate() {
        setSelectedClient(null);
        setCurrentSlide(1);
    }

    function handleStartEdit(client) {
        setSelectedClient(client);
        setCurrentSlide(1);
    }

    function handleClientSaved() {
        setRefreshKey(prev => prev + 1);
        setSelectedClient(null);
        setCurrentSlide(0);
    }

    return (
        <ModuleCarouselPage currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} totalSlides={totalSlides}>
            <ClientsListView refreshKey={refreshKey} onStartCreate={handleStartCreate} onStartEdit={handleStartEdit} />

            <ClientFormView client={selectedClient} onSaved={handleClientSaved} />
        </ModuleCarouselPage>
    );
}
