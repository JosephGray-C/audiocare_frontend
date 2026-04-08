import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SalesListView from "../components/sales/SalesListView";
import SalesFormView from "../components/sales/SalesFormView";

const PANELS = [
    { key: "list", label: "Listado" },
    { key: "form", label: "Registro" },
];

export default function Sales() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [listRefreshKey, setListRefreshKey] = useState(0);

    const totalSlides = PANELS.length;

    const trackStyle = useMemo(() => {
        return {
            transform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
        };
    }, [currentSlide]);

    function handleStartCreateSale() {
        setCurrentSlide(1);
    }

    function goToNextSlide() {
        setCurrentSlide(prev => (prev + 1) % totalSlides);
    }

    function goToPrevSlide() {
        setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
    }

    function handleSaleCreated() {
        setListRefreshKey(prev => prev + 1);
        setCurrentSlide(0);
    }

    return (
        <div className='space-y-4'>
            {/* Header/controles normales, respetando padding visual */}
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

            {/* Zona full-bleed: rompe el padding horizontal del main */}
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
                            <SalesListView refreshKey={listRefreshKey} onStartCreateSale={handleStartCreateSale} />
                        </section>

                        <section className='w-full shrink-0 px-4 lg:px-6 xl:px-8'>
                            <SalesFormView onSaleCreated={handleSaleCreated} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}