import { ChevronLeft, ChevronRight } from "lucide-react";
import AppToolTip from "./AppToolTip";

const MAX_PAGES_WITHOUT_GAPS = 7;
const EDGE_WINDOW_SIZE = 5;
const CONTEXT_RADIUS = 1;
const CONTEXT_WINDOW_SIZE = CONTEXT_RADIUS * 2 + 1;

function createPageIndicator(page) {
  return { type: "page", page };
}

function createGapIndicator(key) {
  return { type: "gap", key };
}

function createPageRange(startPage, endPage) {
  return Array.from({ length: endPage - startPage + 1 }, (_, index) =>
    createPageIndicator(startPage + index),
  );
}

function getVisibleIndicators(totalPages, currentPage) {
  if (totalPages <= MAX_PAGES_WITHOUT_GAPS) {
    return createPageRange(1, totalPages);
  }

  const startEdgeThreshold = CONTEXT_WINDOW_SIZE + 1;
  const endEdgeThreshold = totalPages - CONTEXT_WINDOW_SIZE;
  const endWindowStart = totalPages - EDGE_WINDOW_SIZE + 1;

  if (currentPage <= startEdgeThreshold) {
    return [
      ...createPageRange(1, EDGE_WINDOW_SIZE),
      createGapIndicator("gap-end"),
      createPageIndicator(totalPages),
    ];
  }

  if (currentPage >= endEdgeThreshold) {
    return [
      createPageIndicator(1),
      createGapIndicator("gap-start"),
      ...createPageRange(endWindowStart, totalPages),
    ];
  }

  return [
    createPageIndicator(1),
    createGapIndicator(`gap-left-${currentPage}`),
    ...createPageRange(
      currentPage - CONTEXT_RADIUS,
      currentPage + CONTEXT_RADIUS,
    ),
    createGapIndicator(`gap-right-${currentPage}`),
    createPageIndicator(totalPages),
  ];
}

export default function ListPagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
  hideWhenSinglePage = true,
}) {
  const hasMultiplePages = totalPages > 1;

  if (!hasMultiplePages && hideWhenSinglePage) {
    return null;
  }

  const isPrevDisabled = currentPage <= 1 || !hasMultiplePages;
  const isNextDisabled = currentPage >= totalPages || !hasMultiplePages;
  const visibleIndicators = getVisibleIndicators(totalPages, currentPage);

  function handlePageChange(nextPage) {
    if (
      !onPageChange ||
      nextPage === currentPage ||
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    onPageChange(nextPage);
  }

  return (
    <div className={`flex ${className}`}>
      <div className="inline-flex min-h-8 items-center gap-3 sm:gap-4">
        <div
          className="flex items-center gap-1.5 sm:gap-2"
          aria-label={`Página ${currentPage} de ${totalPages}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {visibleIndicators.map((indicator) => {
            if (indicator.type === "gap") {
              return (
                <span
                  key={indicator.key}
                  className="flex items-center gap-1 px-0.5"
                  aria-hidden="true"
                >
                  <span className="h-1 w-1 rounded-full bg-slate-200" />
                  <span className="h-1 w-1 rounded-full bg-slate-200" />
                </span>
              );
            }

            const isActive = indicator.page === currentPage;

            return (
              <span
                key={indicator.page}
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? "h-2.5 w-5 bg-[#ef7d2d]"
                    : "h-2.5 w-2.5 bg-slate-300"
                }`}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <AppToolTip message="Página anterior" position="top">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={isPrevDisabled}
              aria-label="Página anterior"
              className="inline-flex items-center justify-center text-slate-400 transition-colors hover:text-[#ef7d2d] disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </button>
          </AppToolTip>

          <AppToolTip message="Página siguiente" position="top">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={isNextDisabled}
              aria-label="Página siguiente"
              className="inline-flex items-center justify-center text-slate-400 transition-colors hover:text-[#ef7d2d] disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <ChevronRight size={22} strokeWidth={2.2} />
            </button>
          </AppToolTip>
        </div>
      </div>
    </div>
  );
}
