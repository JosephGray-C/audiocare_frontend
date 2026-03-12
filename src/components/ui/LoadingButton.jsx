import { Loader2 } from "lucide-react";

export default function LoadingButton({ loading, children, className = "", ...props }) {
    return (
        <button
            {...props}
            disabled={loading || props.disabled}
            className={`
                flex items-center justify-center gap-2
                px-8 py-2.5 rounded-xl
                bg-[#34c3d6] text-white
                hover:bg-[#28b4c8]
                text-sm font-semibold
                disabled:opacity-50 disabled:cursor-not-allowed
                transition
                ${className}
            `}
        >
            {loading && <Loader2 size={16} className='animate-spin' />}

            {loading ? "Guardando..." : children}
        </button>
    );
}
