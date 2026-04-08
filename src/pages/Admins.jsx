import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AdminsListView from "../components/admins/AdminsListView";
import AdminFormView from "../components/admins/AdminFormView";
import AdminPermissionsView from "../components/admins/AdminPermissionsView";

const PANELS = [
    { key: "list", label: "Listado" },
    { key: "form", label: "Formulario" },
    { key: "permissions", label: "Permisos" },
];

export default function Admins() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [permissionsAdmin, setPermissionsAdmin] = useState(null);

    const totalSlides = PANELS.length;

    const trackStyle = useMemo(() => {
        return {
            width: `${totalSlides * 100}%`,
            transform: `translate3d(-${currentSlide * (100 / totalSlides)}%, 0, 0)`,
        };
    }, [currentSlide, totalSlides]);

    function goToNextSlide() {
        setCurrentSlide(prev => (prev + 1) % totalSlides);
    }

    function goToPrevSlide() {
        setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
    }

    function handleStartCreate() {
        setSelectedAdmin(null);
        setCurrentSlide(1);
    }

    function handleStartEdit(admin) {
        setSelectedAdmin(admin);
        setCurrentSlide(1);
    }

    function handleStartPermissions(admin) {
        setPermissionsAdmin(admin);
        setCurrentSlide(2);
    }

    function handleAdminSaved() {
        setRefreshKey(prev => prev + 1);
        setSelectedAdmin(null);
        setCurrentSlide(0);
    }

    function handlePermissionsSaved() {
        setRefreshKey(prev => prev + 1);
        setPermissionsAdmin(null);
        setCurrentSlide(0);
    }

    return (
        <div className='space-y-4'>
            <div className='py-3'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4 min-h-8'>
                        <div className='flex items-center gap-3'>
                            <button
                                type='button'
                                onClick={goToPrevSlide}
                                className='inline-flex items-center justify-center text-slate-400 transition-colors hover:text-slate-700'
                                aria-label='Panel anterior'
                                title='Anterior'
                            >
                                <ChevronLeft size={24} strokeWidth={2.2} />
                            </button>

                            <button
                                type='button'
                                onClick={goToNextSlide}
                                className='inline-flex items-center justify-center text-slate-400 transition-colors hover:text-slate-700'
                                aria-label='Panel siguiente'
                                title='Siguiente'
                            >
                                <ChevronRight size={24} strokeWidth={2.2} />
                            </button>
                        </div>

                        <div className='flex items-center gap-2' aria-label='Indicadores del carrusel'>
                            {PANELS.map((panel, index) => {
                                const isActive = index === currentSlide;

                                return (
                                    <div
                                        key={panel.key}
                                        className={`
                                            rounded-full transition-all duration-300
                                            ${isActive ? "w-7 h-2.5 bg-[#34c3d6]" : "w-2.5 h-2.5 bg-slate-300"}
                                        `}
                                        title={panel.label}
                                        aria-label={panel.label}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className='-mx-4 lg:-mx-6 xl:-mx-8'>
                <div className='w-full overflow-hidden'>
                    <div
                        className='
                            flex transform-gpu will-change-transform
                            transition-transform duration-500
                            ease-[cubic-bezier(0.22,1,0.36,1)]
                        '
                        style={trackStyle}
                    >
                        <section className='shrink-0 px-4 lg:px-6 xl:px-8' style={{ width: `${100 / totalSlides}%` }}>
                            <AdminsListView
                                refreshKey={refreshKey}
                                onStartCreate={handleStartCreate}
                                onStartEdit={handleStartEdit}
                                onStartPermissions={handleStartPermissions}
                            />
                        </section>

                        <section className='shrink-0 px-4 lg:px-6 xl:px-8' style={{ width: `${100 / totalSlides}%` }}>
                            <AdminFormView admin={selectedAdmin} onSaved={handleAdminSaved} />
                        </section>

                        <section className='shrink-0 px-4 lg:px-6 xl:px-8' style={{ width: `${100 / totalSlides}%` }}>
                            <AdminPermissionsView admin={permissionsAdmin} onSaved={handlePermissionsSaved} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}