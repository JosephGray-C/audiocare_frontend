import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Seleccione...",
  searchPlaceholder = "Buscar...",
  icon: Icon,
  error,
  disabled = false,
  className = "",
  variant = "default",
  showSearch = true,
  clearAriaLabel = "Limpiar selección",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const isFilterVariant = variant === "filter";

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const filteredOptions = options.filter((option) => {
    const normalizedSearch = search.toLowerCase();

    return (
      option.label.toLowerCase().includes(normalizedSearch) ||
      option.sublabel?.toLowerCase().includes(normalizedSearch)
    );
  });

  const triggerStateClasses = error
    ? "border-red-300 bg-red-50/40"
    : disabled
      ? "border-slate-200 bg-slate-50"
      : open
        ? "border-[#34c3d6] bg-white ring-4 ring-[#34c3d6]/10 shadow-[0_12px_32px_-20px_rgba(52,195,214,0.42)]"
        : "border-slate-200 bg-white hover:border-slate-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";
  const triggerSizeClasses = isFilterVariant
    ? "min-h-[42px] px-3 py-2 pr-16"
    : "min-h-[46px] px-3.5 py-2.5 pr-20";
  const iconSize = isFilterVariant ? 14 : 15;
  const chevronSize = isFilterVariant ? 14 : 15;
  const clearButtonClasses = isFilterVariant
    ? "right-8 h-6 w-6"
    : "right-10 h-7 w-7";
  const chevronClasses = isFilterVariant ? "right-2.5 h-6 w-6" : "right-3 h-7 w-7";
  const optionPaddingClasses = isFilterVariant ? "px-3 py-2" : "px-3 py-2.5";
  const panelSpacingClasses = isFilterVariant
    ? "mt-1.5 rounded-xl"
    : "mt-2 rounded-2xl";

  function handleSelect(nextValue) {
    onChange?.(nextValue);
    setOpen(false);
    setSearch("");
  }

  function handleClear(event) {
    event.stopPropagation();
    onChange?.(null);
    setSearch("");
  }

  function handleTriggerKeyDown(event) {
    if (disabled) return;

    if (["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listboxId : undefined}
          aria-invalid={Boolean(error)}
          className={`flex w-full items-center rounded-xl border text-left transition-all ${triggerSizeClasses} ${triggerStateClasses}`}
        >
          {Icon ? (
            <Icon
              size={iconSize}
              className={`${isFilterVariant ? "mr-2" : "mr-2.5"} shrink-0 ${
                error ? "text-red-400" : "text-slate-400"
              }`}
            />
          ) : null}

          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-sm ${
                selected ? "text-slate-700" : "text-slate-300"
              }`}
            >
              {selected ? selected.label : placeholder}
            </span>

            {!isFilterVariant && selected?.sublabel ? (
              <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                {selected.sublabel}
              </span>
            ) : null}
          </span>
        </button>

        {selected && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 ${clearButtonClasses}`}
            aria-label={clearAriaLabel}
          >
            <X size={isFilterVariant ? 13 : 14} />
          </button>
        ) : null}

        <span
          className={`pointer-events-none absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          } ${chevronClasses}`}
        >
          <ChevronDown size={chevronSize} />
        </span>
      </div>

      {open && (
        <div
          className={`absolute z-[200] w-full overflow-hidden border border-slate-200 bg-white shadow-[0_20px_52px_-24px_rgba(15,23,42,0.35)] ring-1 ring-slate-950/5 ${panelSpacingClasses}`}
        >
          {showSearch ? (
            <div className="border-b border-slate-100 bg-slate-50/70 px-3 py-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-[#34c3d6] focus:ring-4 focus:ring-[#34c3d6]/10"
                />
              </div>
            </div>
          ) : null}

          <div
            id={listboxId}
            role="listbox"
            className="scroll-area max-h-64 overflow-y-auto p-1.5"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-center text-sm text-slate-500">
                Sin resultados
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl text-left transition-colors ${optionPaddingClasses} ${
                      isSelected
                        ? "bg-[#34c3d6]/10 text-slate-800"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {option.label}
                      </span>
                      {option.sublabel && !isFilterVariant ? (
                        <span className="mt-0.5 block truncate text-xs text-slate-400">
                          {option.sublabel}
                        </span>
                      ) : null}
                    </span>

                    <span
                      className={`mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full transition-colors ${
                        isSelected
                          ? "bg-[#34c3d6] text-white"
                          : "text-transparent"
                      } ${isFilterVariant ? "h-4 w-4" : "h-5 w-5"}`}
                      aria-hidden="true"
                    >
                      <Check size={isFilterVariant ? 11 : 12} />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
