import { useMemo, useState } from "react";
import AdminsListView from "../components/admins/AdminsListView";
import AdminFormView from "../components/admins/AdminFormView";
import AdminPermissionsView from "../components/admins/AdminPermissionsView";
import ModuleCarouselPage from "../components/ui/ModuleCarouselPage";

export default function Admins() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [permissionsAdmin, setPermissionsAdmin] = useState(null);

    const slides = useMemo(() => {
        const baseSlides = [
            {
                key: "list",
                content: (
                    <AdminsListView
                        refreshKey={refreshKey}
                        onStartCreate={handleStartCreate}
                        onStartEdit={handleStartEdit}
                        onStartPermissions={handleStartPermissions}
                    />
                ),
            },
            {
                key: "form",
                content: <AdminFormView admin={selectedAdmin} onSaved={handleAdminSaved} />,
            },
        ];

        if (permissionsAdmin) {
            baseSlides.push({
                key: "permissions",
                content: <AdminPermissionsView admin={permissionsAdmin} onSaved={handlePermissionsSaved} />,
            });
        }

        return baseSlides;
    }, [refreshKey, selectedAdmin, permissionsAdmin]);

    const totalSlides = slides.length;

    function handleStartCreate() {
        setSelectedAdmin(null);
        setPermissionsAdmin(null);
        setCurrentSlide(1);
    }

    function handleStartEdit(admin) {
        setSelectedAdmin(admin);
        setPermissionsAdmin(null);
        setCurrentSlide(1);
    }

    function handleStartPermissions(admin) {
        setSelectedAdmin(null);
        setPermissionsAdmin(admin);
        setCurrentSlide(2);
    }

    function handleAdminSaved() {
        setRefreshKey(prev => prev + 1);
        setSelectedAdmin(null);
        setPermissionsAdmin(null);
        setCurrentSlide(0);
    }

    function handlePermissionsSaved() {
        setRefreshKey(prev => prev + 1);
        setPermissionsAdmin(null);
        setCurrentSlide(0);
    }

    return (
        <ModuleCarouselPage currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} totalSlides={totalSlides}>
            {slides.map(slide => slide.content)}
        </ModuleCarouselPage>
    );
}
