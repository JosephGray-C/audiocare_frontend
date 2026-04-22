import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  CALENDAR_WEEKDAY_LABELS,
  formatAccessibleDate,
  formatDateValue,
  getCalendarDays,
  getCalendarMonthLabel,
  getTodayDateValue,
  isSameCalendarDay,
  parseDateInputValue,
  shiftCalendarMonth,
  toDateInputValue,
} from "../../utils/date";

function isDateOutOfBounds(date, minDate, maxDate) {
  if (!date) return true;

  if (minDate && date < minDate) {
    return true;
  }

  if (maxDate && date > maxDate) {
    return true;
  }

  return false;
}

const DATE_PICKER_MIN_WIDTH = 288;
const DATE_PICKER_MAX_WIDTH = 360;
const DATE_PICKER_VIEWPORT_PADDING = 12;
const DATE_PICKER_OFFSET = 8;

export default function AppDatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = "Seleccione fecha",
  error,
  disabled = false,
  min,
  max,
  className = "",
  variant = "default",
  allowClear = false,
}) {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const todayDateRef = useRef(parseDateInputValue(getTodayDateValue()));
  const [open, setOpen] = useState(false);
  const [positioned, setPositioned] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({
    top: -9999,
    left: -9999,
    width: DATE_PICKER_MIN_WIDTH,
  });
  const selectedDate = parseDateInputValue(value);
  const isFilterVariant = variant === "filter";
  const todayDate = todayDateRef.current;
  const minDate = parseDateInputValue(min);
  const maxDate = parseDateInputValue(max);
  const canUsePortal = typeof document !== "undefined";
  const [viewDate, setViewDate] = useState(
    selectedDate || todayDate || new Date(),
  );

  useEffect(() => {
    if (selectedDate) {
      setViewDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
      return;
    }

    if (todayDate) {
      setViewDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    }
  }, [todayDate, value]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (
        !containerRef.current?.contains(event.target) &&
        !popoverRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const updatePopoverPosition = useCallback(() => {
    const triggerElement = triggerRef.current;
    const popoverElement = popoverRef.current;

    if (!triggerElement || !popoverElement) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const popoverHeight = popoverElement.offsetHeight;
    const maxAllowedWidth =
      window.innerWidth - DATE_PICKER_VIEWPORT_PADDING * 2;
    const width = Math.min(
      Math.max(triggerRect.width, DATE_PICKER_MIN_WIDTH),
      DATE_PICKER_MAX_WIDTH,
      maxAllowedWidth,
    );

    let left = triggerRect.left;

    if (left + width > window.innerWidth - DATE_PICKER_VIEWPORT_PADDING) {
      left = triggerRect.right - width;
    }

    left = Math.min(
      Math.max(left, DATE_PICKER_VIEWPORT_PADDING),
      window.innerWidth - DATE_PICKER_VIEWPORT_PADDING - width,
    );

    const preferredTop = triggerRect.bottom + DATE_PICKER_OFFSET;
    const topIfAbove = triggerRect.top - popoverHeight - DATE_PICKER_OFFSET;
    const fitsBelow =
      preferredTop + popoverHeight <=
      window.innerHeight - DATE_PICKER_VIEWPORT_PADDING;
    const fitsAbove = topIfAbove >= DATE_PICKER_VIEWPORT_PADDING;

    let top = preferredTop;

    if (!fitsBelow && fitsAbove) {
      top = topIfAbove;
    } else if (!fitsBelow) {
      top = Math.max(
        DATE_PICKER_VIEWPORT_PADDING,
        window.innerHeight -
          DATE_PICKER_VIEWPORT_PADDING -
          popoverHeight,
      );
    }

    setPopoverStyle({ top, left, width });
    setPositioned(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }

    setPositioned(false);
    updatePopoverPosition();

    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [open, updatePopoverPosition]);

  const displayValue = formatDateValue(value);
  const calendarDays = getCalendarDays(viewDate);
  const stateClasses = error
    ? "border-red-300 bg-red-50/40"
    : disabled
      ? "border-slate-200 bg-slate-50"
      : open
        ? "border-[#34c3d6] bg-white ring-4 ring-[#34c3d6]/10 shadow-[0_12px_32px_-20px_rgba(52,195,214,0.42)]"
        : "border-slate-200 bg-white hover:border-slate-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";
  const triggerSizeClasses = isFilterVariant
    ? "min-h-[42px] px-3 py-2 pr-16"
    : "min-h-[46px] px-3.5 py-2.5 pr-16";

  function updateDate(nextValue) {
    onChange?.(nextValue);
  }

  function handleTriggerKeyDown(event) {
    if (disabled) return;

    if (["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleDateSelect(nextValue) {
    updateDate(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleClear(event) {
    event.stopPropagation();
    updateDate("");
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <button
          ref={triggerRef}
          id={id}
          name={name}
          type="button"
          onClick={() => !disabled && setOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
          disabled={disabled}
          aria-label={displayValue || placeholder}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-invalid={Boolean(error)}
          className={`flex w-full items-center rounded-xl border text-left transition-all ${triggerSizeClasses} ${stateClasses}`}
        >
          <Calendar
            size={isFilterVariant ? 14 : 15}
            className={`${isFilterVariant ? "mr-2" : "mr-2.5"} shrink-0 ${
              error ? "text-red-400" : "text-slate-400"
            }`}
          />

          <span className="min-w-0 flex-1 truncate">
            <span
              className={`block truncate text-sm ${displayValue ? "text-slate-700" : "text-slate-300"}`}
            >
              {displayValue || placeholder}
            </span>
          </span>
        </button>

        {allowClear && displayValue && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 ${
              isFilterVariant ? "right-8 h-6 w-6" : "right-9 h-7 w-7"
            }`}
            aria-label="Limpiar fecha"
          >
            <X size={isFilterVariant ? 13 : 14} />
          </button>
        ) : null}

        <ChevronDown
          size={isFilterVariant ? 14 : 16}
          className={`pointer-events-none absolute top-1/2 shrink-0 -translate-y-1/2 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          } ${isFilterVariant ? "right-2.5" : "right-3"}`}
        />
      </div>

      {open &&
        canUsePortal &&
        createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Selector de fecha"
          className={`fixed z-[220] overflow-hidden border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-950/5 backdrop-blur-sm transition-[opacity,transform] duration-150 ${
            isFilterVariant ? "rounded-xl" : "rounded-2xl"
          } ${positioned ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
          style={{
            top: `${popoverStyle.top}px`,
            left: `${popoverStyle.left}px`,
            width: `${popoverStyle.width}px`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setViewDate((prev) => shiftCalendarMonth(prev, -1))
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <p className="text-sm font-semibold text-slate-800">
              {getCalendarMonthLabel(viewDate)}
            </p>

            <button
              type="button"
              onClick={() => setViewDate((prev) => shiftCalendarMonth(prev, 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {CALENDAR_WEEKDAY_LABELS.map((dayLabel) => (
              <span
                key={dayLabel}
                className="py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                {dayLabel}
              </span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayDate = day.date;
              const isSelected = selectedDate
                ? isSameCalendarDay(dayDate, selectedDate)
                : false;
              const isToday = todayDate
                ? isSameCalendarDay(dayDate, todayDate)
                : false;
              const isDisabled = isDateOutOfBounds(dayDate, minDate, maxDate);

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDateSelect(day.value)}
                  disabled={isDisabled}
                  aria-label={formatAccessibleDate(day.value)}
                className={`relative flex h-10 items-center justify-center rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-[#34c3d6] text-white ring-1 ring-[#34c3d6]/20"
                      : isDisabled
                        ? "cursor-not-allowed text-slate-200"
                        : day.isCurrentMonth
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300 hover:bg-slate-50"
                  } ${isToday && !isSelected ? "ring-1 ring-[#ef7d2d]/40 bg-[#ef7d2d]/5 text-[#ef7d2d]" : ""}`}
                >
                  {dayDate.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() =>
                handleDateSelect(toDateInputValue(todayDate || new Date()))
              }
              className="text-xs font-semibold uppercase tracking-wider text-[#34c3d6] transition-colors hover:text-[#28b4c8]"
            >
              Ir a hoy
            </button>

            <span className="text-xs text-slate-400">
              {displayValue || "Sin fecha seleccionada"}
            </span>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}
