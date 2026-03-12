import { useEffect, useState } from "react";

export default function useWindowWidth() {
    const getWidth = () => window.innerWidth;

    const [windowWidth, setWindowWidth] = useState(getWidth);

    useEffect(() => {
        function handleResize() {
            setWindowWidth(getWidth());
        }

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return windowWidth;
}