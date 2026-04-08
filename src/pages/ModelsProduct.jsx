import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ModelProductListView from "../components/models/ModelProductListView";
import ModelProductFormView from "../components/models/ModelProductFormView";

const PANELS = [
    { key: "list", label: "Listado" },
    { key: "form", label: "Formulario" },
];

export default function ModelosProducto() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedModel, setSelectedModel] = useState(null);

    const totalSlides = PANELS.length;

    const trackStyle = useMemo(() => {
        return {
            transform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
        };
    }, [currentSlide]);

    function goToNextSlide() {
        setCurrentSlide(prev => (prev + 1) % totalSlides);
    }

    function goToPrevSlide() {
        setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
    }

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
                            flex w-full transform-gpu will-change-transform
                            transition-transform duration-500
                            ease-[cubic-bezier(0.22,1,0.36,1)]
                        '
                        style={trackStyle}
                    >
                        <section className='w-full shrink-0 px-4 lg:px-6 xl:px-8'>
                            <ModelProductListView refreshKey={refreshKey} onStartCreate={handleStartCreate} onStartEdit={handleStartEdit} />
                        </section>

                        <section className='w-full shrink-0 px-4 lg:px-6 xl:px-8'>
                            <ModelProductFormView model={selectedModel} onSaved={handleModelSaved} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
