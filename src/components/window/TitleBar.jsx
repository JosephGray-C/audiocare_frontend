import { getCurrentWindow } from "@tauri-apps/api/window";
import WindowControls from "./WindowControls";
import ProfileDropdown from "./ProfileDropdown";
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
        <header className="h-8 shrink-0 bg-[#f8f8f8] border-b border-slate-200 select-none">
            <div className="flex items-center h-full">
                {/* Left — draggable title area */}
                <div
                    data-tauri-drag-region
                    onDoubleClick={handleDoubleClick}
                    className="flex items-center flex-1 h-full px-6"
                >
                    <span className="text-sm font-semibold text-slate-700">{title}</span>
                </div>

                {/* Right — profile + window controls */}
                <div className="flex items-center h-full">
                    <ProfileDropdown />
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <WindowControls />
                </div>
            </div>
        </header>
    );
}
