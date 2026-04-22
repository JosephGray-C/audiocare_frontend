import { useCallback, useEffect, useRef, useState } from "react";
import useWindowWidth from "./useWindowWidth";

export const LIST_PAGE_SIZE = 10;
export const LIST_PAGE_SIZE_COMPACT = 5;
export const LIST_COMPACT_BREAKPOINT = 768;

export default function useListPagination(
  items,
  {
    pageSize = LIST_PAGE_SIZE,
    compactPageSize = LIST_PAGE_SIZE_COMPACT,
    compactBreakpoint = LIST_COMPACT_BREAKPOINT,
  } = {},
) {
  const windowWidth = useWindowWidth();
  const [anchorIndex, setAnchorIndex] = useState(0);

  const isCompact = windowWidth < compactBreakpoint;
  const totalItems = items.length;
  const resolvedPageSize = isCompact ? compactPageSize : pageSize;
  const safePageSize = Math.max(1, resolvedPageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const lastPageStart =
    totalItems === 0 ? 0 : Math.max(0, (totalPages - 1) * safePageSize);
  const safeAnchorIndex = Math.min(anchorIndex, lastPageStart);
  const currentPage =
    totalItems === 0 ? 1 : Math.floor(safeAnchorIndex / safePageSize) + 1;
  const endIndex = Math.min(safeAnchorIndex + safePageSize, totalItems);

  const pageSizeRef = useRef(safePageSize);
  const totalPagesRef = useRef(totalPages);
  const totalItemsRef = useRef(totalItems);
  const lastPageStartRef = useRef(lastPageStart);

  useEffect(() => {
    pageSizeRef.current = safePageSize;
    totalPagesRef.current = totalPages;
    totalItemsRef.current = totalItems;
    lastPageStartRef.current = lastPageStart;
  }, [safePageSize, totalPages, totalItems, lastPageStart]);

  const setCurrentPage = useCallback((nextPage) => {
    setAnchorIndex((previousAnchorIndex) => {
      const currentPageFromPrevious =
        totalItemsRef.current === 0
          ? 1
          : Math.floor(
              Math.min(previousAnchorIndex, lastPageStartRef.current) /
                pageSizeRef.current,
            ) + 1;
      const resolvedNextPage =
        typeof nextPage === "function"
          ? nextPage(currentPageFromPrevious)
          : Number(nextPage);
      const normalizedNextPage = Math.max(
        1,
        Math.min(Number(resolvedNextPage) || 1, totalPagesRef.current),
      );

      return (normalizedNextPage - 1) * pageSizeRef.current;
    });
  }, []);

  return {
    currentPage,
    setCurrentPage,
    totalItems,
    totalPages,
    pageSize: safePageSize,
    isCompact,
    paginatedItems: items.slice(safeAnchorIndex, endIndex),
    visibleStart: totalItems === 0 ? 0 : safeAnchorIndex + 1,
    visibleEnd: endIndex,
  };
}
