import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

/**
 * Reusable searchable dropdown select.
 *
 * Props:
 *  - options: Array of { value, label, sublabel? }
 *  - value: currently selected value (or null)
 *  - onChange: (value) => void
 *  - placeholder: placeholder text
 *  - searchPlaceholder: placeholder for the search input inside dropdown
 *  - icon: optional Lucide icon component
 *  - error: error message string
 *  - disabled: boolean
 */
export default function SearchableSelect({
                                             options = [],
                                             value,
                                             onChange,
                                             placeholder = "Seleccione...",
                                             searchPlaceholder = "Buscar...",
                                             icon: Icon,
                                             error,
                                             disabled = false,
                                         }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);
    const searchRef = useRef(null);

    const selected = options.find(o => o.value === value);

    // Close on outside click
    useEffect(() => {
        function handleClick(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Focus search when opening
    useEffect(() => {
        if (open && searchRef.current) {
            searchRef.current.focus();
        }
    }, [open]);

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
    );

    function handleSelect(val) {
        onChange(val);
        setOpen(false);
        setSearch("");
    }

    function handleClear(e) {
        e.stopPropagation();
        onChange(null);
        setSearch("");
    }

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setOpen(prev => !prev)}
                disabled={disabled}
                className={`
                    flex items-center w-full rounded-xl border px-3.5 py-2.5 text-left transition-colors
                    ${error
                    ? "border-red-300 bg-red-50/40"
                    : disabled
                        ? "border-slate-200 bg-slate-50 cursor-not-allowed"
                        : open
                            ? "border-[#34c3d6] bg-white"
                            : "border-slate-200 bg-white hover:border-slate-300"
                }
                `}
            >
                {Icon && (
                    <Icon size={15} className={`mr-2.5 shrink-0 ${error ? "text-red-400" : "text-slate-400"}`} />
                )}

                <span className={`flex-1 min-w-0 text-sm truncate ${selected ? "text-slate-700" : "text-slate-300"}`}>
                    {selected ? selected.label : placeholder}
                </span>

                {selected && !disabled ? (
                    <X
                        size={14}
                        className="ml-2 shrink-0 text-slate-400 hover:text-slate-600 cursor-pointer"
                        onClick={handleClear}
                    />
                ) : (
                    <ChevronDown
                        size={14}
                        className={`ml-2 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-[200] mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-lg">
                    {/* Search input — always visible */}
                    <div className="px-3 pt-3 pb-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#34c3d6]"
                            />
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="max-h-60 overflow-y-auto rounded-b-xl">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center">
                                Sin resultados
                            </div>
                        ) : (
                            filtered.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                                        flex flex-col w-full px-4 py-2.5 text-left transition-colors
                                        ${option.value === value
                                        ? "bg-[#34c3d6]/10 text-[#34c3d6]"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }
                                    `}
                                >
                                    <span className="text-sm font-medium truncate">{option.label}</span>
                                    {option.sublabel && (
                                        <span className="text-xs text-slate-400 truncate">{option.sublabel}</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}