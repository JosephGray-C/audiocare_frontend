import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

const appWindow = getCurrentWindow();

export default function WindowControls() {
    return (
        <div className='flex h-7'>
            <button
                onClick={() => appWindow.minimize()}
                className='
                    w-11 h-7
                    flex items-center justify-center
                    text-gray-400
                    hover:bg-[#2b2d31]
                    hover:text-white
                    transition-colors duration-150
                '
                aria-label='Minimizar'
            >
                <Minus size={14} strokeWidth={1.75} />
            </button>

            <button
                onClick={() => appWindow.toggleMaximize()}
                className='
                    w-11 h-7
                    flex items-center justify-center
                    text-gray-400
                    hover:bg-[#2b2d31]
                    hover:text-white
                    transition-colors duration-150
                '
                aria-label='Maximizar'
            >
                <Square size={12} strokeWidth={1.75} />
            </button>

            <button
                onClick={() => appWindow.close()}
                className='
                    w-11 h-7
                    flex items-center justify-center
                    text-gray-400
                    hover:bg-red-600
                    hover:text-white
                    transition-colors duration-150
                '
                aria-label='Cerrar'
            >
                <X size={14} strokeWidth={1.75} />
            </button>
        </div>
    );
}
