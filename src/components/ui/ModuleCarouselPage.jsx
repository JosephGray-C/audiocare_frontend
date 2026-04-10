import CarouselNavigation from "./CarouselNavigation";
import useCarouselPage from "../../hooks/useCarouselPage";

export default function ModuleCarouselPage({ currentSlide, setCurrentSlide, totalSlides, panelLabels = [], children }) {
    const { getSlideClasses } = useCarouselPage(currentSlide);

    const slides = Array.isArray(children) ? children : [children];

    return (
        <div className='flex min-h-full flex-col gap-4'>
            <div className='py-3'>
                <CarouselNavigation
                    currentSlide={currentSlide}
                    setCurrentSlide={setCurrentSlide}
                    totalSlides={totalSlides}
                    panelLabels={panelLabels}
                />
            </div>

            <div className='-mx-4 lg:-mx-6 xl:-mx-8'>
                <div className='w-full overflow-hidden'>
                    <div className='relative'>
                        {slides.map((slide, index) => (
                            <section
                                key={index}
                                className={`
                                    px-4 lg:px-6 xl:px-8
                                    transition-all duration-500
                                    ease-[cubic-bezier(0.22,1,0.36,1)]
                                    ${getSlideClasses(index)}
                                `}
                            >
                                {slide}
                            </section>
                        ))}
                    </div>
                </div>
            </div>

            <div className='mt-auto pt-2'>
                <CarouselNavigation
                    currentSlide={currentSlide}
                    setCurrentSlide={setCurrentSlide}
                    totalSlides={totalSlides}
                    panelLabels={panelLabels}
                    justify='center'
                />
            </div>
        </div>
    );
}
