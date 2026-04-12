import { useState, useMemo } from "react";

interface UsePaginationReturn<T> {
  readonly items: T[];
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly itemsPerPage: number;
  readonly goToPage: (page: number) => void;
  readonly nextPage: () => void;
  readonly prevPage: () => void;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
}

export function usePagination<T>(
  allItems: T[],
  itemsPerPage: number = 10
): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const { items, totalPages } = useMemo(() => {
    const total = Math.ceil(allItems.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = allItems.slice(start, end);
    return { items: paginatedItems, totalPages: total };
  }, [allItems, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNum);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    items,
    currentPage,
    totalPages,
    totalItems: allItems.length,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}
