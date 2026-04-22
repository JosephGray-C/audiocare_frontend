import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function AppToolTip({
  message,
  children,
  position = "right",
  className = "",
  anchorRef,
  triggerDisplay = "inline-flex",
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [positioned, setPositioned] = useState(false);
  const [coords, setCoords] = useState({ top: -9999, left: -9999 });
  const hasMessage = Boolean(message);
  const resolvedPosition = ["top", "bottom", "left", "right"].includes(position)
    ? position
    : "right";
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const open = hasMessage && (hovered || focused);
  const visible = open && positioned;
  const canUsePortal = typeof document !== "undefined";

  const updatePosition = useCallback(() => {
    const anchorElement = anchorRef?.current || triggerRef.current;

    if (!anchorElement || !tooltipRef.current) return;

    const triggerRect = anchorElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 10;
    const viewportPadding = 8;

    let top = 0;
    let left = 0;

    if (resolvedPosition === "top") {
      top = triggerRect.top - tooltipRect.height - gap;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (resolvedPosition === "bottom") {
      top = triggerRect.bottom + gap;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (resolvedPosition === "left") {
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.left - tooltipRect.width - gap;
    } else {
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.right + gap;
    }

    const maxLeft = window.innerWidth - tooltipRect.width - viewportPadding;
    const maxTop = window.innerHeight - tooltipRect.height - viewportPadding;

    setCoords({
      top: Math.min(Math.max(top, viewportPadding), maxTop),
      left: Math.min(Math.max(left, viewportPadding), maxLeft),
    });
    setPositioned(true);
  }, [anchorRef, resolvedPosition]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  function handleFocusCapture(event) {
    const target = event.target;
    if (target?.matches?.(":focus-visible")) {
      setPositioned(false);
      setFocused(true);
    }
  }

  function handleBlurCapture(event) {
    const nextFocused = event.relatedTarget;
    if (!event.currentTarget.contains(nextFocused)) {
      setFocused(false);
      setPositioned(false);
    }
  }

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent",
  };
  const originClasses = {
    top: "origin-bottom",
    bottom: "origin-top",
    left: "origin-right",
    right: "origin-left",
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      style={{ display: triggerDisplay }}
      onMouseEnter={() => {
        if (!hasMessage) return;
        setPositioned(false);
        setHovered(true);
      }}
      onMouseLeave={() => {
        if (!hasMessage) return;
        setHovered(false);
        setPositioned(false);
      }}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      {children}

      {hasMessage &&
        canUsePortal &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`
                            pointer-events-none fixed z-[9999]
                            whitespace-nowrap rounded-md
                            bg-slate-900/95 px-2.5 py-1.5
                            text-[11px] font-medium leading-tight text-white
                            backdrop-blur-sm shadow-[0_12px_28px_-12px_rgba(15,23,42,0.75)]
                            transition-[opacity,transform] duration-150 ease-out
                            ${originClasses[resolvedPosition]}
                            ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
                        `}
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            role="tooltip"
            aria-hidden={!visible}
          >
            {message}

            <span
              className={`
                                absolute h-0 w-0 border-[5px]
                                ${arrowClasses[resolvedPosition]}
                            `}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
