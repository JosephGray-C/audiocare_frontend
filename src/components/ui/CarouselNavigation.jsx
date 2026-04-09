import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CarouselNavigation({ currentSlide = 0, setCurrentSlide, totalSlides = 1, className = "", justify = "between" }) {
    const justifyClass = justify === "center" ? "justify-center" : justify === "start" ? "justify-start" : "justify-between";

    function goToNextSlide() {
        setCurrentSlide(prev => (prev + 1) % totalSlides);
    }

    function goToPrevSlide() {
        setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
    }

    return (
        <div className={`flex items-center ${justifyClass} ${className}`}>
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
                    {Array.from({ length: totalSlides }).map((_, index) => {
                        const isActive = index === currentSlide;

                        return (
                            <div
                                key={index}
                                className={`
                                    rounded-full transition-all duration-300
                                    ${isActive ? "w-7 h-2.5 bg-[#34c3d6]" : "w-2.5 h-2.5 bg-slate-300"}
                                `}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
