import { useState, useMemo } from "react";

type SortDirection = "asc" | "desc";

interface UseSortingReturn<T> {
  readonly sortedItems: T[];
  readonly sortKey: keyof T | null;
  readonly sortDirection: SortDirection;
  readonly setSortKey: (key: keyof T) => void;
  readonly toggleSort: (key: keyof T) => void;
}

export function useSorting<T extends Record<string, any>>(
  items: T[],
  initialSortKey?: keyof T
): UseSortingReturn<T> {
  const [sortKey, setSortKey] = useState<keyof T | null>(initialSortKey ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedItems = useMemo(() => {
    if (!sortKey) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === bValue) return 0;

      const isAsc = sortDirection === "asc";
      if (typeof aValue === "string") {
        return isAsc
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (isAsc) {
        return aValue < bValue ? -1 : 1;
      }
      return aValue > bValue ? -1 : 1;
    });
  }, [items, sortKey, sortDirection]);

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return {
    sortedItems,
    sortKey,
    sortDirection,
    setSortKey,
    toggleSort,
  };
}
