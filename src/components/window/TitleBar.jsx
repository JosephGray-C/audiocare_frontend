import { getCurrentWindow } from "@tauri-apps/api/window";
import WindowControls from "./WindowControls";
import { useLocation } from "react-router-dom";
import { menu } from "../../config/menu";

const appWindow = getCurrentWindow();

export default function TitleBar() {
    const location = useLocation();

    const currentPage = menu.find(item => item.path === location.pathname);
    const title = currentPage?.name || "Audiocare";

    function handleDoubleClick() {
        appWindow.toggleMaximize();
    }

    return (
        <header className='flex items-center h-7 bg-[#0f172a] text-white select-none border-b border-slate-800'>
            {/* DRAG REGION */}
            <div
                data-tauri-drag-region
                onDoubleClick={handleDoubleClick}
                className='flex items-center px-3 text-[12px] font-semibold flex-1 text-gray-100'
            >
                {title}
            </div>

            {/* CONTROLS */}
            <WindowControls />
        </header>
    );
}
