import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function RenderField({
    name,
    label,
    type = "text",
    icon: Icon,
    placeholder,
    value,
    prefix,
    onChange,
    error,
    disabled = false,
    autoComplete,
    ...inputProps
}) {
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordField = type === "password";
    const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;
    const stateClasses = error
        ? "border-red-300 bg-red-50/40"
        : disabled
            ? "border-slate-200 bg-slate-50"
            : "border-slate-200 bg-white focus-within:border-[#34c3d6]";
    const accentColor = error ? "text-red-400" : "text-slate-400";

    return (
        <div className="space-y-1.5">
            <label htmlFor={name} className="block text-sm font-medium text-slate-600">
                {label}
            </label>
            <div className={`flex items-center w-full rounded-xl border px-3.5 py-2.5 transition-colors ${stateClasses}`}>
                {Icon && <Icon size={15} className={`mr-2.5 shrink-0 ${accentColor}`} />}
                {prefix && <span className={`mr-2 shrink-0 text-sm ${accentColor}`}>{prefix}</span>}
                <input
                    id={name}
                    name={name}
                    type={inputType}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-300 outline-none disabled:text-slate-500"
                    {...inputProps}
                />
                {isPasswordField && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        disabled={disabled}
                        className="ml-2 shrink-0 text-slate-400 transition-colors hover:text-slate-600 disabled:text-slate-300"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
