import { useRef, useState } from "react";
import { Calendar, Eye, EyeOff } from "lucide-react";
import AppToolTip from "../ui/AppToolTip";

export default function FormField({
  name,
  label,
  type = "text",
  icon: Icon,
  iconTooltip = "",
  dateTooltip = "Abrir calendario",
  placeholder,
  value,
  prefix,
  onChange,
  error,
  disabled = false,
  autoComplete,
  containerClassName = "",
  inputClassName = "",
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  const isPasswordField = type === "password";
  const isDateField = type === "date";
  const inputType = isPasswordField
    ? showPassword
      ? "text"
      : "password"
    : type;

  const stateClasses = error
    ? "border-red-300 bg-red-50/40"
    : disabled
      ? "border-slate-200 bg-slate-50"
      : "border-slate-200 bg-white hover:border-slate-300 focus-within:border-[#34c3d6] focus-within:ring-4 focus-within:ring-[#34c3d6]/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

  const accentColor = error ? "text-red-400" : "text-slate-400";

  function handleOpenDatePicker() {
    if (!inputRef.current || disabled) return;

    if (typeof inputRef.current.showPicker === "function") {
      inputRef.current.showPicker();
      return;
    }

    inputRef.current.focus();
  }

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-600"
      >
        {label}
      </label>

      <div
        className={`
                    flex min-h-[46px] items-center w-full rounded-xl border px-3.5 py-2.5 transition-all
                    ${stateClasses}
                `}
      >
        {Icon ? (
          iconTooltip ? (
            <AppToolTip message={iconTooltip} position="top">
              <span className={`mr-2.5 inline-flex shrink-0 ${accentColor}`}>
                <Icon size={15} />
              </span>
            </AppToolTip>
          ) : (
            <Icon size={15} className={`mr-2.5 shrink-0 ${accentColor}`} />
          )
        ) : null}

        {prefix ? (
          <span className={`mr-2 shrink-0 text-sm ${accentColor}`}>
            {prefix}
          </span>
        ) : null}

        <input
          ref={inputRef}
          id={name}
          name={name}
          type={inputType}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
                        w-full min-w-0 bg-transparent text-sm text-slate-700
                        placeholder:text-slate-300 outline-none disabled:text-slate-500
                        ${isDateField ? "date-input-no-native-picker" : ""}
                        ${inputClassName}
                    `}
          {...inputProps}
        />

        {isDateField && (
          <AppToolTip message={dateTooltip} position="top">
            <button
              type="button"
              onClick={handleOpenDatePicker}
              disabled={disabled}
              className="ml-2 shrink-0 text-slate-400 transition-colors hover:text-[#34c3d6] disabled:text-slate-300"
              aria-label={dateTooltip}
            >
              <Calendar size={15} />
            </button>
          </AppToolTip>
        )}

        {isPasswordField && (
          <AppToolTip
            message={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            position="top"
          >
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={disabled}
              className="ml-2 shrink-0 text-slate-400 transition-colors hover:text-[#34c3d6] disabled:text-slate-300"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </AppToolTip>
        )}
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
