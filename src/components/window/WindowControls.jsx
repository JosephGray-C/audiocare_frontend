import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import AppToolTip from "../ui/AppToolTip";

const appWindow = getCurrentWindow();

export default function WindowControls() {
    return (
        <div className='flex items-center h-full '>
            <AppToolTip message='Minimizar' position='bottom'>
                <button
                    onClick={() => appWindow.minimize()}
                    className='
                        w-8 h-8
                        flex items-center justify-center
                        text-slate-400
                        hover:bg-slate-200
                        hover:text-slate-700
                        transition-colors duration-150
                    '
                    aria-label='Minimizar'
                >
                    <Minus size={15} strokeWidth={2} />
                </button>
            </AppToolTip>

            <AppToolTip message='Maximizar / Restaurar' position='bottom'>
                <button
                    onClick={() => appWindow.toggleMaximize()}
                    className='
                        w-8 h-8
                        flex items-center justify-center
                        text-slate-400
                        hover:bg-slate-200
                        hover:text-slate-700
                        transition-colors duration-150
                    '
                    aria-label='Maximizar'
                >
                    <Square size={13} strokeWidth={2} />
                </button>
            </AppToolTip>

            <AppToolTip message='Cerrar' position='bottom'>
                <button
                    onClick={() => appWindow.close()}
                    className='
                        w-8 h-8
                        flex items-center justify-center
                        text-slate-400
                        hover:bg-red-500
                        hover:text-white
                        transition-colors duration-150
                    '
                    aria-label='Cerrar'
                >
                    <X size={15} strokeWidth={2} />
                </button>
            </AppToolTip>
        </div>
    );
}
