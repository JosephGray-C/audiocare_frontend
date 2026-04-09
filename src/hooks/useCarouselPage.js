import { useEffect, useCallback } from "react";

export default function useCarouselPage(currentSlide) {
    useEffect(() => {
        const scrollContainer = document.querySelector(".main-content-scroll") || document.querySelector(".scroll-area");

        if (scrollContainer) {
            scrollContainer.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    }, [currentSlide]);

    const getSlideClasses = useCallback(
        index => {
            const isActive = index === currentSlide;
            const isLeft = index < currentSlide;
            const isRight = index > currentSlide;

            if (isActive) {
                return "relative translate-x-0 opacity-100 pointer-events-auto";
            }

            if (isLeft) {
                return "absolute inset-0 -translate-x-full opacity-0 pointer-events-none";
            }

            if (isRight) {
                return "absolute inset-0 translate-x-full opacity-0 pointer-events-none";
            }

            return "absolute inset-0 opacity-0 pointer-events-none";
        },
        [currentSlide],
    );

    return {
        getSlideClasses,
    };
}
