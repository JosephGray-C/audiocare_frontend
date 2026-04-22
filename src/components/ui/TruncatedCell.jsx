import { useLayoutEffect, useRef, useState } from "react";
import AppToolTip from "./AppToolTip";

export default function TruncatedCell({
  value,
  fallback = "—",
  className = "",
  contentClassName = "",
  tooltipValue,
  tooltipPosition = "top",
}) {
  const contentRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const resolvedValue =
    value === null || value === undefined || value === ""
      ? fallback
      : String(value);
  const resolvedTooltip =
    tooltipValue ?? (resolvedValue === fallback ? "" : resolvedValue);
  const tooltipMessage = isTruncated ? resolvedTooltip : "";

  useLayoutEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return undefined;
    }

    let frameId = 0;
    let resizeObserver;

    const measureTruncation = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const current = contentRef.current;

        if (!current) {
          return;
        }

        if (current.clientWidth === 0 && current.clientHeight === 0) {
          setIsTruncated(false);
          return;
        }

        const nextIsTruncated =
          current.scrollWidth - current.clientWidth > 1 ||
          current.scrollHeight - current.clientHeight > 1;

        setIsTruncated((previous) =>
          previous === nextIsTruncated ? previous : nextIsTruncated,
        );
      });
    };

    measureTruncation();

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measureTruncation);
      resizeObserver.observe(element);
    } else {
      window.addEventListener("resize", measureTruncation);
    }

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureTruncation);
    };
  }, [resolvedValue, className, contentClassName]);

  return (
    <div className={className}>
      <AppToolTip
        message={tooltipMessage}
        position={tooltipPosition}
        className="block min-w-0"
        anchorRef={contentRef}
        triggerDisplay="block"
      >
        <span
          ref={contentRef}
          className={`block min-w-0 truncate ${contentClassName}`}
        >
          {resolvedValue}
        </span>
      </AppToolTip>
    </div>
  );
}
