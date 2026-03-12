import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

const appWindow = getCurrentWindow();

export default function WindowControls() {
    return (
        <div className='flex items-center h-full pr-2'>
            <button
                onClick={() => appWindow.minimize()}
                className='
                    w-9 h-9
                    flex items-center justify-center
                    rounded-lg
                    text-slate-400
                    hover:bg-slate-200
                    hover:text-slate-700
                    transition-colors duration-150
                '
                aria-label='Minimizar'
            >
                <Minus size={15} strokeWidth={2} />
            </button>

            <button
                onClick={() => appWindow.toggleMaximize()}
                className='
                    w-9 h-9
                    flex items-center justify-center
                    rounded-lg
                    text-slate-400
                    hover:bg-slate-200
                    hover:text-slate-700
                    transition-colors duration-150
                '
                aria-label='Maximizar'
            >
                <Square size={13} strokeWidth={2} />
            </button>

            <button
                onClick={() => appWindow.close()}
                className='
                    w-9 h-9
                    flex items-center justify-center
                    rounded-lg
                    text-slate-400
                    hover:bg-red-500
                    hover:text-white
                    transition-colors duration-150
                '
                aria-label='Cerrar'
            >
                <X size={15} strokeWidth={2} />
            </button>
        </div>
    );
}
